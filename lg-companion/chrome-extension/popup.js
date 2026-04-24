const dot = document.getElementById('statusDot');
const label = document.getElementById('statusLabel');
const toggleBtn = document.getElementById('toggleBtn');
const captureBtn = document.getElementById('captureBtn');
const stat = document.getElementById('stat');

async function load() {
  const { enabled, backendUrl, captureCount } = await chrome.storage.sync.get({
    enabled: true,
    backendUrl: 'http://localhost:3001',
    captureCount: 0,
  });

  dot.className = `dot ${enabled ? 'active' : 'inactive'}`;
  label.textContent = enabled ? 'Recording' : 'Paused';
  toggleBtn.textContent = enabled ? 'Pause Recording' : 'Start Recording';
  toggleBtn.className = enabled ? 'on' : 'off';
  stat.textContent = `${captureCount} captures sent`;

  // Check backend connectivity
  try {
    const res = await fetch(`${backendUrl}/health`, { signal: AbortSignal.timeout(2000) });
    if (!res.ok) throw new Error();
    label.textContent += ' · backend connected';
  } catch {
    label.textContent += ' · backend offline';
    dot.className = 'dot inactive';
  }
}

toggleBtn.addEventListener('click', async () => {
  const { enabled } = await chrome.storage.sync.get({ enabled: true });
  await chrome.storage.sync.set({ enabled: !enabled });
  load();
});

captureBtn.addEventListener('click', async () => {
  captureBtn.disabled = true;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.runtime.sendMessage({ type: 'CAPTURE', trigger: 'manual' });
  const { captureCount } = await chrome.storage.sync.get({ captureCount: 0 });
  await chrome.storage.sync.set({ captureCount: captureCount + 1 });
  setTimeout(() => { captureBtn.disabled = false; load(); }, 1000);
});

load();
