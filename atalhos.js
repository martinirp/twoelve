// ==============================================
// ATALHOS.JS - Atalhos de teclado personalizáveis
// ----------------------------------------------
// Roda em 2 lugares:
//   1) como content script em <all_urls> — executa os atalhos
//   2) dentro da página de configurações (config.html) via <script src>
//
// Os atalhos ficam em chrome.storage.local → "twoelveAtalhos":
//   { ativo: true, lista: [ { id, nome, alvo, tecla } ] }
//
// "alvo" é sempre "origem:id":
//   modulo:utils | modulo:mensagens | modulo:suporte |
//   modulo:visita | modulo:encaminhar | modulo:config
//   suporte:<id>     (customButtons)
//   mensagem:<id>    (whitePanelMessages)
//   visita:<id>      (customVisits)
//   encaminhar:<id>  (forwardButtons)
// ==============================================
(() => {
    'use strict';

    if (window.__twoelveAtalhos__) return;
    window.__twoelveAtalhos__ = true;

    const CHAVE_STORAGE = 'twoelveAtalhos';

    // ---------- módulos da toolbar (abrem um modal) ----------
    const MODULOS = [
        { acao: 'utils', rotulo: '🛠️ Abrir Utils' },
        { acao: 'mensagens', rotulo: '💬 Abrir Mensagens Rápidas' },
        { acao: 'suporte', rotulo: '✅ Abrir Suporte' },
        { acao: 'visita', rotulo: '🚗 Abrir Visitas' },
        { acao: 'encaminhar', rotulo: '📤 Abrir Encaminhar' },
        { acao: 'config', rotulo: '⚙️ Abrir Configurações' }
    ];

    // ---------- itens salvos no storage que viram atalho ----------
    const FONTES = [
        { tipo: 'suporte', rotulo: '✅ Suporte', storage: 'customButtons', campo: 'nome', acao: 'suporte', global: 'abrirModalSuporte' },
        { tipo: 'mensagem', rotulo: '💬 Mensagens Rápidas', storage: 'whitePanelMessages', campo: 'name', acao: 'mensagens', global: 'abrirModalMensagens' },
        { tipo: 'visita', rotulo: '🚗 Visitas', storage: 'customVisits', campo: 'name', acao: 'visita', global: 'abrirModalVisitas' },
        { tipo: 'encaminhar', rotulo: '📤 Encaminhamentos', storage: 'forwardButtons', campo: 'text', acao: 'encaminhar', global: 'abrirModalEncaminhar' }
    ];

    // ---------- botões do módulo Utils (vivos no código, não no storage) ----------
    // "abre" = precisa abrir um modal dentro do Utils antes de achar o botão.
    const UTILS = [
        { chave: 'login-router', rotulo: '🔐 Login Router' },
        { chave: 'login-alternativo', rotulo: '🔑 Login (Alternativo)' },
        { chave: 'huawei-manager', rotulo: '🌐 Huawei Manager' },
        { chave: 'endereco', rotulo: '📍 Editar Endereço' },
        { chave: 'huawei-login', rotulo: '🔑 Login Huawei', abre: '🌐 Huawei Manager' },
        { chave: 'huawei-ler-tudo', rotulo: '📥 Ler Tudo', abre: '🌐 Huawei Manager' },
        { chave: 'ler-wifi', rotulo: '📥 Ler Wi-Fi', abre: '🌐 Huawei Manager' },
        { chave: 'salvar-wifi-24', rotulo: '💾 Salvar 2.4', abre: '🌐 Huawei Manager' },
        { chave: 'salvar-wifi-5', rotulo: '💾 Salvar 5', abre: '🌐 Huawei Manager' },
        { chave: 'ler-pppoe', rotulo: '📥 Ler PPPoE', abre: '🌐 Huawei Manager' },
        { chave: 'salvar-pppoe', rotulo: '💾 Salvar', abre: '🌐 Huawei Manager' },
        { chave: 'ler-lan', rotulo: '📥 Ler LAN', abre: '🌐 Huawei Manager' },
        { chave: 'salvar-lan', rotulo: '💾 Salvar LAN', abre: '🌐 Huawei Manager' }
    ];

    // ---------- itens padrão do programa (aparecem quando a lista salva está vazia) ----------
    // espelha os getDefaults() de cada módulo: os ids são os mesmos, então o atalho
    // continua funcionando mesmo depois de o usuário salvar a lista no storage.
    const PADROES = {
        encaminhar: [
            { id: 'fwd-1', text: 'Enc. Suporte' },
            { id: 'fwd-2', text: 'Enc. Faturamento' },
            { id: 'fwd-3', text: 'Enc. Vendas' }
        ]
    };

    /** Itens de uma fonte: os salvos, ou os padrão do programa se ainda não houver nenhum. */
    async function itensDaFonte(fonte) {
        let salvos = [];
        try {
            const r = await chrome.storage.local.get([fonte.storage]);
            salvos = r[fonte.storage] || [];
        } catch (e) {}
        if (salvos.length) return { itens: salvos, doStorage: true };
        return { itens: (PADROES[fonte.tipo] || []), doStorage: false };
    }

    const NOMES_TECLA = {
        ' ': 'Espaço',
        Escape: 'Esc',
        Enter: 'Enter',
        Tab: 'Tab',
        Backspace: 'Backspace',
        Delete: 'Del',
        Insert: 'Ins',
        Home: 'Home',
        End: 'End',
        PageUp: 'PgUp',
        PageDown: 'PgDn',
        ArrowUp: '↑',
        ArrowDown: '↓',
        ArrowLeft: '←',
        ArrowRight: '→',
        CapsLock: 'Caps',
        NumLock: 'Num',
        ScrollLock: 'Scroll',
        PrintScreen: 'Print'
    };

    const ROTULOS_MOD = { Ctrl: 'Ctrl', Alt: 'Alt', Shift: 'Shift', Meta: 'Win' };

    // teclas que o Chrome/Firefox já usam — arrives nem sempre na página, então só avisamos
    const RESERVADAS = [
        'Ctrl+N', 'Ctrl+T', 'Ctrl+W', 'Ctrl+Q', 'Ctrl+Shift+N', 'Ctrl+Shift+T', 'Ctrl+Shift+W',
        'Ctrl+Tab', 'Ctrl+Shift+Tab', 'Ctrl+L', 'Ctrl+D', 'Ctrl+J', 'Ctrl+H', 'Ctrl+P', 'Ctrl+F',
        'Ctrl+R', 'Ctrl+Shift+R', 'Ctrl+Shift+B', 'Ctrl+Shift+C', 'Ctrl+Shift+I', 'Ctrl+Shift+J',
        'Ctrl+Shift+Q', 'Ctrl+Shift+Delete', 'Alt+Left', 'Alt+Right', 'Alt+Home', 'Alt+End',
        'Alt+F4', 'F5', 'F11', 'F12'
    ];

    const SO_MODIFICADORES = ['Control', 'Alt', 'Shift', 'Meta', 'AltGraph', 'CapsLock', 'NumLock', 'ScrollLock', 'Fn', 'OS', 'ContextMenu'];

    let estado = { ativo: true, lista: [] };
    let carregado = false;

    // ==============================================
    // TECLAS
    // ==============================================
    /** Converte um KeyboardEvent em atalho canônico ("Ctrl+Shift+M") ou null. */
    function teclaDeEvento(e) {
        if (!e) return null;
        if (SO_MODIFICADORES.includes(e.key)) return null;

        let tecla = null;
        const code = e.code || '';
        if (/^Key[A-Z]$/.test(code)) tecla = code.slice(3);          // mais confiável que e.key (AltGr)
        else if (/^Digit[0-9]$/.test(code)) tecla = code.slice(5);
        else if (/^F([1-9]|1[0-9]|2[0-4])$/.test(code)) tecla = code;
        else if (NOMES_TECLA[e.key]) tecla = NOMES_TECLA[e.key];
        else if (e.key && e.key.length === 1) tecla = e.key.toUpperCase();
        else return null;

        const modificadores = [];
        if (e.ctrlKey) modificadores.push('Ctrl');
        if (e.altKey) modificadores.push('Alt');
        if (e.shiftKey) modificadores.push('Shift');
        if (e.metaKey) modificadores.push('Meta');

        // sem Ctrl/Alt/Win só aceita tecla de função (F1..F24), pra não "roubar" a digitação
        if (!e.ctrlKey && !e.altKey && !e.metaKey && !/^F\d{1,2}$/.test(tecla)) return null;

        return modificadores.concat(tecla).join('+');
    }

    /** "Ctrl+Shift+M" → "Ctrl + Shift + M" */
    function formatarTecla(t) {
        if (!t) return '—';
        return String(t).split('+').map((p) => ROTULOS_MOD[p] || p).join(' + ');
    }

    /** Essa combinação é usada pelo navegador? (só aviso — não bloqueia) */
    function reservada(t) {
        return !!t && RESERVADAS.indexOf(t) !== -1;
    }

    /**
     * Descreve o que está sendo pressionado, para dar feedback ao vivo na gravação.
     * → { texto, tecla, valido, motivo }
     *   motivo: '' | 'esperando' | 'sem_modificador'
     */
    function descreverEvento(e) {
        const mods = [];
        if (e.ctrlKey) mods.push('Ctrl');
        if (e.altKey) mods.push('Alt');
        if (e.shiftKey) mods.push('Shift');
        if (e.metaKey) mods.push('Win');

        const t = teclaDeEvento(e);
        if (t) {
            const p = t.split('+');
            const tecla = p.pop();
            return { texto: formatarTecla(mods.concat(tecla).join('+')), tecla: t, valido: true, motivo: '' };
        }

        if (!e.key || SO_MODIFICADORES.indexOf(e.key) !== -1) {
            return {
                texto: mods.length ? mods.join(' + ') + ' + …' : 'Aperte a combinação…',
                tecla: null, valido: false, motivo: 'esperando'
            };
        }

        const nome = NOMES_TECLA[e.key] || (e.key.length === 1 ? e.key.toUpperCase() : e.key);
        const texto = mods.length ? formatarTecla(mods.concat(nome).join('+')) : nome;
        return { texto, tecla: null, valido: false, motivo: 'sem_modificador' };
    }

    // ==============================================
    // STORAGE
    // ==============================================
    async function carregar() {
        try {
            const r = await chrome.storage.local.get([CHAVE_STORAGE]);
            const dados = r && r[CHAVE_STORAGE] ? r[CHAVE_STORAGE] : {};
            estado = {
                ativo: dados.ativo !== false,
                lista: Array.isArray(dados.lista) ? dados.lista : []
            };
        } catch (e) {
            estado = { ativo: true, lista: [] };
        }
        carregado = true;
        return estado;
    }

    async function garantirCarregado() {
        if (!carregado) await carregar();
        return estado;
    }

    async function salvar() {
        try {
            await chrome.storage.local.set({ [CHAVE_STORAGE]: estado });
        } catch (e) {
            console.error('[TwoElve] Erro ao salvar atalhos:', e);
        }
    }

    // ---------- CRUD ----------
    async function listar() {
        await garantirCarregado();
        return estado.lista.slice();
    }

    async function adicionar({ nome, alvo, tecla }) {
        await garantirCarregado();
        const item = { id: 'at-' + Date.now(), nome: String(nome || '').trim(), alvo, tecla };
        estado.lista.push(item);
        await salvar();
        return item;
    }

    async function atualizar(id, patch) {
        await garantirCarregado();
        const i = estado.lista.findIndex((a) => a.id === id);
        if (i === -1) return null;
        estado.lista[i] = { ...estado.lista[i], ...patch, id };
        await salvar();
        return estado.lista[i];
    }

    async function remover(id) {
        await garantirCarregado();
        estado.lista = estado.lista.filter((a) => a.id !== id);
        await salvar();
    }

    async function definirAtivo(v) {
        await garantirCarregado();
        estado.ativo = !!v;
        await salvar();
    }

    /** Devolve o atalho que já usa essa tecla (para bloquear duplicata). */
    async function conflito(tecla, ignorarId) {
        await garantirCarregado();
        return estado.lista.find((a) => a.tecla === tecla && a.id !== ignorarId) || null;
    }

    // ---------- catálogo de alvos (para o <select> da config) ----------
    async function listarAlvos() {
        const grupos = [{
            rotulo: 'Módulos da toolbar',
            itens: MODULOS.map((m) => ({ valor: 'modulo:' + m.acao, rotulo: m.rotulo }))
        }];

        for (const f of FONTES) {
            const { itens, doStorage } = await itensDaFonte(f);
            grupos.push({
                rotulo: f.rotulo,
                itens: itens.map((i) => ({
                    valor: f.tipo + ':' + i.id,
                    rotulo: '↳ ' + (i[f.campo] || '(sem nome)') + (doStorage ? '' : ' (padrão)')
                }))
            });
        }

        grupos.push({
            rotulo: '🛠️ Utilitários',
            itens: UTILS.filter((u) => !u.abre).map((u) => ({ valor: 'util:' + u.chave, rotulo: u.rotulo }))
        });
        grupos.push({
            rotulo: '🌐 Huawei Manager',
            itens: UTILS.filter((u) => u.abre).map((u) => ({ valor: 'util:' + u.chave, rotulo: u.rotulo }))
        });

        return grupos;
    }

    /** Texto legível do alvo ("✅ Suporte · Copiar senha"). */
    async function rotuloAlvo(alvo) {
        if (!alvo) return '(sem alvo)';
        if (String(alvo).startsWith('modulo:')) {
            const acao = String(alvo).slice(7);
            const m = MODULOS.find((x) => x.acao === acao);
            return m ? m.rotulo : '(módulo desconhecido)';
        }
        const partes = String(alvo).split(':');
        if (partes[0] === 'util') {
            const u = UTILS.find((x) => x.chave === partes[1]);
            return u ? '🛠️ Utilitários · ' + u.rotulo : '(botão desconhecido)';
        }
        const fonte = FONTES.find((f) => f.tipo === partes[0]);
        if (!fonte) return '(alvo desconhecido)';
        try {
            const { itens, doStorage } = await itensDaFonte(fonte);
            const item = itens.find((i) => String(i.id) === String(partes[1]));
            if (!item) return '(item removido)';
            return fonte.rotulo + ' · ' + (item[fonte.campo] || '(sem nome)') + (doStorage ? '' : ' (padrão)');
        } catch (e) {
            return '(erro ao ler)';
        }
    }

    // ==============================================
    // EXECUÇÃO
    // ==============================================
    const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

    /** Clica no botão da toolbar ( reaproveita o gerenciador de modais da sidebar ). */
    function abrirModulo(acao) {
        const btn = document.querySelector('.twoelve-btn[data-action="' + acao + '"], .twoelve-aba[data-action="' + acao + '"]');
        if (btn) {
            btn.click();
            return true;
        }
        const mapa = {
            utils: 'abrirModalUtils',
            mensagens: 'abrirModalMensagens',
            suporte: 'abrirModalSuporte',
            visita: 'abrirModalVisitas',
            encaminhar: 'abrirModalEncaminhar'
        };
        const fn = mapa[acao] ? window[mapa[acao]] : null;
        if (typeof fn === 'function') {
            try { fn(); return true; } catch (e) { /* segue para o aviso */ }
        }
        return false;
    }

    /** Procura (e clica) um botão do modal pelo texto exato. */
    async function clicarItem(rotulo, limiteMs) {
        const fim = Date.now() + limiteMs;
        while (Date.now() < fim) {
            const botoes = document.querySelectorAll('.twoelve-modal-container button');
            for (let i = 0; i < botoes.length; i++) {
                if ((botoes[i].textContent || '').trim() === rotulo) {
                    botoes[i].click();
                    return true;
                }
            }
            await dormir(120);
        }
        return false;
    }

    /** Executa um botão do Utils (abre o modal do Utils e o modal interno, se precisar). */
    async function executarUtil(chave) {
        const item = UTILS.find((u) => u.chave === chave);
        if (!item) return;

        // o modal pode já estar aberto
        if (await clicarItem(item.rotulo, 250)) return;

        if (!abrirModulo('utils')) {
            aviso('Módulo indisponível nesta página.');
            return;
        }
        if (item.abre && !(await clicarItem(item.abre, 2500))) {
            aviso('Não encontrei "' + item.abre + '" no Utils.');
            return;
        }
        if (!(await clicarItem(item.rotulo, 2500))) {
            aviso('Não encontrei "' + item.rotulo + '" no Utils.');
        }
    }

    async function executar(atalho) {
        if (!atalho || !atalho.alvo) return;

        // --- alvo = módulo da toolbar ---
        if (String(atalho.alvo).startsWith('modulo:')) {
            const acao = String(atalho.alvo).slice(7);
            if (acao === 'config') {
                try { chrome.runtime.sendMessage({ action: 'twoelve-open-config' }, () => {}); } catch (e) {}
                return;
            }
            if (!abrirModulo(acao)) aviso('Módulo indisponível nesta página.');
            return;
        }

        const partes = String(atalho.alvo).split(':');

        // --- alvo = botão do Utils ---
        if (partes[0] === 'util') {
            await executarUtil(partes[1]);
            return;
        }

        // --- alvo = item salvo no storage ---
        const fonte = FONTES.find((f) => f.tipo === partes[0]);
        if (!fonte) return;

        const moduloDisponivel =
            typeof window[fonte.global] === 'function' ||
            !!document.querySelector('.twoelve-btn[data-action="' + fonte.acao + '"]');
        if (!moduloDisponivel) {
            aviso('Esse atalho só funciona no sistema de atendimento.');
            return;
        }

        let rotulo = '';
        try {
            const { itens } = await itensDaFonte(fonte);
            const item = itens.find((i) => String(i.id) === String(partes[1]));
            if (item) rotulo = String(item[fonte.campo] || '').trim();
        } catch (e) {}

        if (!rotulo) {
            aviso('Atalho "' + (atalho.nome || '') + '" está sem alvo (o item foi excluído).');
            return;
        }

        // o modal pode já estar aberto (não reabre/fecha por accident)
        if (await clicarItem(rotulo, 250)) return;

        if (!abrirModulo(fonte.acao)) {
            aviso('Módulo indisponível nesta página.');
            return;
        }
        if (!(await clicarItem(rotulo, 2500))) {
            aviso('Não encontrei "' + rotulo + '" na lista do módulo.');
        }
    }

    // ---------- aviso rápido na página ----------
    let toastTimer = null;
    function aviso(msg) {
        try {
            let t = document.getElementById('twoelve-atalho-toast');
            if (!t) {
                t = document.createElement('div');
                t.id = 'twoelve-atalho-toast';
                t.style.cssText = [
                    'position: fixed',
                    'bottom: 18px',
                    'left: 50%',
                    'transform: translateX(-50%)',
                    'z-index: 2147483647',
                    'background: #111827',
                    'color: #fff',
                    'font: 600 13px/1.4 Inter, "Segoe UI", Arial, sans-serif',
                    'padding: 10px 16px',
                    'border-radius: 6px',
                    'box-shadow: 0 6px 20px rgba(0,0,0,.35)',
                    'max-width: 80vw',
                    'display: none'
                ].join(';') + ';';
                document.body.appendChild(t);
            }
            t.textContent = msg;
            t.style.display = 'block';
            clearTimeout(toastTimer);
            toastTimer = setTimeout(() => { t.style.display = 'none'; }, 3200);
        } catch (e) {}
    }

    // ==============================================
    // ESCUTA DO TECLADO (só nas páginas, não na config)
    // ==============================================
    function iniciarEscuta() {
        // window + capture = o primeiro lugar onde o evento aparece (a página não consegue "engolir")
        window.addEventListener('keydown', (e) => {
            if (!estado.ativo) return;
            const t = teclaDeEvento(e);
            if (!t) return;
            const atalho = estado.lista.find((a) => a.tecla === t);
            if (!atalho) return;
            e.preventDefault();
            e.stopPropagation();
            executar(atalho);
        }, true);
    }

    // ==============================================
    // INIT
    // ==============================================
    try {
        if (chrome.storage && chrome.storage.onChanged) {
            chrome.storage.onChanged.addListener((mudancas, area) => {
                if (area === 'local' && mudancas[CHAVE_STORAGE]) carregar();
            });
        }
    } catch (e) {}

    carregar().then(() => {
        // a página de configuração não executa atalhos (ela só edita)
        if (location.protocol !== 'chrome-extension:') iniciarEscuta();
    });

    window.TwoelveAtalhos = {
        CHAVE_STORAGE,
        carregar,
        listar,
        adicionar,
        atualizar,
        remover,
        definirAtivo,
        conflito,
        listarAlvos,
        rotuloAlvo,
        teclaDeEvento,
        formatarTecla,
        descreverEvento,
        reservada,
        executar,
        aviso
    };
})();
