// External jobs (Adzuna + RemoteOK) with infinite scroll functionality
(function() {
    'use strict';

    // Cache DOM elements
    const externalJobsContainer = document.getElementById('external-jobs-container');
    const externalJobsLoading = document.getElementById('external-jobs-loading');
    const loadMoreContainer = document.getElementById('load-more-container');
    const loadMoreBtn = document.getElementById('load-more-btn');
    const jobsEndMessage = document.getElementById('jobs-end-message');

    // State management
    let currentPage = 1;
    let isLoading = false;
    let hasMoreJobs = true;
    let totalJobsLoaded = 0;
    const JOBS_PER_PAGE = 20;
    let allJobs = []; // Store all loaded jobs for filtering
    let currentFilters = {
        jobType: 'all',
        distance: '75',
        tech: 'all',
        search: ''
    };

    // Performance: Use requestIdleCallback for non-critical operations
    function scheduleWork(callback) {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(callback);
        } else {
            setTimeout(callback, 1);
        }
    }

    // Format salary range
    function formatSalary(salaryMin, salaryMax) {
        if (!salaryMin && !salaryMax) return null;

        const formatNumber = (num) => {
            if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
            if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
            return `$${num.toLocaleString()}`;
        };

        if (salaryMin && salaryMax) {
            return `${formatNumber(salaryMin)} - ${formatNumber(salaryMax)}`;
        } else if (salaryMin) {
            return `${formatNumber(salaryMin)}+`;
        } else {
            return `Up to ${formatNumber(salaryMax)}`;
        }
    }

    // Format job posting date
    function formatJobDate(dateString) {
        if (!dateString) return 'Recently posted';

        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now - date;
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

            if (diffDays === 0) return 'Today';
            if (diffDays === 1) return 'Yesterday';
            if (diffDays < 7) return `${diffDays} days ago`;
            if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
            return date.toLocaleDateString();
        } catch (e) {
            return 'Recently posted';
        }
    }

    // Extract key technologies from job description
    function extractTechStack(description) {
        if (!description) return [];

        const techKeywords = [
            'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'Node.js', 'Python',
            'Java', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin',
            'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'MongoDB', 'PostgreSQL',
            'MySQL', 'Redis', 'GraphQL', 'REST', 'Git', 'CI/CD'
        ];

        const found = [];
        const lowerDesc = description.toLowerCase();

        techKeywords.forEach(tech => {
            if (lowerDesc.includes(tech.toLowerCase()) && found.length < 5) {
                found.push(tech);
            }
        });

        return found;
    }

    // Create external job card
    function createExternalJobCard(job) {
        const salary = formatSalary(job.salary_min, job.salary_max);
        const date = formatJobDate(job.created);
        const techStack = extractTechStack(job.description);
        const isLocal = job.type === 'local';

        const card = document.createElement('div');
        card.className = 'external-job-card';
        card.innerHTML = `
            <div class="external-job-header">
                <div class="external-job-title-section">
                    <h3 class="external-job-title">${escapeHtml(job.title)}</h3>
                    <div class="external-job-meta">
                        <span class="external-job-company">${escapeHtml(job.company)}</span>
                        <span class="external-job-location">
                            <i class="fas fa-map-marker-alt"></i>
                            ${escapeHtml(job.location)}
                        </span>
                        ${isLocal ? '<span class="job-type-badge local-badge">Local</span>' : '<span class="job-type-badge remote-badge">Remote</span>'}
                    </div>
                </div>
                <div class="external-job-date">${date}</div>
            </div>

            ${salary ? `<div class="external-job-salary">
                <i class="fas fa-dollar-sign"></i>
                ${salary}
            </div>` : ''}

            ${techStack.length > 0 ? `<div class="external-job-tech-stack">
                ${techStack.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
            </div>` : ''}

            <div class="external-job-description">
                ${escapeHtml(job.description ? job.description.substring(0, 200) + '...' : 'No description available')}
            </div>

            <div class="external-job-actions">
                <a href="${escapeHtml(job.url)}" target="_blank" rel="noopener noreferrer" class="apply-btn">
                    <i class="fas fa-external-link-alt"></i>
                    Apply for ${escapeHtml(job.title)} Position
                </a>
                <span class="job-source">via ${job.source === 'adzuna' ? 'Adzuna' : 'RemoteOK'}</span>
            </div>
        `;

        return card;
    }

    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Fetch external jobs from API
    async function fetchExternalJobs(page) {
        try {
            let apiUrl;
            if (currentFilters.jobType === 'remote') {
                // Remote only - use remote jobs API
                apiUrl = `/api/remote-jobs?page=${page}&limit=${JOBS_PER_PAGE}`;
            } else if (currentFilters.jobType === 'local') {
                // Local only - use local jobs API
                apiUrl = `/api/local-jobs?page=${page}&limit=${JOBS_PER_PAGE}&distance=${currentFilters.distance}`;
            } else {
                // All jobs - use combined API
                apiUrl = `/api/all-jobs?page=${page}&limit=${JOBS_PER_PAGE}&distance=${currentFilters.distance}`;
            }

            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Failed to fetch external jobs:', error);
            return { jobs: [], error: error.message };
        }
    }

    // Render external jobs with performance optimizations
    function renderExternalJobs(jobs) {
        const fragment = document.createDocumentFragment();

        jobs.forEach(job => {
            fragment.appendChild(createExternalJobCard(job));
        });

        // Single DOM update
        externalJobsContainer.appendChild(fragment);

        // Update counter
        totalJobsLoaded += jobs.length;

        // Animate cards in with Intersection Observer
        scheduleWork(() => {
            const newCards = externalJobsContainer.querySelectorAll('.external-job-card');
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 });

            // Only observe the newly added cards
            const startIndex = Math.max(0, newCards.length - jobs.length);
            for (let i = startIndex; i < newCards.length; i++) {
                const card = newCards[i];
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                observer.observe(card);
            }
        });
    }

    // Filter jobs based on current filters
    function filterJobs(jobs) {
        return jobs.filter(job => {
            // Job type filter
            if (currentFilters.jobType !== 'all') {
                if (currentFilters.jobType === 'local' && job.type !== 'local') return false;
                if (currentFilters.jobType === 'remote' && job.type !== 'remote') return false;
            }

            // Tech filter
            if (currentFilters.tech !== 'all') {
                const techStack = extractTechStack(job.description);
                const hasMatchingTech = techStack.some(tech =>
                    tech.toLowerCase().includes(currentFilters.tech.toLowerCase())
                );
                if (!hasMatchingTech) return false;
            }

            // Search filter
            if (currentFilters.search.trim() !== '') {
                const searchTerm = currentFilters.search.toLowerCase().trim();
                const searchableText = [
                    job.title || '',
                    job.company || '',
                    job.description || '',
                    job.location || ''
                ].join(' ').toLowerCase();

                if (!searchableText.includes(searchTerm)) return false;
            }

            return true;
        });
    }

    // Clear all jobs and reload with current filters
    function reloadJobsWithFilters() {
        // Clear current display
        externalJobsContainer.innerHTML = '';

        // Apply filters to all loaded jobs
        const filteredJobs = filterJobs(allJobs);

        if (filteredJobs.length === 0) {
            showNoResultsMessage();
            return;
        }

        // Re-render filtered jobs
        renderExternalJobs(filteredJobs);
    }

    // Show no results message
    function showNoResultsMessage() {
        externalJobsContainer.innerHTML = `
            <div class="no-results-message">
                <i class="fas fa-search" style="color: var(--ink-muted); font-size: 2rem; margin-bottom: 1rem;"></i>
                <h3>No jobs found with current filters</h3>
                <p>Try adjusting your filters to see more opportunities.</p>
            </div>
        `;
        loadMoreContainer.style.display = 'none';
        jobsEndMessage.style.display = 'none';
    }

    // Load more jobs
    async function loadMoreJobs() {
        if (isLoading || !hasMoreJobs) return;

        isLoading = true;
        loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        loadMoreBtn.disabled = true;

        try {
            const data = await fetchExternalJobs(currentPage);

            if (data.error) {
                showError(data.error);
                return;
            }

            if (!data.jobs || data.jobs.length === 0) {
                hasMoreJobs = false;
                showEndMessage();
                return;
            }

            // Store jobs for filtering
            allJobs.push(...data.jobs);
            renderExternalJobs(data.jobs);
            currentPage++;

            // Check if we should continue loading
            if (!data.hasMore) {
                hasMoreJobs = false;
                showEndMessage();
            } else {
                loadMoreBtn.innerHTML = '<i class="fas fa-plus-circle"></i> Load More Jobs';
                loadMoreBtn.disabled = false;
            }

        } catch (error) {
            console.error('Error loading more jobs:', error);
            showError('Failed to load more jobs');
        } finally {
            isLoading = false;
        }
    }

    // Show error state
    function showError(message) {
        externalJobsLoading.innerHTML = `
            <i class="fas fa-exclamation-triangle" style="color: var(--accent-500);"></i>
            <span>Error loading jobs: ${escapeHtml(message)}</span>
        `;
        loadMoreContainer.style.display = 'none';
    }

    // Show end message
    function showEndMessage() {
        loadMoreContainer.style.display = 'none';
        jobsEndMessage.style.display = 'block';
    }

    // Initialize infinite scroll
    function initInfiniteScroll() {
        // Intersection Observer for automatic loading
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && hasMoreJobs && !isLoading) {
                    loadMoreJobs();
                }
            });
        }, { threshold: 0.1 });

        // Observe the load more button
        if (loadMoreContainer) {
            observer.observe(loadMoreContainer);
        }

        // Manual load more button click
        loadMoreBtn.addEventListener('click', loadMoreJobs);
    }

    // Initialize filter functionality
    function initFilters() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        const clearFiltersBtn = document.getElementById('clear-filters');
        const searchInput = document.getElementById('job-search-input');
        const clearSearchBtn = document.getElementById('clear-search-btn');

        // Add click handlers to filter buttons
        filterButtons.forEach(btn => {
            if (!btn.classList.contains('clear-filters')) {
                btn.addEventListener('click', (e) => {
                    const filterType = e.target.dataset.type;
                    const filterValue = e.target.dataset.filter;

                    // Remove active class from siblings
                    const siblings = e.target.parentElement.querySelectorAll('.filter-btn');
                    siblings.forEach(sibling => sibling.classList.remove('active'));

                    // Add active class to clicked button
                    e.target.classList.add('active');

                    // Update current filters
                    currentFilters[filterType] = filterValue;

                    // Handle distance filter visibility based on job type
                    if (filterType === 'jobType') {
                        const distanceButtons = document.querySelectorAll('[data-type="distance"]');
                        const distanceGroup = distanceButtons[0]?.closest('.filter-group');
                        if (distanceGroup) {
                            if (filterValue === 'remote') {
                                // Hide distance filter for remote-only jobs and set distance to 0
                                distanceGroup.style.display = 'none';
                                currentFilters.distance = '0';
                                // Clear all loaded jobs to force fresh reload
                                allJobs = [];
                            } else {
                                // Show distance filter for local or all jobs and restore default distance
                                distanceGroup.style.display = 'block';
                                if (currentFilters.distance === '0') {
                                    currentFilters.distance = '75'; // Restore to default
                                    // Update the active distance button
                                    const distanceButtons = document.querySelectorAll('[data-type="distance"]');
                                    distanceButtons.forEach(btn => btn.classList.remove('active'));
                                    const defaultDistanceBtn = document.querySelector('[data-type="distance"][data-filter="75"]');
                                    if (defaultDistanceBtn) defaultDistanceBtn.classList.add('active');
                                    // Clear all loaded jobs to force fresh reload
                                    allJobs = [];
                                }
                            }
                        }
                    }

                    // For distance changes or job type changes (which affect distance), we need to reload from API
                    if (filterType === 'distance' || filterType === 'jobType') {
                        // Reset state and reload from API
                        currentPage = 1;
                        hasMoreJobs = true;
                        externalJobsContainer.innerHTML = '';
                        externalJobsLoading.style.display = 'block';
                        loadMoreContainer.style.display = 'none';
                        jobsEndMessage.style.display = 'none';
                        initExternalJobsPage();
                    } else {
                        // Apply filters to existing jobs
                        reloadJobsWithFilters();
                    }
                });
            }
        });

        // Clear all filters
        clearFiltersBtn.addEventListener('click', () => {
            // Reset filters to default
            currentFilters = {
                jobType: 'all',
                distance: '75',
                tech: 'all',
                search: ''
            };

            // Clear search input
            if (searchInput) {
                searchInput.value = '';
            }

            // Reset button states
            filterButtons.forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.filter === 'all' || btn.dataset.filter === '75') {
                    btn.classList.add('active');
                }
            });

            // Show distance filter (since "All" is selected by default)
            const distanceButtons = document.querySelectorAll('[data-type="distance"]');
            const distanceGroup = distanceButtons[0]?.closest('.filter-group');
            if (distanceGroup) {
                distanceGroup.style.display = 'block';
            }

            // Reload all jobs
            reloadJobsWithFilters();
        });

        // Search input handlers
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            // Clear previous timeout to debounce search
            clearTimeout(searchTimeout);

            // Debounce search by 300ms
            searchTimeout = setTimeout(() => {
                currentFilters.search = e.target.value;
                reloadJobsWithFilters();
            }, 300);
        });

        // Clear search button
        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            currentFilters.search = '';
            reloadJobsWithFilters();
            searchInput.focus();
        });

        // Enter key support for search
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                clearTimeout(searchTimeout);
                currentFilters.search = e.target.value;
                reloadJobsWithFilters();
            }
        });
    }

    // Initialize external jobs page
    async function initExternalJobsPage() {
        try {
            // Reset jobs array for fresh load
            allJobs = [];

            // Load first batch of jobs
            const data = await fetchExternalJobs(currentPage);

            // Hide loading indicator
            externalJobsLoading.style.display = 'none';

            if (data.error) {
                showError(data.error);
                return;
            }

            if (!data.jobs || data.jobs.length === 0) {
                showError('No software engineering jobs found');
                return;
            }

            // Store jobs for filtering
            allJobs.push(...data.jobs);
            renderExternalJobs(data.jobs);
            currentPage++;

            // Show load more button if there are more jobs
            if (data.hasMore) {
                loadMoreContainer.style.display = 'flex';
                initInfiniteScroll();
            } else {
                hasMoreJobs = false;
                showEndMessage();
            }

            // Initialize filters after first load
            initFilters();

        } catch (error) {
            console.error('Error initializing external jobs page:', error);
            showError('Failed to load software engineering jobs');
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initExternalJobsPage);
    } else {
        initExternalJobsPage();
    }
})();