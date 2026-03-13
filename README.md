# AI Reviews Reply for VIATOR

Chrome extension **Viator "Reply by AI"** plus the **Pro** license API.

## Repo structure

| Folder | Purpose |
|--------|--------|
| **extension/** | Chrome extension. Zip the *contents* of this folder to upload to the Chrome Web Store. Version is in `extension/manifest.json`. |
| **vercel-api/** | License API (validate, Stripe checkout, webhook). Deploy to Vercel with domain **ai.majidorc.com**. Set Root Directory to `vercel-api`. |

## Versioning

- **Extension version** is in `extension/manifest.json` (`version`). On each update or new feature, bump it (e.g. 1.1.0 → 1.1.1 or 1.2.0) and add an entry to `extension/CHANGELOG.md`.
- **Vercel API** version is in `vercel-api/package.json`; bump when you change API contract or behavior.

## Quick start

- **Load extension (dev):** Chrome → `chrome://extensions` → Load unpacked → select the **extension** folder.
- **Deploy API:** Vercel → Import repo → Root Directory = `vercel-api` → add env vars (see `vercel-api/README.md`).

## Links

- [Extension README and setup](extension/README.md)
- [Privacy policy](extension/PRIVACY.md)
- [API setup (Vercel)](vercel-api/README.md)

Copyright © [Anywhere.tours](https://anywhere.tours)
