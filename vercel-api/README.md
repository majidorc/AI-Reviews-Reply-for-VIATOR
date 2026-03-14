# Viator Reply by AI – License API (Vercel)

Backend for **Pro** license validation and Stripe checkout. Deploy this folder to Vercel with domain **ai.majidorc.com**.

## Env vars (Vercel project)

- `STRIPE_SECRET_KEY` – Stripe secret key
- `STRIPE_WEBHOOK_SECRET` – Webhook signing secret (Stripe Dashboard → Webhooks → endpoint → Signing secret)
- `STRIPE_PRICE_ID` – Price ID for your $1 one-time product (Stripe Dashboard → Products → your $1 product → Price ID)
- **Redis (Upstash):** `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` – create a database at [Upstash Console](https://console.upstash.com), then in the database’s **REST API** section copy the endpoint URL and token. Add both as env vars in Vercel.

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
- `POST /api/webhooks/stripe` – Stripe webhook; creates license key and stores it in Redis.
- `GET /api/thank-you?session_id=...` – Returns the license key for a completed session (used by thank-you page).
- `GET /thank-you` – Thank-you page (rewrite to thank-you.html) that shows the license key after payment.
- `GET /api/admin/issue-key?session_id=cs_xxx&secret=ADMIN_SECRET` – **Admin only.** For payments that already succeeded but no key was stored (e.g. Redis env vars were missing at the time). Verifies the session was paid, creates and stores a license key, returns it. Set env var `ADMIN_SECRET` to a random string and keep it private.

## Version

1.0.0. Bump when you change API contract or behavior.

---

## Troubleshooting (Vercel logs)

### "No such price: 'prod_...'"

You used a **Product ID** (`prod_xxx`) for `STRIPE_PRICE_ID`. Stripe Checkout needs a **Price ID** (`price_xxx`).

- In Stripe: **Products** → open your Pro product → under **Pricing**, click the price (e.g. ฿50.00) → copy the **Price ID** (it starts with `price_`).
- In Vercel: **Project → Settings → Environment Variables** → set `STRIPE_PRICE_ID` to that **Price ID** (e.g. `price_1QR...`), not the Product ID. Redeploy.

### "Missing Redis" or license/checkout not working

The API needs Upstash Redis to store license keys.

1. Go to [console.upstash.com](https://console.upstash.com) and create a Redis database (same region as your Vercel project if possible).
2. In the database, open the **REST API** section and copy **Endpoint** (URL) and **Token**.
3. In Vercel: **Project → Settings → Environment Variables** → add:
   - `UPSTASH_REDIS_REST_URL` = the endpoint URL
   - `UPSTASH_REDIS_REST_TOKEN` = the token
4. **Redeploy** the project. Then checkout and the thank-you page should work.

### Customer paid but saw "Key not found or already retrieved"

If the payment succeeded in Stripe but the thank-you page never showed a key (e.g. Redis env vars weren’t set when they paid), you can issue a key for that payment:

1. In Vercel, set env var **`ADMIN_SECRET`** to a long random string (e.g. from a password generator). Redeploy.
2. In Stripe: **Payments** → click the payment → note the **Checkout session** ID (starts with `cs_`), or from **Developers → Webhooks** open a `checkout.session.completed` event and copy `data.object.id` (the session ID).
3. Open in the browser (only you should know the secret):  
   `https://ai.majidorc.com/api/admin/issue-key?session_id=cs_XXXXX&secret=YOUR_ADMIN_SECRET`  
   Replace `cs_XXXXX` and `YOUR_ADMIN_SECRET` with the real values.
4. The response will be `{ "key": "..." }`. Send that license key to the customer (e.g. by email). They can paste it in the extension Options and click Activate.
