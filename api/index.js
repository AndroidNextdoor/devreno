module.exports = async (req, res) => {
  res.json({
    status: 'ok',
    message: 'DevReno API root',
    endpoints: [
      '/api/health',
      '/api/jobs',
      '/api/local-jobs',
      '/api/remote-jobs',
      '/api/all-jobs'
    ]
  });
};