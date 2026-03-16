/**
 * "Reply by AI" Chrome Extension - Content script (Viator & GetYourGuide)
 * Copyright © Anywhere.tours
 */
(function () {
  const INJECTED_ATTR = 'data-ai-reply-injected';
  const REPLY_PLACEHOLDER_TEXTS = [
    'Type your response here',
    'Reply will be checked with AI',
    'Send reply',
  ];

  function findReplyModal() {
    const dialog = document.querySelector('[role="dialog"]');
    if (dialog) {
      const textarea = dialog.querySelector('textarea');
      if (textarea) return { modal: dialog, textarea };
    }
    const textareas = document.querySelectorAll('textarea');
    for (const ta of textareas) {
      const modal = ta.closest('[role="dialog"], [class*="modal"], [class*="Modal"], [class*="dialog"]');
      if (modal) return { modal, textarea: ta };
    }
    return null;
  }

  function getReviewFromModal(modal) {
    let reviewTitle = '';
    let reviewBody = '';
    const heading = modal.querySelector('h1, h2, h3, h4, [class*="title"], [class*="Title"]');
    if (heading) reviewTitle = heading.textContent.trim();
    const bodyEl = modal.querySelector('[class*="review"] p, [class*="content"] p, p');
    if (bodyEl) reviewBody = bodyEl.textContent.trim();
    if (!reviewBody) {
      const divs = modal.querySelectorAll('[class*="review"], [class*="content"], [class*="body"]');
      for (const d of divs) {
        const t = d.textContent.trim();
        if (t.length > 20 && t.length < 3000) {
          reviewBody = t;
          break;
        }
      }
    }
    if (!reviewBody) {
      const all = modal.innerText || '';
      const lines = all.split(/\n/).map((s) => s.trim()).filter(Boolean);
      const skip = (t) => REPLY_PLACEHOLDER_TEXTS.some((p) => t === p || t.startsWith(p));
      const contentLines = lines.filter((t) => !skip(t) && t.length > 10);
      if (contentLines.length > 0) reviewTitle = contentLines[0];
      if (contentLines.length > 1) reviewBody = contentLines.slice(1).join('\n').trim();
      else if (contentLines.length === 1 && contentLines[0].length > 20) reviewBody = contentLines[0];
    }
    if (reviewBody && REPLY_PLACEHOLDER_TEXTS.some((p) => reviewBody.includes(p))) {
      reviewBody = reviewBody.replace(new RegExp(REPLY_PLACEHOLDER_TEXTS.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'gi'), '').trim();
    }
    return { reviewTitle, reviewBody };
  }

  function looksLikeDate(text) {
    if (!text || text.length > 30) return false;
    const t = text.trim();
    const monthDayYear = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}$/i;
    const dayMonthYear = /^\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}$/i;
    const numeric = /^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}$/;
    return monthDayYear.test(t) || dayMonthYear.test(t) || numeric.test(t);
  }

  function getReviewerNameFromModal(modal) {
    const img = modal.querySelector('img[src*="avatar"], img[src*="profile"], img');
    if (img) {
      let el = img.nextElementSibling || img.parentElement?.nextElementSibling;
      if (el) {
        const full = el.textContent.trim();
        if (full && !looksLikeDate(full)) {
          const withoutDate = full.replace(/\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\s*$/i, '').trim();
          if (withoutDate && withoutDate.length < 80) return withoutDate;
        }
        if (el.children.length) {
          for (const child of el.children) {
            const text = child.textContent.trim();
            if (text && text.length < 80 && !looksLikeDate(text)) return text;
          }
        }
        const parts = full.split(/\s+/).filter((p) => p && !looksLikeDate(p));
        if (parts.length) return parts.join(' ').slice(0, 80);
      }
    }
    const lines = (modal.innerText || '').split(/\n/).map((s) => s.trim()).filter(Boolean);
    for (const line of lines) {
      if (line.length > 0 && line.length < 50 && !/^\d/.test(line) && !line.includes('review') && !line.includes('Tripadvisor') && !looksLikeDate(line)) {
        return line;
      }
    }
    return '';
  }

  function getSupplierNameFromPage() {
    const header = document.querySelector('header, [class*="header"], [class*="Header"], nav');
    const root = header || document.body;
    const walk = (el) => {
      if (!el || el.childNodes.length > 50) return null;
      const text = (el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE)
        ? el.textContent.trim() : null;
      if (text && /^.+\s*\(\d+\)\s*$/.test(text)) {
        const match = text.match(/^(.+?)\s*\(\d+\)\s*$/);
        if (match) return match[1].trim();
      }
      for (const child of el.childNodes) {
        if (child.nodeType === Node.ELEMENT_NODE) {
          const t = walk(child);
          if (t) return t;
        }
      }
      return null;
    };
    const found = walk(root);
    if (found) return found;
    const fullText = (root.innerText || root.textContent || '').split(/\n/);
    for (const line of fullText) {
      const m = line.trim().match(/^(.+?)\s*\(\d{4,}\)\s*$/);
      if (m) return m[1].trim();
    }
    const combined = (root.textContent || '').match(/([A-Za-z0-9\s&]+)\s*\(\d{5,}\)/);
    if (combined) return combined[1].trim();
    return '';
  }

  function createReplyByAIButton(textarea) {
    if (textarea.nextElementSibling?.hasAttribute?.(INJECTED_ATTR)) {
      return;
    }
    const wrapper = document.createElement('div');
    wrapper.setAttribute(INJECTED_ATTR, 'true');
    wrapper.style.marginTop = '10px';
    wrapper.style.marginBottom = '8px';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Reply by AI';
    btn.style.cssText = [
      'padding: 6px 14px',
      'font-size: 14px',
      'background: #0d9488',
      'color: white',
      'border: none',
      'border-radius: 6px',
      'cursor: pointer',
      'font-weight: 500',
    ].join(';');
    btn.addEventListener('mouseenter', () => {
      btn.style.background = '#0f766e';
    });
    btn.addEventListener('mouseleave', () => {
      if (!btn.disabled) btn.style.background = '#0d9488';
    });

    const messageEl = document.createElement('span');
    messageEl.style.cssText = 'margin-left: 10px; font-size: 13px;';

    wrapper.appendChild(btn);
    wrapper.appendChild(messageEl);

    textarea.parentNode.insertBefore(wrapper, textarea.nextSibling);

    btn.addEventListener('click', async () => {
      const modal = textarea.closest('[role="dialog"], [class*="modal"], [class*="Modal"], [class*="dialog"]') || textarea.getRootNode().body;
      const { reviewTitle, reviewBody } = getReviewFromModal(modal);
      const reviewerName = getReviewerNameFromModal(modal);
      const supplierName = getSupplierNameFromPage();
      btn.disabled = true;
      btn.textContent = 'Generating…';
      messageEl.textContent = '';
      messageEl.className = '';

      try {
        const response = await chrome.runtime.sendMessage({
          action: 'generateReply',
          reviewTitle,
          reviewBody,
          reviewerName,
          supplierName,
        });
        if (response?.error) {
          if (response.error === 'NO_API_KEY') {
            messageEl.textContent = 'Set your Gemini API key in extension settings.';
          } else {
            messageEl.textContent = response.error;
          }
          messageEl.style.color = '#dc2626';
        } else if (response?.text) {
          textarea.value = response.text;
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
          messageEl.textContent = 'Reply inserted. You can edit before submitting.';
          messageEl.style.color = '#059669';
        } else {
          messageEl.textContent = 'Unexpected response. Check extension settings.';
          messageEl.style.color = '#dc2626';
        }
      } catch (e) {
        messageEl.textContent = e?.message || 'Error. Check extension settings.';
        messageEl.style.color = '#dc2626';
      }
      btn.disabled = false;
      btn.textContent = 'Reply by AI';
    });

    return wrapper;
  }

  function tryInject() {
    const found = findReplyModal();
    if (!found) return;
    const { textarea } = found;
    if (textarea.hasAttribute(INJECTED_ATTR)) return;
    createReplyByAIButton(textarea);
  }

  const observer = new MutationObserver(() => {
    tryInject();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  tryInject();
})();
