module.exports = async (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL ? 'production' : 'development'
  });
};