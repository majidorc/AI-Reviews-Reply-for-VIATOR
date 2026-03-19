/**
 * Reply by AI - Popup script
 * Copyright © Anywhere.tours
 */
document.getElementById('openOptions').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

document.getElementById('settings').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});
