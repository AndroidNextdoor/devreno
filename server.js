const express = require('express');
const path = require('path');
const { WebClient } = require('@slack/web-api');

// Simple in-memory cache for job data
const jobCache = new Map();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Slack client
const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

// Configure express to allow all hosts for Replit proxy
app.set('trust proxy', true);

// Serve static files
app.use(express.static('.'));

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Jobs API endpoint
app.get('/api/jobs', async (req, res) => {
    try {
        if (!process.env.SLACK_BOT_TOKEN) {
            return res.status(500).json({
                error: 'Slack bot token not configured',
                messages: []
            });
        }

        if (!process.env.SLACK_JOBS_CHANNEL_ID) {
            return res.status(500).json({
                error: 'Slack jobs channel ID not configured',
                messages: []
            });
        }

        const result = await slack.conversations.history({
            channel: process.env.SLACK_JOBS_CHANNEL_ID,
            limit: 50
        });

        const messages = result.messages || [];
        console.log('[server /api/jobs] Fetched Slack messages:', {
            total: messages.length,
            sampleFirst: messages[0]
              ? { ts: messages[0].ts, user: messages[0].user, bot_id: messages[0].bot_id, username: messages[0].username }
              : null
        });

        // Collect unique user IDs present on messages (ignore bot posts)
        const userIds = Array.from(new Set(
            messages
                .filter(m => m.user && !m.bot_id)
                .map(m => m.user)
        ));
        console.log('[server /api/jobs] Unique userIds to lookup (users.info):', userIds);

        // Build map of userId -> display name
        const userMap = {};

        // First attempt: users.info per userId
        for (const userId of userIds) {
            try {
                const info = await slack.users.info({ user: userId });
                const u = info.user || {};
                const p = (u.profile || {});
                const display = (p.display_name_normalized && p.display_name_normalized.trim())
                    ? p.display_name_normalized.trim()
                    : (p.display_name || p.real_name_normalized || u.real_name || u.name || userId);
                if (display) {
                    userMap[userId] = display;
                    console.log('[server /api/jobs] users.info success', { userId, display });
                }
            } catch (e) {
                console.warn('[server /api/jobs] users.info failed', { userId, error: e.message });
            }
        }

        // Second attempt (fallback): bulk fetch via users.list to fill any missing IDs
        const missingIds = userIds.filter(id => !userMap[id]);
        if (missingIds.length > 0) {
            try {
                const list = await slack.users.list();
                const members = (list.members || []);
                let filled = 0;
                members.forEach(m => {
                    const id = m.id;
                    if (missingIds.includes(id)) {
                        const p = m.profile || {};
                        const display = (p.display_name_normalized && p.display_name_normalized.trim())
                            ? p.display_name_normalized.trim()
                            : (p.display_name || p.real_name_normalized || m.real_name || m.name || id);
                        if (display) {
                            userMap[id] = display;
                            filled++;
                        }
                    }
                });
                console.log('[server /api/jobs] users.list fallback used', { missingBefore: missingIds.length, filled });
            } catch (e) {
                console.warn('[server /api/jobs] users.list fallback failed', { error: e.message });
            }
        }

        console.log('[server /api/jobs] Built userMap size:', Object.keys(userMap).length);

        function deriveUserName(m) {
            // Priority 1: map by user ID
            if (m.user && userMap[m.user]) return userMap[m.user];
            // Priority 2: embedded user_profile fields on the message
            const up = m.user_profile || {};
            if (up.display_name_normalized && up.display_name_normalized.trim()) return up.display_name_normalized.trim();
            if (up.display_name && String(up.display_name).trim()) return String(up.display_name).trim();
            if (up.real_name_normalized && up.real_name_normalized.trim()) return up.real_name_normalized.trim();
            if (up.real_name && String(up.real_name).trim()) return String(up.real_name).trim();
            // Priority 3: legacy username field on some webhook/app posts
            if (m.username && String(m.username).trim()) return String(m.username).trim();
            return undefined;
        }

        const enriched = messages.map(m => {
            const name = deriveUserName(m);
            return name ? { ...m, userName: name } : m;
        });

        const withName = enriched.filter(m => m.userName).length;
        const withoutName = enriched.length - withName;
        console.log('[server /api/jobs] Enriched messages:', { total: enriched.length, withName, withoutName });

        res.json({
            messages: enriched,
            success: true,
            count: enriched.length
        });
    } catch (error) {
        console.error('Error fetching Slack messages:', error);
        res.status(500).json({
            error: error.message,
            messages: []
        });
    }
});

// Cache helper functions
function getCacheKey(type, page) {
    return `${type}_jobs_page_${page}`;
}

function isCacheValid(timestamp) {
    const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours
    return Date.now() - timestamp < CACHE_DURATION;
}

// Adzuna local jobs API endpoint
app.get('/api/local-jobs', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const distance = req.query.distance !== undefined ? parseInt(req.query.distance) : 75;
        const cacheKey = getCacheKey('local', `${page}_${distance}`);

        // Check cache first
        if (jobCache.has(cacheKey)) {
            const cached = jobCache.get(cacheKey);
            if (isCacheValid(cached.timestamp)) {
                return res.json(cached.data);
            }
        }

        if (!process.env.ADZUNA_APP_ID || !process.env.ADZUNA_APP_KEY) {
            return res.status(500).json({
                error: 'Adzuna API credentials not configured',
                jobs: []
            });
        }

        const adzunaUrl = `https://api.adzuna.com/v1/api/jobs/us/search/${page}?` +
            `app_id=${process.env.ADZUNA_APP_ID}` +
            `&app_key=${process.env.ADZUNA_APP_KEY}` +
            `&where=reno%20nv` +
            `&distance=${distance}` +
            `&what=software%20engineer` +
            `&results_per_page=${limit}` +
            `&sort_by=date`;

        const response = await fetch(adzunaUrl);

        if (!response.ok) {
            throw new Error(`Adzuna API error: ${response.status}`);
        }

        const data = await response.json();

        const formattedJobs = data.results.map(job => {
            // Extract just the city name, removing venues/addresses
            let cityName = job.location.display_name;
            if (job.location.area && job.location.area.length > 0) {
                cityName = job.location.area[job.location.area.length - 1]; // Get the most specific area (usually city)
            } else {
                // If no area array, parse from display_name
                const parts = cityName.split(',');
                // Look for the city part (usually after venue/address but before state)
                if (parts.length >= 2) {
                    cityName = parts[parts.length - 2].trim(); // Get city part before state
                } else {
                    cityName = parts[0].trim(); // Fallback to first part
                }
            }

            return {
                id: job.id,
                title: job.title,
                company: job.company.display_name,
                location: cityName,
                salary_min: job.salary_min,
                salary_max: job.salary_max,
                description: job.description,
                url: job.redirect_url,
                created: job.created,
                type: 'local',
                source: 'adzuna'
            };
        });

        const result = {
            jobs: formattedJobs,
            total: data.count,
            page: page,
            hasMore: page * limit < data.count,
            source: 'local_reno'
        };

        // Cache the result
        jobCache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
        });

        res.json(result);
    } catch (error) {
        console.error('Error fetching local jobs:', error);
        res.status(500).json({
            error: error.message,
            jobs: []
        });
    }
});

// RemoteOK remote jobs API endpoint
app.get('/api/remote-jobs', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const cacheKey = getCacheKey('remote', page);

        // Check cache first
        if (jobCache.has(cacheKey)) {
            const cached = jobCache.get(cacheKey);
            if (isCacheValid(cached.timestamp)) {
                return res.json(cached.data);
            }
        }

        const response = await fetch('https://remoteok.io/api');

        if (!response.ok) {
            throw new Error(`RemoteOK API error: ${response.status}`);
        }

        const allJobs = await response.json();

        // Filter for software engineering roles and paginate
        const softwareJobs = allJobs
            .filter(job => job.position && (
                job.position.toLowerCase().includes('software') ||
                job.position.toLowerCase().includes('engineer') ||
                job.position.toLowerCase().includes('developer') ||
                job.position.toLowerCase().includes('frontend') ||
                job.position.toLowerCase().includes('backend') ||
                job.position.toLowerCase().includes('full stack') ||
                job.position.toLowerCase().includes('react') ||
                job.position.toLowerCase().includes('javascript') ||
                job.position.toLowerCase().includes('python') ||
                job.position.toLowerCase().includes('node')
            ))
            .slice((page - 1) * limit, page * limit)
            .map(job => ({
                id: job.id,
                title: job.position,
                company: job.company,
                location: 'Remote',
                salary_min: null,
                salary_max: null,
                description: job.description,
                url: job.url,
                created: job.date,
                type: 'remote',
                source: 'remoteok',
                tags: job.tags || []
            }));

        const result = {
            jobs: softwareJobs,
            total: allJobs.length,
            page: page,
            hasMore: page * limit < allJobs.length,
            source: 'remote'
        };

        // Cache the result
        jobCache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
        });

        res.json(result);
    } catch (error) {
        console.error('Error fetching remote jobs:', error);
        res.status(500).json({
            error: error.message,
            jobs: []
        });
    }
});

// Combined jobs endpoint for lazy loading
app.get('/api/all-jobs', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const distance = req.query.distance !== undefined ? parseInt(req.query.distance) : 75;

        // Determine base URL from the incoming request (works locally and on Vercel)
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const host = req.get('host');
        const baseUrl = `${protocol}://${host}`;

        // Fetch local and remote jobs based on distance
        let localData = { jobs: [], hasMore: false };
        let remoteData = { jobs: [], hasMore: false };

        if (distance > 0) {
            // Fetch both local and remote jobs in parallel
            const [localResponse, remoteResponse] = await Promise.all([
                fetch(`${baseUrl}/api/local-jobs?page=${Math.ceil(page/2)}&limit=${Math.ceil(limit/2)}&distance=${distance}`),
                fetch(`${baseUrl}/api/remote-jobs?page=${Math.ceil(page/2)}&limit=${Math.floor(limit/2)}`)
            ]);
            localData = await localResponse.json();
            remoteData = await remoteResponse.json();
        } else {
            // Only fetch remote jobs when distance is 0 (Remote Only mode)
            const remoteResponse = await fetch(`${baseUrl}/api/remote-jobs?page=${page}&limit=${limit}`);
            remoteData = await remoteResponse.json();
            // Ensure no local jobs are included
            localData = { jobs: [], hasMore: false, total: 0 };
        }

        const combinedJobs = [
            ...(localData.jobs || []),
            ...(remoteData.jobs || [])
        ];

        res.json({
            jobs: combinedJobs,
            page: page,
            hasMore: localData.hasMore || remoteData.hasMore,
            local_count: localData.jobs?.length || 0,
            remote_count: remoteData.jobs?.length || 0,
            total_loaded: combinedJobs.length
        });
    } catch (error) {
        console.error('Error fetching combined jobs:', error);
        res.status(500).json({
            error: error.message,
            jobs: []
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.VERCEL ? 'production' : 'development'
    });
});

// Only start the server when running locally. In Vercel, the app is handled by the serverless runtime.
if (require.main === module) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`/dev/reno server running on http://0.0.0.0:${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log('Ready to accept connections...');
    });
}

module.exports = app;