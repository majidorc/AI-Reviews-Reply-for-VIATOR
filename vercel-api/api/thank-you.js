/**
 * GET /api/thank-you?session_id=CHECKOUT_SESSION_ID
 * Returns the license key for a completed checkout session (one-time retrieval).
 * Used by the thank-you page to display the key to the user.
 */
const { kv } = require('@vercel/kv');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const sessionId = (req.query.session_id || '').trim();
  if (!sessionId) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Missing session_id' }));
    return;
  }

  try {
    const key = await kv.get(`session:${sessionId}`);
    if (key) await kv.del(`session:${sessionId}`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ key: key || null }));
  } catch (e) {
    console.error('Thank-you API error:', e);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Server error' }));
  }
};
