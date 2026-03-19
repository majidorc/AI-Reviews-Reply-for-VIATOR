/**
 * Reply by AI - Options page
 * Copyright © Anywhere.tours
 */
document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('apiKey');
  const companyNameInput = document.getElementById('companyName');
  const saveBtn = document.getElementById('save');
  const saveCompanyBtn = document.getElementById('saveCompany');
  const clearBtn = document.getElementById('clear');
  const statusEl = document.getElementById('status');

  function showStatus(message, type) {
    statusEl.textContent = message;
    statusEl.className = 'status ' + (type || '');
  }

  chrome.storage.sync.get(['geminiApiKey', 'companyName'], (data) => {
    if (data.geminiApiKey) apiKeyInput.value = data.geminiApiKey;
    if (data.companyName) companyNameInput.value = data.companyName;
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

  saveCompanyBtn.addEventListener('click', () => {
    const value = companyNameInput.value.trim();
    chrome.storage.sync.set({ companyName: value }, () => {
      showStatus(value ? 'Company name saved.' : 'Company name cleared.', 'success');
    });
  });

  clearBtn.addEventListener('click', () => {
    chrome.storage.sync.remove('geminiApiKey', () => {
      apiKeyInput.value = '';
      showStatus('API key cleared.', 'success');
    });
  });
});
