/**
 * Viator "Reply by AI" Chrome Extension - Options page
 * Copyright © Anywhere.tours
 */
document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('apiKey');
  const saveBtn = document.getElementById('save');
  const clearBtn = document.getElementById('clear');
  const statusEl = document.getElementById('status');
  const licenseKeyInput = document.getElementById('licenseKey');
  const activateBtn = document.getElementById('activate');
  const deactivateBtn = document.getElementById('deactivate');
  const proNotActive = document.getElementById('proNotActive');
  const proActive = document.getElementById('proActive');
  const proStatusEl = document.getElementById('proStatus');

  function showStatus(message, type) {
    statusEl.textContent = message;
    statusEl.className = 'status ' + (type || '');
  }

  function showProStatus(message, type) {
    proStatusEl.textContent = message;
    proStatusEl.className = 'status ' + (type || '');
  }

  function updateProUI(isActive) {
    if (isActive) {
      proNotActive.style.display = 'none';
      proActive.style.display = 'block';
      licenseKeyInput.value = '';
      showProStatus('');
    } else {
      proNotActive.style.display = 'block';
      proActive.style.display = 'none';
    }
  }

  chrome.storage.sync.get(['geminiApiKey', 'proActivated'], (data) => {
    if (data.geminiApiKey) apiKeyInput.value = data.geminiApiKey;
    updateProUI(!!data.proActivated);
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

  activateBtn.addEventListener('click', () => {
    const key = licenseKeyInput.value.trim();
    if (!key) {
      showProStatus('Please enter a license key.', 'error');
      return;
    }
    showProStatus('Checking...', '');
    activateBtn.disabled = true;
    chrome.runtime.sendMessage({ action: 'validateLicense', licenseKey: key }, (response) => {
      activateBtn.disabled = false;
      if (chrome.runtime.lastError) {
        showProStatus('Error. Try again.', 'error');
        return;
      }
      if (response && response.valid) {
        chrome.storage.sync.set({ proActivated: true, proLicenseKey: key }, () => {
          updateProUI(true);
          showProStatus('Pro activated.', 'success');
        });
      } else {
        showProStatus('Invalid or expired key.', 'error');
      }
    });
  });

  deactivateBtn.addEventListener('click', () => {
    chrome.storage.sync.remove(['proActivated', 'proLicenseKey'], () => {
      updateProUI(false);
      showProStatus('Pro deactivated.', 'success');
    });
  });
});
