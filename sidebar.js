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

        /* ===== MODO LATERAL: abinhas na lateral (uma por botão) ===== */
        body.twoelve-lateral .twoelve-wrapper {
            top: 50%;
            left: auto;
            right: 0;
            transform: translateY(-50%);
            align-items: flex-end;
        }
        body.twoelve-lateral .twoelve-handle {
            display: none;
        }
        body.twoelve-lateral .twoelve-wrapper:hover .twoelve-sidebar,
        body.twoelve-lateral .twoelve-sidebar {
            flex-direction: column;
            max-height: none;
            overflow: visible;
            opacity: 1;
            pointer-events: auto;
            padding: 10px;
            border-radius: 6px 0 0 6px;
            box-shadow: -4px 4px 0px #000000;
            transition: none;
        }
        body.twoelve-lateral .twoelve-btn,
        body.twoelve-lateral .twoelve-config {
            width: 140px;
            padding: 8px 12px;
            text-align: center;
        }
        body.twoelve-lateral .twoelve-pin {
            display: none;
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(wrapper);

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

    async function gerenciarModal(funcaoAbrir) {
        if (modalAberto) {
            modalAberto.fechar();
            modalAberto = null;
            return;
        }
        await funcaoAbrir();
        if (window._ultimoModalAberto) {
            modalAberto = window._ultimoModalAberto;
            const callbackOriginal = modalAberto.onFechar;
            modalAberto.onFechar = () => {
                modalAberto = null;
                if (callbackOriginal) callbackOriginal();
            };
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
                gerenciarModal(() => window.abrirModalVisitas());
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
                gerenciarModal(() => window.abrirModalMensagens());
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
                gerenciarModal(() => window.abrirModalEncaminhar());
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
                gerenciarModal(() => window.abrirModalUtils());
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
                gerenciarModal(() => window.abrirModalSuporte());
            } else {
                console.error('Função abrirModalSuporte não encontrada');
                alert('Módulo de Suporte não carregado. Adicione content.js no manifest.json');
            }
        });
    }

    aplicarConfigEmotes();

    console.log('✅ Toolbar recolhível criada!');
    console.log('📌 Passe o mouse na linha preta no topo para expandir.');
})();