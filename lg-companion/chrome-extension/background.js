// Service worker — captures screenshots on navigation and relays them to the backend.

const DEFAULT_BACKEND = 'http://localhost:3001';

async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(
      { backendUrl: DEFAULT_BACKEND, enabled: true, targetDomain: 'landgorilla.com' },
      resolve
    );
  });
}

function matchesDomain(url, domain) {
  if (!domain) return true;
  try {
    return new URL(url).hostname.includes(domain);
  } catch {
    return false;
  }
}

async function captureAndSend(tab, trigger) {
  const { backendUrl, enabled, targetDomain } = await getSettings();
  if (!enabled) return;
  if (!tab?.url || !matchesDomain(tab.url, targetDomain)) return;
  if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) return;

  let dataUrl;
  try {
    dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
  } catch (err) {
    console.warn('[LG Companion] Screenshot failed:', err.message);
    return;
  }

  const payload = {
    url: tab.url,
    title: tab.title || '',
    trigger,
    timestamp: new Date().toISOString(),
    screenshot: dataUrl, // base64 data URL
  };

  try {
    await fetch(`${backendUrl}/captures`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn('[LG Companion] Failed to send capture:', err.message);
  }
}

// Capture on completed navigation
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    captureAndSend(tab, 'navigation');
  }
});

// Capture when user switches to a tab
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId);
  captureAndSend(tab, 'tab_focus');
});

// Listen for messages from content script (modal open, form submit, etc.)
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === 'CAPTURE') {
    chrome.tabs.get(sender.tab.id, (tab) => {
      captureAndSend(tab, message.trigger);
    });
  }
});
