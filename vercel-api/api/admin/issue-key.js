/**
 * GET /api/admin/issue-key?session_id=cs_xxx&secret=ADMIN_SECRET
 * For payments that already succeeded but the webhook never stored a key (e.g. KV was missing).
 * Verifies the Stripe checkout session was paid, creates a license key, stores it in KV,
 * and returns the key. Customer can then use the key in the extension or revisit thank-you?session_id=...
 */
const Stripe = require('stripe');
const { redis } = require('../../lib/redis');
const crypto = require('crypto');

function generateLicenseKey() {
  return crypto.randomBytes(24).toString('hex');
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const secret = (req.query.secret || '').trim();
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret || secret !== adminSecret) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return;
  }

  const sessionId = (req.query.session_id || '').trim();
  if (!sessionId) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Missing session_id' }));
    return;
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Server misconfiguration' }));
    return;
  }

  try {
    const stripe = new Stripe(stripeSecret);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Session not paid', payment_status: session.payment_status }));
      return;
    }

    const licenseKey = generateLicenseKey();
    await redis.set(`license:${licenseKey}`, JSON.stringify({ created: Date.now() }));
    await redis.set(`session:${sessionId}`, licenseKey, { ex: 3600 });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ key: licenseKey }));
  } catch (e) {
    console.error('Issue-key error:', e);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: e.message || 'Failed' }));
  }
};
