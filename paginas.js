// ==============================================
// PAGINAS.JS - Whitelist de páginas onde o TwoElve atua
// -------------------------------------------------
// O TwoElve só funciona nas páginas da lista
// "twoelvePaginasAutorizadas" (Configurações → 🌐 Páginas).
// Padrão: apenas erp.elo.net.br — em QUALQUER outra página a
// extensão fica completamente inativa.
//
// Este arquivo é o PRIMEIRO script de cada bloco content_scripts
// do manifest e define window.TwoelvePaginas:
//   - TwoelvePaginas.autorizada()  → a página atual pode rodar?
//   - TwoelvePaginas.lista()       → lista atual (para diagnóstico)
//
// Páginas da própria extensão (chrome-extension:// da config.html,
// file:// e about:) nunca são bloqueadas — o guard dos content
// scripts espera window.TwoelvePaginas existir; onde não existe
// (ex.: config.html carrega atalhos.js via <script>), nada bloqueia.
// ==============================================
(() => {
    'use strict';

    if (window.TwoelvePaginas) return; // já definido por outra inclusão

    const CHAVE = 'twoelvePaginasAutorizadas';
    const PADRAO = ['erp.elo.net.br'];
    let lista = PADRAO.slice();

    const normalizarHost = (h) => String(h || '').trim().toLowerCase().replace(/^https?:\/\//i, '').split('/')[0];

    const autorizada = () => {
        try {
            const proto = window.location.protocol;
            if (proto === 'chrome-extension:' || proto === 'file:' || proto === 'about:') return true;
        } catch (e) { return true; }
        const host = (window.location.hostname || '').toLowerCase();
        if (!host) return false;
        return lista.some((p) => {
            const n = normalizarHost(p);
            if (!n) return false;
            return host === n || host.endsWith('.' + n);
        });
    };

    // Promise que resolve quando a lista foi lida do storage — os content
    // scripts aguardam ela antes de decidir se rodam ou não.
    let resolvePronto;
    const pronto = new Promise((resolve) => { resolvePronto = resolve; });

    window.TwoelvePaginas = {
        autorizada,
        lista: () => lista.slice(),
        pronto
    };

    // carrega a lista salva e mantém atualizada em tempo real
    try {
        const carregar = (res) => {
            const v = res && res[CHAVE];
            lista = (Array.isArray(v) && v.length) ? v.map(normalizarHost).filter(Boolean) : PADRAO.slice();
        };
        const p = chrome.storage.local.get(CHAVE);
        if (p && p.then) p.then((res) => { carregar(res); resolvePronto(); }).catch(() => resolvePronto());
        else chrome.storage.local.get(CHAVE, (res) => { carregar(res); resolvePronto(); });
        chrome.storage.onChanged.addListener((changes, area) => {
            if (area !== 'local' || !changes[CHAVE]) return;
            const v = changes[CHAVE].newValue;
            lista = (Array.isArray(v) && v.length) ? v.map(normalizarHost).filter(Boolean) : PADRAO.slice();
        });
    } catch (e) { resolvePronto(); }
})();