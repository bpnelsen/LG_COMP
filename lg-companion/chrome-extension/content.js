// Content script — detects significant in-page events and asks the background
// worker to take a screenshot.

function requestCapture(trigger) {
  chrome.runtime.sendMessage({ type: 'CAPTURE', trigger });
}

// Modal / dialog opened (MutationObserver watches for dialog/role=dialog elements)
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      const el = node;
      if (
        el.tagName === 'DIALOG' ||
        el.getAttribute('role') === 'dialog' ||
        el.classList.contains('modal') ||
        el.classList.contains('overlay') ||
        el.querySelector('[role="dialog"]')
      ) {
        requestCapture('modal_open');
        return;
      }
    }
  }
});

observer.observe(document.body, { childList: true, subtree: true });

// Form submissions
document.addEventListener(
  'submit',
  () => requestCapture('form_submit'),
  { capture: true }
);

// Single-page app route changes (history API)
const _pushState = history.pushState.bind(history);
history.pushState = function (...args) {
  _pushState(...args);
  requestCapture('spa_navigation');
};

window.addEventListener('popstate', () => requestCapture('spa_navigation'));

// Capture after significant clicks (buttons, links, nav items)
document.addEventListener(
  'click',
  (e) => {
    const target = e.target.closest('button, a, [role="button"], [role="menuitem"], [role="tab"], nav *');
    if (target) {
      // Slight delay so the UI can react before the screenshot
      setTimeout(() => requestCapture('click'), 600);
    }
  },
  { capture: true }
);
