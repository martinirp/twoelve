// ==============================================
// SIDEBAR.JS - Toolbar recolhível TwoElve v6.0
// Comportamento: linha no topo, expande no hover
// ==============================================

(function() {

    // --- WRAPPER (posicionamento fixo no topo) ---
    const wrapper = document.createElement('div');
    wrapper.className = 'twoelve-wrapper';

    // --- LINHA / HANDLE (sempre visível) ---
    const handle = document.createElement('div');
    handle.className = 'twoelve-handle';

    // --- BARRA (fica escondida, aparece no hover) ---
    const div = document.createElement('div');
    div.className = 'twoelve-sidebar';
    div.innerHTML = `
        <button class="twoelve-btn" data-action="utils">🛠️ Utils</button>
        <button class="twoelve-btn" data-action="mensagens">💬 Mensagens</button>
        <button class="twoelve-btn" data-action="suporte">✅ Suporte</button>
        <button class="twoelve-btn" data-action="visita">🚗 Visita</button>
        <button class="twoelve-btn" data-action="encaminhar">📤 Encaminhar</button>
        <button class="twoelve-config" data-action="config">⚙️</button>
        <button class="twoelve-config twoelve-pin" data-action="pin" title="Fixar barra">📌</button>
    `;

    wrapper.appendChild(handle);
    wrapper.appendChild(div);

    const style = document.createElement('style');
    style.textContent = `
        /* wrapper: ancora tudo no topo centralizado */
        .twoelve-wrapper {
            position: fixed;
            top: 0;
            left: 50%;
            transform: translateX(-50%);
            z-index: 999999;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        /* linha preta sempre visível */
        .twoelve-handle {
            width: 120px;
            height: 5px;
            background: #000000;
            border-radius: 0 0 4px 4px;
            cursor: pointer;
            transition: width 0.2s ease, height 0.15s ease;
        }

        /* barra recolhida por padrão */
        .twoelve-sidebar {
            display: flex;
            gap: 8px;
            padding: 8px 12px;
            background: #ffffff;
            border: 2px solid #000000;
            box-shadow: 4px 4px 0px #000000;
            font-family: 'Inter', sans-serif;
            /* animação de slide para baixo */
            max-height: 0;
            overflow: hidden;
            opacity: 0;
            pointer-events: none;
            transition: max-height 0.22s cubic-bezier(0.4,0,0.2,1),
                        opacity 0.18s ease,
                        padding 0.18s ease;
            padding-top: 0;
            padding-bottom: 0;
        }

        /* expande quando o wrapper estiver em hover */
        .twoelve-wrapper:hover .twoelve-sidebar,
        .twoelve-wrapper.twoelve-pinned .twoelve-sidebar {
            max-height: 80px;
            opacity: 1;
            pointer-events: auto;
            padding: 8px 12px;
        }

        /* alarga a linha no hover */
        .twoelve-wrapper:hover .twoelve-handle {
            width: 200px;
        }

        .twoelve-btn, .twoelve-config {
            padding: 8px 16px;
            font-size: 13px;
            font-weight: 600;
            background: #ffffff;
            color: #1a1a1a;
            border: 2px solid #000000;
            cursor: pointer;
            box-shadow: 3px 3px 0px #000000;
            transition: all 0.08s linear;
            white-space: nowrap;
        }
        .twoelve-config {
            padding: 8px 14px;
            font-size: 16px;
        }
        .twoelve-btn:hover, .twoelve-config:hover {
            transform: translate(-2px, -2px);
            box-shadow: 5px 5px 0px #000000;
        }
        .twoelve-btn:active, .twoelve-config:active {
            transform: translate(1px, 1px);
            box-shadow: 1px 1px 0px #000000;
        }
        .twoelve-hide {
            padding: 6px 8px;
            font-size: 12px;
        }
        .twoelve-pin {
            padding: 6px 10px;
            font-size: 14px;
            opacity: 0.5;
            transition: opacity 0.15s, transform 0.08s linear, box-shadow 0.08s linear;
        }
        .twoelve-pin.ativo {
            opacity: 1;
            background: #000000 !important;
            color: #ffffff !important;
        }
        .twoelve-wrapper.twoelve-pinned .twoelve-handle {
            width: 200px;
        }

        /* ===== MODO LATERAL: abas coloridas na lateral (independentes da toolbar) ===== */
        /* no modo lateral a toolbar some totalmente, entra a fileira de abas */
        body.twoelve-lateral .twoelve-wrapper {
            display: none !important;
        }
        .twoelve-abas {
            position: fixed;
            top: 50%;
            right: 0;
            transform: translateY(-50%);
            z-index: 999999;
            display: none;
            flex-direction: column;
            gap: 8px;
            padding: 10px 0;
            transition: right 0.22s cubic-bezier(0.4, 0, 0.2, 1);
        }
        body.twoelve-lateral .twoelve-abas {
            display: flex;
        }
        /* aba pequena, sem texto — só a setinha < (e > quando aberta)
           metade fica cortada para fora da tela */
        .twoelve-aba {
            position: relative;
            width: 64px;
            height: 56px;
            border: 2px solid #000000;
            border-right: 0;
            border-radius: 8px 0 0 8px;
            color: #ffffff;
            font-family: 'Inter', sans-serif;
            font-size: 20px;
            font-weight: 800;
            line-height: 1;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: flex-start;
            padding: 0 0 0 12px;
            box-shadow: 2px 2px 0px rgba(0,0,0,0.3);
            transition: filter 0.15s ease, box-shadow 0.15s ease;
            overflow: hidden;
            transform: translateX(32px); /* metade para fora da tela */
        }
        .twoelve-aba .twoelve-aba-seta::before {
            content: '<';
        }
        .twoelve-aba:hover {
            filter: brightness(1.12);
            box-shadow: 3px 3px 0px rgba(0,0,0,0.4);
        }
        .twoelve-aba.twoelve-aba-ativa {
            filter: brightness(1.25);
            box-shadow: 4px 4px 0px #000000;
            z-index: 2;
            transform: none; /* fica inteira ao abrir */
            justify-content: center;
            padding: 0;
        }
        .twoelve-aba.twoelve-aba-ativa .twoelve-aba-seta::before {
            content: '>';
        }
        /* cada aba com uma cor diferente */
        .twoelve-aba[data-action="utils"]      { background: #2563eb; }
        .twoelve-aba[data-action="mensagens"]  { background: #16a34a; }
        .twoelve-aba[data-action="suporte"]    { background: #f97316; }
        .twoelve-aba[data-action="visita"]     { background: #dc2626; }
        .twoelve-aba[data-action="encaminhar"] { background: #7c3aed; }
        .twoelve-aba[data-action="config"]     { background: #64748b; }
        /* com a janela aberta, só a aba clicada fica visível (outras somem)
           e o container arrasta para a esquerda até a borda da janela de 700px */
        body.twoelve-lateral.twoelve-painel-aberto .twoelve-aba {
            display: none;
        }
        body.twoelve-lateral.twoelve-painel-aberto .twoelve-aba.twoelve-aba-ativa {
            display: flex;
        }
        body.twoelve-lateral.twoelve-painel-aberto .twoelve-abas {
            right: calc(700px + 12px); /* borda esquerda da janela + folga */
        }
        body.twoelve-lateral .twoelve-pin {
            display: none;
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(wrapper);

    // --- ABAS LATERAIS (modo Lateral): fileira de abas coloridas, uma abaixo da outra ---
    const abas = document.createElement('div');
    abas.className = 'twoelve-abas';
    abas.innerHTML = `
        <button class="twoelve-aba" data-action="utils"><span class="twoelve-aba-seta"></span></button>
        <button class="twoelve-aba" data-action="mensagens"><span class="twoelve-aba-seta"></span></button>
        <button class="twoelve-aba" data-action="suporte"><span class="twoelve-aba-seta"></span></button>
        <button class="twoelve-aba" data-action="visita"><span class="twoelve-aba-seta"></span></button>
        <button class="twoelve-aba" data-action="encaminhar"><span class="twoelve-aba-seta"></span></button>
        <button class="twoelve-aba" data-action="config"><span class="twoelve-aba-seta"></span></button>
    `;
    document.body.appendChild(abas);

    // --- POSIÇÃO HORIZONTAL SALVA (arrastar pelo handle) ---
    chrome.storage.local.get(['twoelveToolbarState'], (res) => {
        const st = res.twoelveToolbarState || {};
        if (st.left != null) {
            wrapper.style.left = st.left + 'px';
            wrapper.style.transform = 'none';
        }
        if (st.pinado === true) {
            pinado = true;
            wrapper.classList.add('twoelve-pinned');
            pinBtn && pinBtn.classList.add('ativo');
        }
    });

    // --- BOTÃO FECHAR (dentro da barra, opcional) ---
    // Removido: com o comportamento hover não é mais necessário.
    // A barra recolhe sozinha ao tirar o mouse.

    // --- MENSAGENS DO BACKGROUND (manter compatibilidade) ---
    chrome.runtime && chrome.runtime.onMessage && chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        try {
            if (message && message.action === 'twoelve-show-toolbar') {
                wrapper.classList.add('twoelve-pinned');
                sendResponse && sendResponse({ ok: true });
            }
        } catch (e) {}
    });

    // --- BOTÃO PIN ---
    let pinado = false;
    const pinBtn = div.querySelector('[data-action="pin"]');

    pinBtn.addEventListener('click', () => {
        pinado = !pinado;
        if (pinado) {
            wrapper.classList.add('twoelve-pinned');
            pinBtn.classList.add('ativo');
            pinBtn.title = 'Desafixar barra';
        } else {
            wrapper.classList.remove('twoelve-pinned');
            pinBtn.classList.remove('ativo');
            pinBtn.title = 'Fixar barra';
        }
        // salvar estado do pin
        try {
            const rect = wrapper.getBoundingClientRect();
            chrome.storage.local.set({ twoelveToolbarState: { left: rect.left + rect.width / 2, pinado } });
        } catch (e) {}
    });

    // --- ARRASTAR PELO HANDLE (horizontal apenas) ---
    (function makeDraggable(wrapEl, handleEl) {
        let isDown = false;
        let startX = 0, startLeft = 0;

        handleEl.addEventListener('mousedown', (e) => {
            isDown = true;
            // pega o left atual do wrapper (já é o centro, pois usamos left + translateX ou left direto)
            const currentLeft = parseFloat(wrapEl.style.left) || (window.innerWidth / 2);
            startLeft = currentLeft;
            startX = e.clientX;
            wrapEl.style.transform = 'none';
            wrapEl.style.left = currentLeft + 'px';
            e.preventDefault();
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            const nx = startLeft + (e.clientX - startX);
            wrapEl.style.left = nx + 'px';
        });

        window.addEventListener('mouseup', () => {
            if (!isDown) return;
            isDown = false;
            try {
                const left = parseFloat(wrapEl.style.left);
                chrome.storage.local.set({ twoelveToolbarState: { left } });
            } catch (e) {}
        });
    })(wrapper, handle);

    // --- EMOTES ---
    async function aplicarConfigEmotes() {
        const result = await chrome.storage.local.get(['twoelveConfig']);
        const config = result.twoelveConfig;
        const usarEmotes = config?.usarEmotes !== false;
        const textosOriginais = {
            'Utils': '🛠️ Utils',
            'Mensagens': '💬 Mensagens',
            'Suporte': '✅ Suporte',
            'Visita': '🚗 Visita',
            'Encaminhar': '📤 Encaminhar'
        };
        document.querySelectorAll('.twoelve-btn').forEach(btn => {
            const textoLimpo = btn.textContent.replace(/[^\w\s]/g, '').trim();
            if (textosOriginais[textoLimpo]) {
                btn.textContent = usarEmotes ? textosOriginais[textoLimpo] : textoLimpo;
            }
        });
    }

    // ==============================================
    // LAYOUT DA TOOLBAR (Superior / Lateral)
    // ==============================================
    function aplicarLayoutToolbar(layout) {
        document.body.classList.toggle('twoelve-lateral', layout === 'lateral');
    }

    async function aplicarConfigToolbarAtual() {
        try {
            const result = await chrome.storage.local.get(['twoelveConfig']);
            const config = (result && result.twoelveConfig) || {};
            aplicarLayoutToolbar(config.toolbarLayout);
        } catch (e) {}
    }

    // reaplica na hora quando a Configurações mudar o layout
    chrome.runtime && chrome.runtime.onMessage && chrome.runtime.onMessage.addListener((message) => {
        try {
            if (message && message.action === 'twoelve-config-changed') {
                aplicarConfigToolbarAtual();
            }
        } catch (e) {}
    });

    aplicarConfigToolbarAtual();

    // ==============================================
    // GERENCIADOR DE MODAIS - TOGGLE CORRETO
    // ==============================================
    let modalAberto = null;
    let modalAbertoAcao = null;

    function marcarAbaAtiva(acao) {
        let corAba = null;
        document.querySelectorAll('.twoelve-wrapper [data-action], .twoelve-abas [data-action]').forEach((b) => {
            const ativa = acao ? b.getAttribute('data-action') === acao : false;
            b.classList.toggle('twoelve-aba-ativa', ativa);
            if (ativa && b.classList.contains('twoelve-aba')) {
                corAba = getComputedStyle(b).backgroundColor;
            }
        });
        // propaga a cor da aba para a bordinha do painel
        if (corAba) {
            document.documentElement.style.setProperty('--twoelve-aba-cor', corAba);
        }
    }

    async function gerenciarModal(funcaoAbrir, acao) {
        if (modalAberto && modalAbertoAcao === acao) {
            // mesma aba: fecha (toggle)
            modalAberto.fechar();
            modalAberto = null;
            modalAbertoAcao = null;
            marcarAbaAtiva(null);
            return;
        }
        if (modalAberto) {
            // trocou de aba: fecha a atual e abre a nova
            modalAberto.fechar();
            modalAberto = null;
            modalAbertoAcao = null;
        }
        await funcaoAbrir();
        if (window._ultimoModalAberto) {
            modalAberto = window._ultimoModalAberto;
            modalAbertoAcao = acao || null;
            const callbackOriginal = modalAberto.onFechar;
            modalAberto.onFechar = () => {
                modalAberto = null;
                modalAbertoAcao = null;
                marcarAbaAtiva(null);
                if (callbackOriginal) callbackOriginal();
            };
            marcarAbaAtiva(acao || null);
        }
    }

    // ==============================================
    // BOTÕES
    // ==============================================
    const configBtn = document.querySelector('[data-action="config"]');
    if (configBtn) {
        configBtn.addEventListener('click', () => {
            // Abre a página de configurações em uma nova aba da extensão
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                chrome.runtime.sendMessage({ action: 'twoelve-open-config' }, () => {});
            } else {
                console.error('chrome.runtime indisponível');
                alert('Não foi possível abrir as configurações.');
            }
        });
    }

    const visitaBtn = document.querySelector('[data-action="visita"]');
    if (visitaBtn) {
        visitaBtn.addEventListener('click', () => {
            if (typeof window.abrirModalVisitas === 'function') {
                gerenciarModal(() => window.abrirModalVisitas(), 'visita');
            } else {
                console.error('Função abrirModalVisitas não encontrada');
                alert('Módulo de Visitas não carregado. Adicione visit.js no manifest.json');
            }
        });
    }

    const mensagensBtn = document.querySelector('[data-action="mensagens"]');
    if (mensagensBtn) {
        mensagensBtn.addEventListener('click', () => {
            if (typeof window.abrirModalMensagens === 'function') {
                gerenciarModal(() => window.abrirModalMensagens(), 'mensagens');
            } else {
                console.error('Função abrirModalMensagens não encontrada');
                alert('Módulo de Mensagens não carregado. Adicione messages.js no manifest.json');
            }
        });
    }

    const encaminharBtn = document.querySelector('[data-action="encaminhar"]');
    if (encaminharBtn) {
        encaminharBtn.addEventListener('click', () => {
            if (typeof window.abrirModalEncaminhar === 'function') {
                gerenciarModal(() => window.abrirModalEncaminhar(), 'encaminhar');
            } else {
                console.error('Função abrirModalEncaminhar não encontrada');
                alert('Módulo de Encaminhamentos não carregado. Adicione forward.js no manifest.json');
            }
        });
    }

    const utilsBtn = document.querySelector('[data-action="utils"]');
    if (utilsBtn) {
        utilsBtn.addEventListener('click', () => {
            if (typeof window.abrirModalUtils === 'function') {
                gerenciarModal(() => window.abrirModalUtils(), 'utils');
            } else {
                console.error('Função abrirModalUtils não encontrada');
                alert('Módulo de Utilitários não carregado. Adicione utils.js no manifest.json');
            }
        });
    }

    const suporteBtn = document.querySelector('[data-action="suporte"]');
    if (suporteBtn) {
        suporteBtn.addEventListener('click', () => {
            if (typeof window.abrirModalSuporte === 'function') {
                gerenciarModal(() => window.abrirModalSuporte(), 'suporte');
            } else {
                console.error('Função abrirModalSuporte não encontrada');
                alert('Módulo de Suporte não carregado. Adicione content.js no manifest.json');
            }
        });
    }

    // ==============================================
    // ABAS LATERAIS (modo Lateral): clicar em uma aba
    // abre o painel ao lado com os botões do modal
    // ==============================================
    const acoesAbas = {
        utils: () => window.abrirModalUtils,
        mensagens: () => window.abrirModalMensagens,
        suporte: () => window.abrirModalSuporte,
        visita: () => window.abrirModalVisitas,
        encaminhar: () => window.abrirModalEncaminhar
    };
    document.querySelectorAll('.twoelve-aba').forEach((aba) => {
        aba.addEventListener('click', () => {
            const acao = aba.getAttribute('data-action');
            if (acao === 'config') {
                if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                    chrome.runtime.sendMessage({ action: 'twoelve-open-config' }, () => {});
                }
                return;
            }
            const abridor = acoesAbas[acao] ? acoesAbas[acao]() : null;
            if (typeof abridor === 'function') {
                gerenciarModal(() => abridor(), acao);
            } else {
                console.error('Função do modal não encontrada para a aba ' + acao);
                alert('Módulo não carregado. Verifique o manifest.json.');
            }
        });
    });

    aplicarConfigEmotes();

    console.log('✅ Toolbar recolhível criada!');
    console.log('📌 Passe o mouse na linha preta no topo para expandir.');
})();