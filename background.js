// Background service worker: forwards show/hide requests to the active tab
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    if (!message || !message.action) return;
    if (message.action === 'twoelve-show-toolbar' || message.action === 'twoelve-hide-toolbar') {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || !tabs[0]) return sendResponse && sendResponse({ ok: false });
        chrome.tabs.sendMessage(tabs[0].id, { action: message.action }, () => {
          sendResponse && sendResponse({ ok: true });
        });
      });
      // return true to indicate async sendResponse
      return true;
    }

    if (message.action === 'twoelve-open-config') {
      // Abre a página de configurações em uma nova aba da extensão
      chrome.tabs.create({ url: chrome.runtime.getURL('config.html') });
      sendResponse && sendResponse({ ok: true });
      return true;
    }

    if (message.action === 'twoelve-config-changed') {
      // Reaplica as configurações em todas as abas abertas
      chrome.tabs.query({}, (tabs) => {
        (tabs || []).forEach((tab) => {
          if (tab && tab.id != null && tab.url && /^https?:/.test(tab.url)) {
            chrome.tabs.sendMessage(tab.id, { action: 'twoelve-config-changed' }, () => {});
          }
        });
        sendResponse && sendResponse({ ok: true });
      });
      return true;
    }
  } catch (e) {
    console.error('background error', e);
  }
});
