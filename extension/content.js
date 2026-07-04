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
  const REPLY_PANEL_MARKERS = [
    'reply to the traveler',
    'respond to review',
    'type your response',
    'send reply',
    'read faq',
  ];

  function isGetYourGuide() {
    return window.location.hostname.includes('getyourguide');
  }

  function isVisibleEnough(el) {
    if (!el || !(el instanceof Element)) return false;
    const st = window.getComputedStyle(el);
    if (st.display === 'none' || st.visibility === 'hidden') return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 || rect.height > 0;
  }

  /** Walk open shadow roots — GYG/Viator modals may render inside web components. */
  function queryAllDeep(selector, root = document) {
    const out = [];
    const visit = (node) => {
      if (!node) return;
      if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE || node.nodeType === Node.DOCUMENT_NODE) {
        node.querySelectorAll(selector).forEach((el) => out.push(el));
        node.querySelectorAll('*').forEach((el) => {
          if (el.shadowRoot) visit(el.shadowRoot);
        });
        return;
      }
      if (node.nodeType === Node.ELEMENT_NODE) {
        node.querySelectorAll(selector).forEach((el) => out.push(el));
        node.querySelectorAll('*').forEach((el) => {
          if (el.shadowRoot) visit(el.shadowRoot);
        });
      }
    };
    visit(root);
    return out;
  }

  function textareaLooksLikeReplyBox(ta) {
    const ph = (ta.getAttribute('placeholder') || '').toLowerCase();
    const aria = (ta.getAttribute('aria-label') || '').toLowerCase();
    return REPLY_PLACEHOLDER_TEXTS.some((p) => {
      const pl = p.toLowerCase();
      return ph.includes(pl) || ph.includes('response') || aria.includes(pl) || aria.includes('response');
    });
  }

  function findReplyPanelRoot(textarea) {
    const candidates = [];
    let el = textarea.parentElement;
    for (let i = 0; i < 30 && el; i++, el = el.parentElement) {
      if (!el.contains(textarea)) break;
      const text = el.innerText || '';
      if (text.length > 14000 || text.length < 25) continue;
      const lower = text.toLowerCase();
      if (REPLY_PANEL_MARKERS.some((m) => lower.includes(m))) {
        candidates.push({ el, len: text.length });
      }
    }
    if (candidates.length) {
      candidates.sort((a, b) => a.len - b.len);
      return candidates[0].el;
    }
    return (
      textarea.closest('[role="dialog"], [class*="modal"], [class*="Modal"], [class*="dialog"], [class*="overlay"], [class*="Overlay"]')
      || textarea.parentElement?.parentElement
      || document.body
    );
  }

  function findReplyModal() {
    const dialogs = queryAllDeep('[role="dialog"]');
    for (const dialog of dialogs) {
      const textarea = dialog.querySelector('textarea');
      if (textarea && isVisibleEnough(textarea)) {
        return { modal: dialog, textarea };
      }
    }

    const textareas = queryAllDeep('textarea');
    for (const ta of textareas) {
      if (!isVisibleEnough(ta)) continue;
      const modal = ta.closest('[role="dialog"], [class*="modal"], [class*="Modal"], [class*="dialog"]');
      if (modal) return { modal, textarea: ta };
    }

    for (const ta of textareas) {
      if (!isVisibleEnough(ta)) continue;
      if (!textareaLooksLikeReplyBox(ta)) continue;
      return { modal: findReplyPanelRoot(ta), textarea: ta };
    }

    if (isGetYourGuide()) {
      for (const ta of textareas) {
        if (!isVisibleEnough(ta)) continue;
        const root = findReplyPanelRoot(ta);
        const lower = (root.innerText || '').toLowerCase();
        if (lower.includes('reply to the traveler') || lower.includes('send reply')) {
          return { modal: root, textarea: ta };
        }
      }
    }

    return null;
  }

  function setTextareaValue(textarea, text) {
    const proto = window.HTMLTextAreaElement?.prototype;
    const setter = proto && Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (setter) {
      setter.call(textarea, text);
    } else {
      textarea.value = text;
    }
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));
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
      const skip = (t) => {
        const l = t.toLowerCase();
        if (REPLY_PLACEHOLDER_TEXTS.some((p) => t === p || t.startsWith(p))) return true;
        if (l === 'reply to the traveler') return true;
        if (l === 'send reply' || l === 'read faq') return true;
        if (l.includes('reply will be checked with ai')) return true;
        if (/^\d+\s*\/\s*400$/.test(l)) return true;
        return false;
      };
      const contentLines = lines.filter((t) => !skip(t) && t.length > 10);
      if (contentLines.length > 0) reviewTitle = contentLines[0];
      if (contentLines.length > 1) reviewBody = contentLines.slice(1).join('\n').trim();
      else if (contentLines.length === 1 && contentLines[0].length > 20) reviewBody = contentLines[0];
      if (!reviewBody && contentLines.length) {
        const byLen = [...contentLines].sort((a, b) => b.length - a.length);
        reviewBody = byLen.find((l) => l.length > 25 && !looksLikeDate(l)) || '';
      }
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

    const host = textarea.parentElement || textarea;
    host.insertAdjacentElement('afterend', wrapper);

    btn.addEventListener('click', async () => {
      const modal =
        textarea.closest('[role="dialog"], [class*="modal"], [class*="Modal"], [class*="dialog"]')
        || findReplyPanelRoot(textarea);
      const { reviewTitle, reviewBody } = getReviewFromModal(modal);
      const reviewerName = getReviewerNameFromModal(modal);
      const supplierName = getSupplierNameFromPage();
      const isGYG = isGetYourGuide();
      const maxChars = isGYG ? 400 : (textarea.getAttribute('maxlength') ? parseInt(textarea.getAttribute('maxlength'), 10) : null);
      btn.disabled = true;
      btn.textContent = 'Generating…';
      messageEl.textContent = '';
      messageEl.className = '';

      try {
        const { companyName } = await chrome.storage.sync.get('companyName');
        const response = await chrome.runtime.sendMessage({
          action: 'generateReply',
          reviewTitle,
          reviewBody,
          reviewerName,
          supplierName,
          companyName: companyName || '',
          maxCharacters: maxChars && !isNaN(maxChars) ? maxChars : undefined,
        });
        if (response?.error) {
          if (response.error === 'NO_API_KEY') {
            messageEl.textContent = 'Set your Gemini API key in extension settings.';
          } else {
            messageEl.textContent = response.error;
          }
          messageEl.style.color = '#dc2626';
        } else if (response?.text) {
          let text = response.text;
          const maxLen = isGYG ? 400 : textarea.getAttribute('maxlength');
          if (maxLen) {
            const n = parseInt(maxLen, 10);
            if (!isNaN(n) && text.length > n) text = text.slice(0, n);
          }
          setTextareaValue(textarea, text);
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
    const host = textarea.parentElement || textarea;
    if (host.nextElementSibling?.hasAttribute?.(INJECTED_ATTR)) return;
    if (textarea.nextElementSibling?.hasAttribute?.(INJECTED_ATTR)) return;
    createReplyByAIButton(textarea);
  }

  const observer = new MutationObserver(() => {
    tryInject();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  tryInject();
})();
