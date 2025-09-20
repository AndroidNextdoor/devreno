// Performance-optimized jobs page functionality
(function() {
    'use strict';

    // Cache DOM elements
    const jobsContainer = document.getElementById('jobs-container');
    const jobsLoading = document.getElementById('jobs-loading');

    // Performance: Use requestIdleCallback for non-critical operations
    function scheduleWork(callback) {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(callback);
        } else {
            setTimeout(callback, 1);
        }
    }

    // Fetch jobs from our server endpoint
    async function fetchJobs() {
        try {
            const response = await fetch('/api/jobs');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Failed to fetch jobs:', error);
            return { messages: [], error: error.message };
        }
    }

    // Format timestamp for display
    function formatTimestamp(timestamp) {
        const date = new Date(parseFloat(timestamp) * 1000);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return 'Today';
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    // Extract URLs from text for social media previews
    function extractUrls(text) {
        const urlRegex = /(https?:\/\/[^\s<>]+)/g;
        return text.match(urlRegex) || [];
    }

    // Extract company and role from message text
    function parseJobInfo(text) {
        const lines = text.split('\n').filter(line => line.trim());
        const firstLine = lines[0] || text.substring(0, 100);

        // Look for common patterns
        const companyMatch = firstLine.match(/at\s+([^,\n]+)/i) ||
                           firstLine.match(/^([^-\n]+)\s*-/);
        const roleMatch = firstLine.match(/^([^-\n@]+)/i);

        return {
            company: companyMatch ? companyMatch[1].trim() : '',
            role: roleMatch ? roleMatch[1].trim() : 'Developer Position',
            urls: extractUrls(text)
        };
    }

    // Create social media preview for URLs
    function createUrlPreview(url) {
        const domain = new URL(url).hostname;
        return `
            <div class="url-preview">
                <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="url-preview-link">
                    <div class="url-preview-content">
                        <div class="url-preview-icon">
                            <i class="fas fa-external-link-alt"></i>
                        </div>
                        <div class="url-preview-text">
                            <div class="url-preview-domain">${escapeHtml(domain)}</div>
                            <div class="url-preview-url">${escapeHtml(url)}</div>
                        </div>
                    </div>
                </a>
            </div>
        `;
    }

    // Process message text to create clickable links and previews
    function processMessageText(text) {
        let processedText = escapeHtml(text);
        const urls = extractUrls(text);

        // Replace URLs with clickable links
        urls.forEach(url => {
            const escapedUrl = escapeHtml(url);
            processedText = processedText.replace(
                escapeHtml(url),
                `<a href="${escapedUrl}" target="_blank" rel="noopener noreferrer" class="inline-link">${escapedUrl}</a>`
            );
        });

        return {
            text: processedText.replace(/\n/g, '<br>'),
            urls: urls
        };
    }

    // Create job card element
    function createJobCard(message) {
        const jobInfo = parseJobInfo(message.text);
        const timestamp = formatTimestamp(message.ts);
        const processedMessage = processMessageText(message.text);

        // Create URL previews if any URLs exist
        const urlPreviews = jobInfo.urls.map(url => createUrlPreview(url)).join('');

        const card = document.createElement('div');
        card.className = 'job-card';
        card.innerHTML = `
            <div class="job-date-only">
                <span class="job-date">${timestamp}</span>
            </div>
            <div class="job-content">
                <div class="job-text">${processedMessage.text}</div>
                ${urlPreviews}
            </div>
        `;

        return card;
    }

    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Render jobs with performance optimizations
    function renderJobs(jobs) {
        const fragment = document.createDocumentFragment();

        // Batch DOM operations
        jobs.forEach(job => {
            fragment.appendChild(createJobCard(job));
        });

        // Single DOM update
        jobsContainer.appendChild(fragment);

        // Hide loading indicator
        jobsLoading.style.display = 'none';

        // Animate cards in with Intersection Observer for performance
        scheduleWork(() => {
            const cards = jobsContainer.querySelectorAll('.job-card');
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 });

            cards.forEach(card => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                observer.observe(card);
            });
        });
    }

    // Show error state
    function showError(message) {
        jobsLoading.innerHTML = `
            <i class="fas fa-exclamation-triangle" style="color: var(--accent-color);"></i>
            <span>Error loading jobs: ${escapeHtml(message)}</span>
        `;
    }

    // Show empty state
    function showEmptyState() {
        jobsLoading.innerHTML = `
            <i class="fas fa-briefcase" style="color: var(--accent-color);"></i>
            <span>No job postings available at the moment</span>
        `;
    }

    // Initialize jobs page
    async function initJobsPage() {
        try {
            const data = await fetchJobs();

            if (data.error) {
                showError(data.error);
                return;
            }

            if (!data.messages || data.messages.length === 0) {
                showEmptyState();
                return;
            }

            // Filter out bot messages, join/leave messages, and sort by timestamp (newest first)
            const jobMessages = data.messages
                .filter(msg => {
                    if (!msg.text || msg.bot_id) return false;

                    // Filter out join/leave channel messages
                    const text = msg.text.toLowerCase();
                    if (text.includes('has joined the channel') ||
                        text.includes('has left the channel')) {
                        return false;
                    }

                    return true;
                })
                .sort((a, b) => parseFloat(a.ts) - parseFloat(b.ts));

            if (jobMessages.length === 0) {
                showEmptyState();
                return;
            }

            renderJobs(jobMessages);
        } catch (error) {
            console.error('Error initializing jobs page:', error);
            showError('Failed to load job postings');
        }
    }

    // No longer needed - removed expand/collapse functionality

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initJobsPage);
    } else {
        initJobsPage();
    }
})();