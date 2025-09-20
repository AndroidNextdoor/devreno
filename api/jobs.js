const { WebClient } = require('@slack/web-api');

// Slack client (token provided via env var in Vercel project settings)
const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

module.exports = async (req, res) => {
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

    res.json({
      messages,
      success: true,
      count: messages.length
    });
  } catch (error) {
    console.error('Error fetching Slack messages:', error);
    res.status(500).json({ error: error.message, messages: [] });
  }
};