# Viator Reply by AI – License API (Vercel)

Backend for **Pro** license validation and Stripe checkout. Deploy this folder to Vercel with domain **ai.majidorc.com**.

## Env vars (Vercel project)

- `STRIPE_SECRET_KEY` – Stripe secret key
- `STRIPE_WEBHOOK_SECRET` – Webhook signing secret (Stripe Dashboard → Webhooks → endpoint → Signing secret)
- `STRIPE_PRICE_ID` – Price ID for your $1 one-time product (Stripe Dashboard → Products → your $1 product → Price ID)
- Vercel KV: create a KV store in the Vercel project and link it (adds `KV_REST_API_*` and `KV_URL` automatically)

Optional:

- `BASE_URL` – e.g. `https://ai.majidorc.com` (for success_url; otherwise Vercel URL is used)

## Stripe setup

1. Create a Product in Stripe (e.g. "Viator Reply by AI Pro") and a one-time $1 Price. Copy the **Price ID** (`price_xxx`).
2. Create a Webhook endpoint: `https://ai.majidorc.com/api/webhooks/stripe`, events: `checkout.session.completed`. Copy the **Signing secret**.

## Deploy

1. In Vercel, create a project and connect this repo.
2. Set **Root Directory** to `vercel-api`.
3. Add the env vars above and deploy.
4. Point **ai.majidorc.com** to this Vercel project (Vercel DNS or CNAME).

## Endpoints

- `GET /api/extension/validate?key=...` – Extension calls this to validate a license key. Returns `{ "valid": true }` or `{ "valid": false }`.
- `GET /api/checkout` – Redirects user to Stripe Checkout for the $1 product.
- `POST /api/webhooks/stripe` – Stripe webhook; creates license key and stores it (KV).
- `GET /api/thank-you?session_id=...` – Returns the license key for a completed session (used by thank-you page).
- `GET /thank-you` – Thank-you page (rewrite to thank-you.html) that shows the license key after payment.

## Version

1.0.0. Bump when you change API contract or behavior.
