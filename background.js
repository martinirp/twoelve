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

    if (message.action === 'twoelve-open-utils') {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0] && tabs[0].id != null) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'twoelve-open-utils' }, () => { void chrome.runtime.lastError; });
        }
        sendResponse && sendResponse({ ok: true });
      });
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

    if (message.action === 'twoelve-check-update') {
      // Verifica no GitHub se há versão mais nova publicada (máx. 1x a cada 30 min)
      const branch = ((chrome.runtime.getManifest && chrome.runtime.getManifest().twoelveBranch) || 'main');
      const local = (chrome.runtime.getManifest && chrome.runtime.getManifest().version) || '0.0.0';
      chrome.storage.local.get(['twoelveUpdateInfo'], (res) => {
        const cache = res.twoelveUpdateInfo || {};
        const agora = Date.now();
        // usa o cache se a última checagem foi há menos de 30 minutos E for a mesma branch
        // ignora cache se branch mudou (evita mostrar update errado entre dev/main)
        if (cache.branch && cache.branch !== branch) {
          cache = {};
        }

        if (cache.checkedAt && cache.branch === branch && (agora - cache.checkedAt) < 30 * 60 * 1000) {
          sendResponse && sendResponse({
            local: local,
            remota: cache.remota || '',
            novaVersao: cache.novaVersao || null,
            branch: branch,
            url: cache.url || ''
          });
          return;
        }
        fetch('https://raw.githubusercontent.com/martinirp/twoelve/' + branch + '/manifest.json', { cache: 'no-store' })
          .then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
          .then((remoto) => {
            const remota = (remoto && remoto.version) ? String(remoto.version) : '';
            const novaVersao = (remota && compararVersoes(local, remota) < 0) ? remota : null;
            const info = {
              checkedAt: agora,
              branch: branch,
              local: local,
              remota: remota,
              novaVersao: novaVersao,
              url: 'https://github.com/martinirp/twoelve/archive/refs/heads/' + branch + '.zip'
            };
            chrome.storage.local.set({ twoelveUpdateInfo: info });
            sendResponse && sendResponse(info);
          })
          .catch((e) => {
            sendResponse && sendResponse({ checkedAt: agora, branch: branch, local: local, remota: '', novaVersao: null, erro: String((e && e.message) || e) });
          });
      });
      return true;
    }
  } catch (e) {
    console.error('background error', e);
  }
});

// Compara versões "X.Y.Z" segmento a segmento: -1 (a < b), 0 (iguais), 1 (a > b)
function compararVersoes(a, b) {
  const A = String(a).split('.').map((n) => parseInt(n, 10) || 0);
  const B = String(b).split('.').map((n) => parseInt(n, 10) || 0);
  const len = Math.max(A.length, B.length);
  for (let i = 0; i < len; i++) {
    const x = A[i] || 0;
    const y = B[i] || 0;
    if (x !== y) return x < y ? -1 : 1;
  }
  return 0;
}
