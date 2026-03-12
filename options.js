/**
 * Viator "Reply by AI" Chrome Extension - Options page
 * Copyright © Anywhere.tours
 */
document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('apiKey');
  const saveBtn = document.getElementById('save');
  const clearBtn = document.getElementById('clear');
  const statusEl = document.getElementById('status');

  function showStatus(message, type) {
    statusEl.textContent = message;
    statusEl.className = 'status ' + (type || '');
  }

  chrome.storage.sync.get('geminiApiKey', (data) => {
    if (data.geminiApiKey) {
      apiKeyInput.value = data.geminiApiKey;
    }
  });

  saveBtn.addEventListener('click', () => {
    const value = apiKeyInput.value.trim();
    if (!value) {
      showStatus('Please enter an API key.', 'error');
      return;
    }
    chrome.storage.sync.set({ geminiApiKey: value }, () => {
      showStatus('API key saved.', 'success');
    });
  });

  clearBtn.addEventListener('click', () => {
    chrome.storage.sync.remove('geminiApiKey', () => {
      apiKeyInput.value = '';
      showStatus('API key cleared.', 'success');
    });
  });
});
