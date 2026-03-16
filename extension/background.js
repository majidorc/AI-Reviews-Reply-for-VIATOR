/**
 * Viator "Reply by AI" Chrome Extension - Background service worker
 * Copyright © Anywhere.tours
 */
const GEMINI_MODEL = 'gemini-2.5-flash-lite';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const LICENSE_VALIDATE_URL = 'https://ai.majidorc.com/api/extension/validate';

function buildPrompt(reviewTitle, reviewBody, reviewerName, supplierName) {
  const parts = [];
  if (reviewTitle) parts.push(`Review title: ${reviewTitle}`);
  if (reviewBody) parts.push(`Review:\n${reviewBody}`);
  const context = parts.join('\n\n') || 'No review content provided.';
  const reviewer = (reviewerName || '').trim() || 'the traveler';
  const teamName = (supplierName || '').trim() ? `${supplierName} Team` : 'The Team';
  return `You are helping a tour/travel operator reply to a customer review (e.g. on Viator or GetYourGuide). Write a single short, professional, friendly reply that thanks the customer and acknowledges their experience. Important: write the entire reply in the same language the customer used for their review (e.g. if the review is in German, write your reply in German; if in Spanish, reply in Spanish). Include: (1) a brief greeting using the traveler's name if known (e.g. "Dear [name]," or the equivalent in that language—traveler name: ${reviewer}), (2) the reply body, (3) a sign-off (e.g. "Best regards, [team]" in that language—team name: ${teamName}). Do not use markdown, quotes, or any wrapper text—output only the reply text, nothing else.

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

    const prompt = buildPrompt(
      message.reviewTitle || '',
      message.reviewBody || '',
      message.reviewerName,
      message.supplierName
    );
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
      return { text: body.trim() };
    } catch (e) {
      return { error: e.message || 'Network error' };
    }
  })()
    .then(sendResponse);
  return true;
});
