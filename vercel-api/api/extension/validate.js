/**
 * GET /api/extension/validate?key=LICENSE_KEY
 * Returns { "valid": true } or { "valid": false }.
 * CORS allowed for chrome-extension:// so the extension can call from background.
 */
const { kv } = require('@vercel/kv');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    res.writeHead(405, CORS_HEADERS);
    res.end(JSON.stringify({ valid: false }));
    return;
  }

  const key = (req.query.key || '').trim();
  if (!key) {
    res.writeHead(200, CORS_HEADERS);
    res.end(JSON.stringify({ valid: false }));
    return;
  }

  try {
    const stored = await kv.get(`license:${key}`);
    const valid = !!stored;
    res.writeHead(200, CORS_HEADERS);
    res.end(JSON.stringify({ valid }));
  } catch (e) {
    console.error('Validate error:', e);
    res.writeHead(200, CORS_HEADERS);
    res.end(JSON.stringify({ valid: false }));
  }
};
