// Simple in-memory cache (may persist briefly between invocations)
const jobCache = new Map();

// Clear cache on startup to ensure fresh data
jobCache.clear();

function getCacheKey(type, page) {
  return `${type}_jobs_page_${page}`;
}

function isCacheValid(timestamp) {
  const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
  return Date.now() - timestamp < CACHE_DURATION;
}

function sanitizeHtml(html) {
  if (!html) return '';

  let text = html;

  // First pass: Replace common HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&hellip;/g, '...')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–');

  // Second pass: Remove all HTML tags (including self-closing and malformed ones)
  text = text.replace(/<[^>]*\/?>/g, '');

  // Third pass: Handle any remaining encoded entities
  text = text.replace(/&[a-zA-Z0-9#]+;/g, ' ');

  // Fourth pass: Clean up whitespace
  text = text
    .replace(/\s+/g, ' ') // Collapse multiple whitespace
    .replace(/\n\s*\n/g, '\n') // Remove empty lines
    .trim(); // Remove leading/trailing whitespace

  return text;
}

module.exports = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
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

    const softwareJobs = (allJobs || [])
      .filter(job => job && job.position && (
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
      .map((job, index) => {
        const mappedJob = {
          id: job.id,
          title: job.position,
          company: job.company,
          location: 'Remote',
          salary_min: job.salary_min || null,
          salary_max: job.salary_max || null,
          description: sanitizeHtml(job.description),
          url: job.url,
          created: job.date,
          type: 'remote',
          source: 'remoteok',
          tags: job.tags || []
        };

        // Debug: Log salary info for first few jobs
        if (index < 3) {
          console.log(`Job: ${job.position}, Salary: ${job.salary_min}-${job.salary_max}`);
        }

        return mappedJob;
      });

    const result = {
      jobs: softwareJobs,
      total: allJobs.length,
      page,
      hasMore: page * limit < allJobs.length,
      source: 'remote'
    };

    jobCache.set(cacheKey, { data: result, timestamp: Date.now() });

    res.json(result);
  } catch (error) {
    console.error('Error fetching remote jobs:', error);
    res.status(500).json({ error: error.message, jobs: [] });
  }
};