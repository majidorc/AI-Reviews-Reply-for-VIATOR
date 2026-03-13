/**
 * POST /api/webhooks/stripe
 * Stripe webhook: on checkout.session.completed, create a license key and store it in KV.
 * Key is stored under session_id so thank-you page can retrieve it.
 * Requires STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, and Vercel KV.
 * Raw body is required for signature verification.
 */
const Stripe = require('stripe');
const { kv } = require('@vercel/kv');
const crypto = require('crypto');

function generateLicenseKey() {
  return crypto.randomBytes(24).toString('hex');
}

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(405);
    res.end();
    return;
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !webhookSecret) {
    res.writeHead(500);
    res.end('Missing Stripe config');
    return;
  }

  let rawBody;
  try {
    rawBody = await getRawBody(req);
  } catch (e) {
    res.writeHead(400);
    res.end('Invalid body');
    return;
  }

  const stripe = new Stripe(secret);
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (e) {
    console.error('Webhook signature error:', e.message);
    res.writeHead(400);
    res.end(`Webhook Error: ${e.message}`);
    return;
  }

  if (event.type !== 'checkout.session.completed') {
    res.writeHead(200);
    res.end();
    return;
  }

  const session = event.data.object;
  const sessionId = session.id;

  try {
    const licenseKey = generateLicenseKey();
    await kv.set(`license:${licenseKey}`, { created: Date.now() });
    await kv.set(`session:${sessionId}`, licenseKey, { ex: 3600 });
    res.writeHead(200);
    res.end();
  } catch (e) {
    console.error('Webhook KV error:', e);
    res.writeHead(500);
    res.end();
  }
};
