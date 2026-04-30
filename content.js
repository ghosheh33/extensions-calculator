chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "showPopup") {
    showFloatingPopup(request.text, request.isError);
  }
});

function showFloatingPopup(text, isError) {
  const existingPopup = document.getElementById('smart-calc-floating-popup');
  if (existingPopup) existingPopup.remove();

  const selection = window.getSelection();
  if (!selection.rangeCount) return;
  
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  const popup = document.createElement('div');
  popup.id = 'smart-calc-floating-popup';
  popup.textContent = text;
  
  Object.assign(popup.style, {
    position: 'absolute',
    left: `${rect.left + window.scrollX + (rect.width / 2)}px`,
    top: `${rect.top + window.scrollY - 10}px`,
    transform: 'translate(-50%, -100%)',
    backgroundColor: isError ? '#ff453a' : '#23252d',
    color: '#ffffff',
    padding: '8px 16px',
    borderRadius: '10px',
    fontSize: '15px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontWeight: '500',
    boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.1)',
    zIndex: '2147483647',
    pointerEvents: 'none',
    opacity: '0',
    transition: 'opacity 0.3s ease, top 0.3s ease',
    whiteSpace: 'nowrap',
    direction: 'ltr'
  });

  document.body.appendChild(popup);

  requestAnimationFrame(() => {
    popup.style.opacity = '1';
    popup.style.top = `${rect.top + window.scrollY - 15}px`;
  });

  setTimeout(() => {
    popup.style.opacity = '0';
    setTimeout(() => popup.remove(), 300);
  }, 4000);
}