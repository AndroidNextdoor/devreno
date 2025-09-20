// Simple in-memory cache (may persist briefly between invocations)
const jobCache = new Map();

function getCacheKey(type, page) {
  return `${type}_jobs_page_${page}`;
}

function isCacheValid(timestamp) {
  const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
  return Date.now() - timestamp < CACHE_DURATION;
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