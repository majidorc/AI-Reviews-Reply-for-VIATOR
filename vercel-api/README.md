# Viator Reply by AI – License API (Vercel)

Backend for **Pro** license validation and Stripe checkout. Deploy this folder to Vercel with domain **ai.majidorc.com**.

## Env vars (Vercel project)

- `STRIPE_SECRET_KEY` – Stripe secret key
- `STRIPE_WEBHOOK_SECRET` – Webhook signing secret (Stripe Dashboard → Webhooks → endpoint → Signing secret)
- `STRIPE_PRICE_ID` – Price ID for your $1 one-time product (Stripe Dashboard → Products → your $1 product → Price ID)
- Vercel KV: create a KV store in the Vercel project and link it (adds `KV_REST_API_*` and `KV_URL` automatically)

Optional:

- `BASE_URL` – e.g. `https://ai.majidorc.com` (for success_url; otherwise Vercel URL is used)
- `ADMIN_SECRET` – Random string for the admin issue-key endpoint (so you can issue keys for "already paid" sessions). Keep it secret.

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
- `GET /api/admin/issue-key?session_id=cs_xxx&secret=ADMIN_SECRET` – **Admin only.** For payments that already succeeded but no key was stored (e.g. KV was missing at the time). Verifies the session was paid, creates and stores a license key, returns it. Set env var `ADMIN_SECRET` to a random string and keep it private.

## Version

1.0.0. Bump when you change API contract or behavior.

---

## Troubleshooting (Vercel logs)

### "No such price: 'prod_...'"

You used a **Product ID** (`prod_xxx`) for `STRIPE_PRICE_ID`. Stripe Checkout needs a **Price ID** (`price_xxx`).

- In Stripe: **Products** → open your Pro product → under **Pricing**, click the price (e.g. ฿50.00) → copy the **Price ID** (it starts with `price_`).
- In Vercel: **Project → Settings → Environment Variables** → set `STRIPE_PRICE_ID` to that **Price ID** (e.g. `price_1QR...`), not the Product ID. Redeploy.

### "@vercel/kv: Missing required environment variables KV_REST_API_URL and KV_REST_API_TOKEN"

Vercel KV is not connected to the project. The API uses KV to store and look up license keys.

- In Vercel: open your project → **Storage** tab → **Create Database** → choose **KV** (Redis).
- After the store is created, open it → **Connect to Project** → select this project. That adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` (and related vars) to the project.
- **Redeploy** the project so the new env vars are used. Then checkout and the thank-you page should work.

### Customer paid but saw "Key not found or already retrieved"

If the payment succeeded in Stripe but the thank-you page never showed a key (e.g. KV wasn’t connected when they paid), you can issue a key for that payment:

1. In Vercel, set env var **`ADMIN_SECRET`** to a long random string (e.g. from a password generator). Redeploy.
2. In Stripe: **Payments** → click the payment → note the **Checkout session** ID (starts with `cs_`), or from **Developers → Webhooks** open a `checkout.session.completed` event and copy `data.object.id` (the session ID).
3. Open in the browser (only you should know the secret):  
   `https://ai.majidorc.com/api/admin/issue-key?session_id=cs_XXXXX&secret=YOUR_ADMIN_SECRET`  
   Replace `cs_XXXXX` and `YOUR_ADMIN_SECRET` with the real values.
4. The response will be `{ "key": "..." }`. Send that license key to the customer (e.g. by email). They can paste it in the extension Options and click Activate.
