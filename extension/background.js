/**
 * Viator "Reply by AI" Chrome Extension - Background service worker
 * Copyright © Anywhere.tours
 */
const GEMINI_MODEL = 'gemini-2.5-flash-lite';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const LICENSE_VALIDATE_URL = 'https://ai.majidorc.com/api/extension/validate';

function buildPrompt(reviewTitle, reviewBody) {
  const parts = [];
  if (reviewTitle) parts.push(`Review title: ${reviewTitle}`);
  if (reviewBody) parts.push(`Review:\n${reviewBody}`);
  const context = parts.join('\n\n') || 'No review content provided.';
  return `You are helping a tour/travel operator reply to a customer review on Viator. Write a single short, professional, friendly reply that thanks the customer and acknowledges their experience. Do not use markdown, quotes, or any wrapper text—output only the reply text, nothing else.

${context}`;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'validateLicense') {
    const key = (message.licenseKey || '').trim();
    if (!key) {
      sendResponse({ valid: false });
      return true;
    }
    fetch(`${LICENSE_VALIDATE_URL}?key=${encodeURIComponent(key)}`)
      .then((res) => res.json())
      .then((data) => sendResponse(data))
      .catch(() => sendResponse({ valid: false }));
    return true;
  }

  if (message.action !== 'generateReply') {
    return;
  }

  (async () => {
    const { geminiApiKey } = await chrome.storage.sync.get('geminiApiKey');
    if (!geminiApiKey) {
      return { error: 'NO_API_KEY' };
    }

    const prompt = buildPrompt(message.reviewTitle || '', message.reviewBody || '');
    try {
      const res = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiApiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 256,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const errMsg = data?.error?.message || res.statusText || 'API error';
        return { error: errMsg };
      }

      const body = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!body) {
        return { error: 'No reply text in API response' };
      }
      const reviewerName = (message.reviewerName || '').trim() || 'Guest';
      const supplierName = (message.supplierName || '').trim();
      const signOff = supplierName ? `${supplierName} Team` : 'The Team';
      const text = `Dear ${reviewerName},\n\n${body.trim()}\n\nBest regards,\n${signOff}`;
      return { text };
    } catch (e) {
      return { error: e.message || 'Network error' };
    }
  })()
    .then(sendResponse);
  return true;
});
