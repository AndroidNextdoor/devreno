module.exports = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const distance = req.query.distance !== undefined ? parseInt(req.query.distance, 10) : 75;

    // Determine base URL from the incoming request (works locally and on Vercel)
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const baseUrl = `${protocol}://${host}`;

    // Fetch local and remote jobs based on distance
    let localData = { jobs: [], hasMore: false };
    let remoteData = { jobs: [], hasMore: false };

    if (distance > 0) {
      const [localResponse, remoteResponse] = await Promise.all([
        fetch(`${baseUrl}/api/local-jobs?page=${Math.ceil(page/2)}&limit=${Math.ceil(limit/2)}&distance=${distance}`),
        fetch(`${baseUrl}/api/remote-jobs?page=${Math.ceil(page/2)}&limit=${Math.floor(limit/2)}`)
      ]);
      localData = await localResponse.json();
      remoteData = await remoteResponse.json();
    } else {
      const remoteResponse = await fetch(`${baseUrl}/api/remote-jobs?page=${page}&limit=${limit}`);
      remoteData = await remoteResponse.json();
      localData = { jobs: [], hasMore: false, total: 0 };
    }

    const combinedJobs = [
      ...(localData.jobs || []),
      ...(remoteData.jobs || [])
    ];

    res.json({
      jobs: combinedJobs,
      page,
      hasMore: Boolean(localData.hasMore || remoteData.hasMore),
      local_count: localData.jobs?.length || 0,
      remote_count: remoteData.jobs?.length || 0,
      total_loaded: combinedJobs.length
    });
  } catch (error) {
    console.error('Error fetching combined jobs:', error);
    res.status(500).json({ error: error.message, jobs: [] });
  }
};