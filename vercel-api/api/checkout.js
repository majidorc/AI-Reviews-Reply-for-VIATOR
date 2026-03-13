/**
 * GET /api/checkout
 * Creates a Stripe Checkout session for the $1 Pro product and redirects to Stripe.
 * Requires STRIPE_SECRET_KEY and STRIPE_PRICE_ID in env.
 */
const Stripe = require('stripe');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID;
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.BASE_URL || 'https://ai.majidorc.com';

  if (!secret || !priceId) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Server misconfiguration: missing STRIPE_SECRET_KEY or STRIPE_PRICE_ID');
    return;
  }

  try {
    const stripe = new Stripe(secret);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/thank-you?cancelled=1`,
    });
    res.writeHead(302, { Location: session.url });
    res.end();
  } catch (e) {
    console.error('Checkout error:', e);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: e.message || 'Checkout failed' }));
  }
};
