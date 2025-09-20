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
    console.log('[api/jobs] Fetched Slack messages:', {
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
    console.log('[api/jobs] Unique userIds to lookup (users.info):', userIds);

    // Build map of userId -> display name
    const userMap = {};

    // First attempt: users.info per userId (may fail without users:read scope)
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
          console.log('[api/jobs] users.info success', { userId, display });
        }
      } catch (e) {
        console.warn('[api/jobs] users.info failed', { userId, error: e.message });
      }
    }

    // Second attempt (fallback): bulk fetch via users.list to fill any missing IDs
    const missingIds = userIds.filter(id => !userMap[id]);
    if (missingIds.length > 0) {
      try {
        // users.list can be paginated; one page is usually enough for small workspaces
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
        console.log('[api/jobs] users.list fallback used', { missingBefore: missingIds.length, filled });
      } catch (e) {
        console.warn('[api/jobs] users.list fallback failed', { error: e.message });
      }
    }

    console.log('[api/jobs] Built userMap size:', Object.keys(userMap).length);

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
    console.log('[api/jobs] Enriched messages:', { total: enriched.length, withName, withoutName });

    res.json({
      messages: enriched,
      success: true,
      count: enriched.length
    });
  } catch (error) {
    console.error('Error fetching Slack messages:', error);
    res.status(500).json({ error: error.message, messages: [] });
  }
};