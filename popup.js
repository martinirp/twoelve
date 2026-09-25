document.addEventListener('DOMContentLoaded', async () => {
  const toggle = document.getElementById('toggle');
  const status = document.getElementById('status');
  const showBtn = document.getElementById('show');
  const hideBtn = document.getElementById('hide');
  const resetBtn = document.getElementById('reset');

  function setStatusText(v){ status.textContent = v ? 'Visível' : 'Oculta'; toggle.checked = !!v; }

  // read current state
  chrome.storage.local.get(['twoelveToolbarState'], (res) => {
    const st = res.twoelveToolbarState || {};
    setStatusText(st.visible === true);
  });

  async function showToolbar(){
    // persist and notify active tab
    chrome.storage.local.set({ twoelveToolbarState: { ...(await getCurrentPos()), visible: true } }, () => {});
    chrome.runtime.sendMessage({ action: 'twoelve-show-toolbar' }, () => {});
    setStatusText(true);
  }

  async function hideToolbar(){
    chrome.storage.local.get(['twoelveToolbarState'], (res) => {
      const cur = res.twoelveToolbarState || {};
      chrome.storage.local.set({ twoelveToolbarState: { left: cur.left || 20, top: cur.top || 20, visible: false } });
    });
    // notify page (via background)
    chrome.runtime.sendMessage({ action: 'twoelve-hide-toolbar' }, () => {});
    setStatusText(false);
  }

  function getCurrentPos(){
    return new Promise(resolve => {
      chrome.storage.local.get(['twoelveToolbarState'], (res) => {
        resolve(res.twoelveToolbarState || {});
      });
    });
  }

  toggle.addEventListener('change', (e) => {
    if (e.target.checked) showToolbar(); else hideToolbar();
  });

  showBtn.addEventListener('click', showToolbar);
  hideBtn.addEventListener('click', hideToolbar);

  resetBtn.addEventListener('click', () => {
    // remove saved position
    chrome.storage.local.set({ twoelveToolbarState: { left: 20, top: 20, visible: true } }, () => {
      // tell active tab to show and adopt position
      chrome.runtime.sendMessage({ action: 'twoelve-show-toolbar' }, () => {});
    });
    setStatusText(true);
  });

});
