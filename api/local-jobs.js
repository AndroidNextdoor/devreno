// Simple in-memory cache (may persist briefly between invocations)
const jobCache = new Map();

function getCacheKey(type, page, distance) {
  return `${type}_jobs_page_${page}_distance_${distance}`;
}

function isCacheValid(timestamp) {
  const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours
  return Date.now() - timestamp < CACHE_DURATION;
}

module.exports = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const distance = req.query.distance !== undefined ? parseInt(req.query.distance, 10) : 75;
    const cacheKey = getCacheKey('local', page, distance);

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

    const formattedJobs = (data.results || []).map(job => {
      let cityName = job.location.display_name;
      if (job.location.area && job.location.area.length > 0) {
        cityName = job.location.area[job.location.area.length - 1];
      } else {
        const parts = (cityName || '').split(',');
        if (parts.length >= 2) {
          cityName = parts[parts.length - 2].trim();
        } else {
          cityName = (parts[0] || '').trim();
        }
      }

      return {
        id: job.id,
        title: job.title,
        company: job.company && job.company.display_name,
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
      page,
      hasMore: page * limit < data.count,
      source: 'local_reno'
    };

    // Cache
    jobCache.set(cacheKey, { data: result, timestamp: Date.now() });

    res.json(result);
  } catch (error) {
    console.error('Error fetching local jobs:', error);
    res.status(500).json({ error: error.message, jobs: [] });
  }
};