# Viator "Reply by AI" Chrome Extension

Generate AI-powered replies to Viator supplier reviews using Google Gemini. Add a **Reply by AI** button in the review response modal and get professional, personalized reply suggestions in one click.

## Features

- **Reply by AI** button on [Viator supplier reviews](https://supplier.viator.com/reviews) — appears below the reply text area when you open "Respond to review"
- **Gemini 2.5 Flash Lite** — uses Google's Gemini API for fast, natural reply generation
- **Formatted replies** — salutation (Dear [reviewer name]), body, and sign-off (Best regards, [Your business name] Team)
- **Settings** — store your Gemini API key in the extension options (key stays local, used only to call the API)

## Requirements

- Chrome (or a Chromium-based browser)
- A [Gemini API key](https://aistudio.google.com/app/apikey) from Google AI Studio (free tier available)

## Installation

### From source (developer / unpacked)

1. Clone or download this repository.
2. Open Chrome and go to `chrome://extensions`.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select the folder containing `manifest.json`.

### From Chrome Web Store

Install from the [Chrome Web Store](https://chrome.google.com/webstore) once the extension is published (search for "Viator Reply by AI").

## Setup

1. After installing, click the extension icon and choose **Options**, or right-click the icon and select **Options**.
2. Enter your [Gemini API key](https://aistudio.google.com/app/apikey) and click **Save**.
3. Go to [https://supplier.viator.com/reviews](https://supplier.viator.com/reviews).

## Usage

1. On the Viator supplier reviews page, click **Respond to review** on any review.
2. In the reply modal, below the large text area, click **Reply by AI**.
3. The extension reads the review, calls Gemini, and fills the reply box with a suggested reply (Dear [reviewer], body, Best regards, [Your business] Team).
4. Edit the text if you like, then click **Submit** as usual.

## Permissions

- **storage** — to save and read your Gemini API key in extension options.
- **https://supplier.viator.com/reviews** — so the content script and "Reply by AI" button run only on the reviews page.
- **https://generativelanguage.googleapis.com/** — so the background script can call the Gemini API with your key.

## Privacy

- Your API key is stored locally in the browser and is only used to request reply text from Google's Gemini API.
- When you click "Reply by AI", the visible review title and body (and reviewer/supplier names from the page) are sent to the Gemini API to generate the reply. No data is sent to any other servers.

## License

MIT (or as specified in the repository).

## Repository

[AI Reviews Reply for VIATOR](https://github.com/majidorc/AI-Reviews-Reply-for-VIATOR)

---

Copyright © Anywhere.tours
