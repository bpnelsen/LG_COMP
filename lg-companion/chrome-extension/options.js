const backendInput = document.getElementById('backendUrl');
const domainInput = document.getElementById('targetDomain');
const saveBtn = document.getElementById('saveBtn');
const saved = document.getElementById('saved');

chrome.storage.sync.get(
  { backendUrl: 'http://localhost:3001', targetDomain: 'landgorilla.com' },
  ({ backendUrl, targetDomain }) => {
    backendInput.value = backendUrl;
    domainInput.value = targetDomain;
  }
);

saveBtn.addEventListener('click', () => {
  chrome.storage.sync.set(
    { backendUrl: backendInput.value.trim(), targetDomain: domainInput.value.trim() },
    () => {
      saved.style.display = 'inline';
      setTimeout(() => { saved.style.display = 'none'; }, 2000);
    }
  );
});
