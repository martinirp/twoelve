// ==============================================
// TwoElve — Aviso de nova atualização (todas as páginas)
// ==============================================
// Pergunta ao background se existe versão mais nova publicada no GitHub
// (branch conforme o manifest: twoelveBranch). Se houver, mostra uma barra
// fixa no topo da página atual. Clicar na barra (ou em "ATUALIZAR") abre o
// passo a passo de atualização com botão de download do ZIP.
(function () {
    if (window.top !== window) return; // só no frame principal

    const manifest = (chrome.runtime.getManifest && chrome.runtime.getManifest()) || {};
    const BRANCH = manifest.twoelveBranch || 'main';

    function criarEstilos() {
        const style = document.createElement('style');
        style.id = 'twoelve-update-styles';
        style.textContent = [
            '#twoelve-update-bar{position:fixed;top:0;left:0;right:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;gap:12px;padding:9px 64px 9px 16px;background:#0b4f9e;color:#fff;font:600 14px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;box-shadow:0 2px 12px rgba(0,0,0,.4);cursor:pointer}',
            '#twoelve-update-bar button{font:700 12px/1 system-ui,sans-serif;border:0;border-radius:4px;padding:9px 14px;cursor:pointer}',
            '#twoelve-upd-btn{background:#ffd400;color:#1a2b49}',
            '#twoelve-upd-btn:hover{background:#ffe766}',
            '#twoelve-upd-close{position:absolute;right:10px;top:50%;transform:translateY(-50%);background:transparent;color:#cfe2ff;font-size:16px;padding:8px}',
            '#twoelve-upd-close:hover{color:#fff}',
            '#twoelve-upd-modal p{margin:0 0 10px}',
            '#twoelve-upd-modal ol{margin:6px 0 16px 20px;padding:0}',
            '#twoelve-upd-modal li{margin:4px 0}',
            '#twoelve-upd-modal code{background:#eef2f7;border-radius:3px;padding:1px 5px;font-size:12px}',
            '#twoelve-upd-modal .twoelve-upd-actions{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;margin-top:14px}',
            '#twoelve-upd-modal .twoelve-upd-actions button{font:700 13px/1 system-ui,sans-serif;border:0;border-radius:4px;padding:10px 16px;cursor:pointer}',
            '#twoelve-upd-config{background:#0b4f9e;color:#fff}',
            '#twoelve-upd-config:hover{background:#0d5cb8}',
            '#twoelve-upd-download{background:#e5e9ef;color:#1a2b49}',
            '#twoelve-upd-download:hover{background:#d5dbe4}',
            '#twoelve-upd-done{background:#e5e9ef;color:#1a2b49}',
            '#twoelve-upd-done:hover{background:#d5dbe4}'
        ].join('\n');
        (document.head || document.documentElement).appendChild(style);
    }

    function criarBarra(info) {
        const anterior = document.getElementById('twoelve-update-bar');
        if (anterior) anterior.remove();

        const bar = document.createElement('div');
        bar.id = 'twoelve-update-bar';
        bar.innerHTML =
            '<span>⚡ <b>Nova atualização do TwoElve disponível!</b> ' +
            'v' + info.local + ' → v' + info.novaVersao + ' (branch ' + info.branch + ') — atualize em 1 clique, sem mexer no chrome://extensions.</span>' +
            '<button id="twoelve-upd-btn">ATUALIZAR</button>' +
            '<button id="twoelve-upd-close" title="Fechar">✕</button>';

        bar.addEventListener('click', (e) => {
            if (e.target && e.target.id === 'twoelve-upd-close') {
                e.stopPropagation();
                bar.remove();
                return;
            }
            abrirModalAtualizacao(info);
        });

        (document.body || document.documentElement).appendChild(bar);
    }

    function abrirModalAtualizacao(info) {
        if (typeof window.TwoelveModalBase !== 'function') {
            // fallback raro (modalbase ainda não carregou): abre o download direto
            window.open(info.url, '_blank');
            return;
        }

        const modal = new TwoelveModalBase('⚡ Atualizar TwoElve');
        modal.abrir();

        const corpo = document.createElement('div');
        corpo.id = 'twoelve-upd-modal';
        corpo.style.cssText = 'padding:18px;font:14px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#222;max-width:540px;min-width:380px';

        corpo.innerHTML =
            '<p>Você está na <b>v' + info.local + '</b> e a <b>v' + info.novaVersao + '</b> já está publicada no branch <b>' + info.branch + '</b>.</p>' +
            '<ol>' +
            '<li>Abra as <b>Configurações do TwoElve</b> (botão abaixo).</li>' +
            '<li>Na aba <b>Atualizar</b>, confira a branch e clique em <b>⬇️ Atualizar agora</b>.</li>' +
            '<li>Pronto — ela baixa, extrai na sua pasta e <b>reinicia sozinha</b>. Sem <code>chrome://extensions</code>, sem F5 na mão.</li>' +
            '</ol>' +
            '<div class="twoelve-upd-actions">' +
            '<button id="twoelve-upd-config">⚙️ Abrir Configurações</button>' +
            '<button id="twoelve-upd-download">📥 ZIP manual</button>' +
            '<button id="twoelve-upd-done">Agora não</button>' +
            '</div>';

        modal.setConteudoElemento(corpo);

        const btnConfig = corpo.querySelector('#twoelve-upd-config');
        if (btnConfig) {
            btnConfig.addEventListener('click', () => {
                try {
                    chrome.runtime.sendMessage({ action: 'twoelve-open-config' }, () => {
                        void chrome.runtime.lastError;
                    });
                } catch (e) {
                    window.open(info.url, '_blank');
                }
                modal.fechar();
            });
        }
        const btnDownload = corpo.querySelector('#twoelve-upd-download');
        if (btnDownload) {
            btnDownload.addEventListener('click', () => {
                window.open(info.url, '_blank');
            });
        }
        const btnDone = corpo.querySelector('#twoelve-upd-done');
        if (btnDone) {
            btnDone.addEventListener('click', () => {
                modal.fechar();
            });
        }
    }

    function verificar() {
        try {
            chrome.runtime.sendMessage({ action: 'twoelve-check-update' }, (resp) => {
                if (chrome.runtime.lastError || !resp || !resp.novaVersao) return;
                criarEstilos();
                criarBarra(resp);
            });
        } catch (e) {
            // sem background/API disponível — ignora silenciosamente
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', verificar);
    } else {
        verificar();
    }
})();