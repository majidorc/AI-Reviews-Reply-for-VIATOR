/**
 * Viator "Reply by AI" Chrome Extension - Background service worker
 * Copyright © Anywhere.tours
 */
const GEMINI_MODEL = 'gemini-2.5-flash-lite';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function buildPrompt(reviewTitle, reviewBody, reviewerName, supplierName, companyName, maxCharacters) {
  const parts = [];
  if (reviewTitle) parts.push(`Review title: ${reviewTitle}`);
  if (reviewBody) parts.push(`Review:\n${reviewBody}`);
  const context = parts.join('\n\n') || 'No review content provided.';
  const reviewer = (reviewerName || '').trim() || 'the traveler';
  const nameForTeam = (companyName || supplierName || '').trim();
  const teamName = nameForTeam ? `The ${nameForTeam} Team` : 'The Team';
  const lengthRule = maxCharacters
    ? ` Strict length limit: the entire reply must be under ${maxCharacters} characters (this platform has a character limit).`
    : '';
  return `You are helping a tour/travel operator reply to a customer review (e.g. on Viator or GetYourGuide). Write a single short, professional, friendly reply that thanks the customer and acknowledges their experience. Important: write the entire reply in the same language the customer used for their review (e.g. if the review is in German, write your reply in German; if in Spanish, reply in Spanish). Include: (1) a brief greeting using the traveler's name if known (e.g. "Dear [name]," or the equivalent in that language—traveler name: ${reviewer}), (2) the reply body, (3) a sign-off (e.g. "Best regards, [team]" in that language—team name: ${teamName}).${lengthRule} Do not use markdown, quotes, or any wrapper text—output only the reply text, nothing else.

${context}`;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
      message.supplierName,
      message.companyName || '',
      message.maxCharacters
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

      let text = (data?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
      if (!text) {
        return { error: 'No reply text in API response' };
      }
      const maxChars = message.maxCharacters;
      if (maxChars && text.length > maxChars) {
        text = text.slice(0, maxChars);
      }
      return { text };
    } catch (e) {
      return { error: e.message || 'Network error' };
    }
  })()
    .then(sendResponse);
  return true;
});
