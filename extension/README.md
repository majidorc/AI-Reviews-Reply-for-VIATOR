# Reply by AI for Viator & GetYourGuide

Generate AI-powered replies for supplier reviews on Viator and GetYourGuide using Google Gemini.

The extension adds a **Reply by AI** button inside the review response modal and fills a suggested reply in one click.

## Supported Platforms

- [Viator supplier reviews](https://supplier.viator.com/reviews)
- [GetYourGuide supplier reviews](https://supplier.getyourguide.com/performance/reviews)

## Features

- **One-click reply generation** in the review response modal
- **Gemini-powered responses** (Gemini 2.5 Flash Lite)
- **Same-language replies** as the customer review (for example German review -> German reply)
- **GetYourGuide limit handling**: replies are kept within the 400-character limit
- **Popup on extension icon click** with quick access to settings
- **Optional company name setting** for sign-off fallback (for example: `Best regards, The AnyWhere.com Team`)
- **Local key storage**: API key is saved in `chrome.storage.sync`

## Requirements

- Chrome (or another Chromium-based browser)
- A [Gemini API key](https://aistudio.google.com/app/apikey) (free tier available)

## Installation (Unpacked)

1. Clone or download this repository.
2. Open Chrome and go to `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select this `extension` folder (the one containing `manifest.json`).

## Setup

1. Click the extension icon and open **Options**.
2. Paste your Gemini API key and click **Save**.
3. (Optional) Set **Company / business name** for reply sign-off fallback.

## Usage

1. Open the reviews page on Viator or GetYourGuide.
2. Open a review reply modal (`Respond to review` / `Reply to the traveler`).
3. Click **Reply by AI** under the textarea.
4. Review and edit the generated text, then submit as normal.

## Permissions

- `storage` - save and read extension settings (API key, optional company name)
- `https://supplier.viator.com/reviews` - run the content script on Viator reviews page
- `https://supplier.getyourguide.com/performance/reviews` - run the content script on GetYourGuide reviews page
- `https://generativelanguage.googleapis.com/*` - call Gemini API

## Privacy

- Your Gemini API key is stored locally in the browser (`chrome.storage.sync`).
- Review content is sent only to Google's Gemini API when you click **Reply by AI**.
- The extension does not send review data to any custom backend.

See [PRIVACY.md](PRIVACY.md) for the full privacy policy.

## Versioning

Current version is in `manifest.json` (`version`), currently `1.3.3`.

When you change behavior or features:
- bump `manifest.json` version
- add a matching entry in `CHANGELOG.md`

## Repository

[AI Reviews Reply for VIATOR](https://github.com/majidorc/AI-Reviews-Reply-for-VIATOR)

Copyright © Anywhere.tours
