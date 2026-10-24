// ==============================================
// UTILS.JS - TwoElve v6.0
// Utilitários (Huawei, Endereço, Login, etc.)
// ==============================================

(async function() {
    if (window.TwoelvePaginas) {
        await window.TwoelvePaginas.pronto;
        if (!window.TwoelvePaginas.autorizada()) return;
    }
    // ==============================================
    // 0. DESBLOQUEAR COLA / CLIQUE DIREITO (todas as páginas)
    // ==============================================
    (function desbloquearInteracoes() {
        if (window.TwoelvePagina && window.TwoelvePagina.desativada()) {
            try { console.log('[TwoElve] ⏸️ Página desativada (' + window.TwoelvePagina.host() + ') — extensão inativa aqui. Colar/clique direito normais.'); } catch (e) {}
            return;
        }
        const DENTRO_DA_UI = '.twoelve-modal-container, .twoelve-wrapper, .twoelve-abas';
        const bloquear = (e) => {
            e.stopImmediatePropagation();
            e.stopPropagation();
        };
        const ehDaUi = (e) => {
            const alvo = e.target;
            if (!alvo || !alvo.closest) return false;
            try { return !!alvo.closest(DENTRO_DA_UI); } catch (err) { return false; }
        };

        let colagemAtiva = null;
        let direitoAtivo = null;

        const CHAVE_PAGINAS_DESATIVADAS = 'paginasDesativadas';
        let paginasDesativadasLista = [];

        const hostPaginaAtual = () => {
            try { return String(location.hostname || '').toLowerCase(); } catch (e) { return ''; }
        };
        const paginaDesativada = () => {
            const h = hostPaginaAtual();
            return !!h && paginasDesativadasLista.indexOf(h) >= 0;
        };
        const carregarPaginasDesativadas = (res) => {
            paginasDesativadasLista = Array.isArray(res[CHAVE_PAGINAS_DESATIVADAS]) ? res[CHAVE_PAGINAS_DESATIVADAS] : [];
        };
        try {
            const pd = chrome.storage.local.get([CHAVE_PAGINAS_DESATIVADAS]);
            if (pd && pd.then) pd.then(carregarPaginasDesativadas); else chrome.storage.local.get([CHAVE_PAGINAS_DESATIVADAS], carregarPaginasDesativadas);
            chrome.storage.onChanged.addListener((mudancas, area) => {
                if (area !== 'local' || !mudancas[CHAVE_PAGINAS_DESATIVADAS]) return;
                paginasDesativadasLista = Array.isArray(mudancas[CHAVE_PAGINAS_DESATIVADAS].newValue) ? mudancas[CHAVE_PAGINAS_DESATIVADAS].newValue : [];
            });
        } catch (e) {}

        window.TwoelvePagina = {
            host: hostPaginaAtual,
            desativada: paginaDesativada,
            lista: () => paginasDesativadasLista.slice(),
            alternar: async () => {
                const h = hostPaginaAtual();
                if (!h) return false;
                const atual = paginasDesativadasLista.slice();
                const i = atual.indexOf(h);
                if (i >= 0) atual.splice(i, 1); else atual.push(h);
                paginasDesativadasLista = atual;
                try { await chrome.storage.local.set({ [CHAVE_PAGINAS_DESATIVADAS]: atual }); } catch (e) {}
                return i < 0;
            }
        };

        const CHAVE_LISTA = 'paginasSemBloqueioDireito';
        const hostDaPagina = () => {
            try { return String(location.hostname || '').toLowerCase(); } catch (e) { return ''; }
        };
        let direitoGlobal = true;
        let listaLivre = [];

        const paginaLiberada = () => {
            const h = hostDaPagina();
            return !!h && listaLivre.indexOf(h) >= 0;
        };
        const reaplicarDireito = () => {
            if (direitoGlobal && !paginaLiberada()) ligarDireito();
            else desligarDireito();
        };

        const ligarColagem = () => {
            if (colagemAtiva) return;
            colagemAtiva = [];
            ['paste', 'copy', 'cut', 'dragstart', 'selectstart'].forEach((ev) => {
                const fn = (e) => bloquear(e);
                colagemAtiva.push([ev, fn]);
                window.addEventListener(ev, fn, true);
            });
        };
        const desligarColagem = () => {
            if (!colagemAtiva) return;
            colagemAtiva.forEach(([ev, fn]) => window.removeEventListener(ev, fn, true));
            colagemAtiva = null;
        };
        const ligarDireito = () => {
            if (direitoAtivo) return;
            direitoAtivo = (e) => { if (!ehDaUi(e)) bloquear(e); };
            window.addEventListener('contextmenu', direitoAtivo, true);
        };
        const desligarDireito = () => {
            if (!direitoAtivo) return;
            window.removeEventListener('contextmenu', direitoAtivo, true);
            direitoAtivo = null;
        };

        ligarColagem();
        ligarDireito();
        try {
            const style = document.createElement('style');
            style.id = 'twoelve-unblock-styles';
            style.textContent = 'input, textarea, [contenteditable="true"] { -webkit-user-select: text !important; user-select: text !important; }';
            (document.head || document.documentElement).appendChild(style);
        } catch (e) {}

        const aplicar = (res) => {
            const colagemOn = res.desbloquearColagem !== false;
            direitoGlobal = res.desbloquearCliqueDireito !== false;
            if (Array.isArray(res[CHAVE_LISTA])) listaLivre = res[CHAVE_LISTA];
            if (colagemOn) ligarColagem(); else desligarColagem();
            reaplicarDireito();
            console.log(`[TwoElve] ✅ Desbloqueio ativo em todas as páginas — colar: ${colagemOn ? 'ON' : 'OFF'}, botão direito: ${direitoGlobal ? 'ON' : 'OFF'} (UI da extensão preservada).`);
            if (paginaLiberada()) console.log(`[TwoElve] 🖱️ Página liberada (${hostDaPagina()}) — usando o clique direito original do site.`);
        };
        const CHAVES = ['desbloquearColagem', 'desbloquearCliqueDireito', CHAVE_LISTA];
        const p = chrome.storage.local.get(CHAVES);
        if (p && p.then) { p.then(aplicar, aplicar); }
        else { chrome.storage.local.get(CHAVES, aplicar); }

        try {
            chrome.storage.onChanged.addListener((mudancas, area) => {
                if (area !== 'local') return;
                if (mudancas.desbloquearCliqueDireito) direitoGlobal = mudancas.desbloquearCliqueDireito.newValue !== false;
                if (mudancas[CHAVE_LISTA]) listaLivre = Array.isArray(mudancas[CHAVE_LISTA].newValue) ? mudancas[CHAVE_LISTA].newValue : [];
                reaplicarDireito();
            });
        } catch (e) {}

        window.TwoelveDireito = {
            chave: hostDaPagina,
            liberada: paginaLiberada,
            globalAtivo: () => direitoGlobal,
            lista: () => listaLivre.slice(),
            alternar: async () => {
                const h = hostDaPagina();
                if (!h) return false;
                const atual = listaLivre.slice();
                const i = atual.indexOf(h);
                if (i >= 0) atual.splice(i, 1); else atual.push(h);
                listaLivre = atual;
                try { await chrome.storage.local.set({ [CHAVE_LISTA]: atual }); } catch (e) {}
                reaplicarDireito();
                console.log(`[TwoElve] 🖱️ ${h}: clique direito ${i >= 0 ? 'do TwoElve' : 'original do site'}.`);
                return i < 0;
            }
        };
    })();

    // ==============================================
    // 1. VARIÁVEIS
    // ==============================================
    let modalAtivo = null;

    // ==============================================
    // 2. FUNÇÕES AUXILIARES (MANTIDAS)
    // ==============================================
    function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function fillField(inputField, value) {
        if (!inputField) return;
        try {
            inputField.focus();
            inputField.value = value;
            const eventOptions = { bubbles: true, cancelable: true };
            inputField.dispatchEvent(new KeyboardEvent('keydown', eventOptions));
            inputField.dispatchEvent(new KeyboardEvent('keypress', eventOptions));
            inputField.dispatchEvent(new Event('input', eventOptions));
            inputField.dispatchEvent(new Event('change', eventOptions));
            await wait(100);
            inputField.blur();
        } catch (error) {
            console.error('Erro ao preencher campo:', error);
        }
    }

    // ==============================================
    // 3. FUNÇÕES DE LOGIN (MANTIDAS)
    // ==============================================
    async function login() {
        console.log('Função login chamada');

        const huawey_descoberto_user = document.querySelector('#txt_Username');
        const huawey_descoberto_pass = document.querySelector('#txt_Password');
        const huawey_descoberto_login = document.querySelector('#button');

        if (huawey_descoberto_user && huawey_descoberto_pass) {
            console.log('Encontrou campos Huawei Descoberto');
            await fillField(huawey_descoberto_user, 'elonet');
            await fillField(huawey_descoberto_pass, 'elonet3005');
            huawey_descoberto_login.click();
            return;
        }

        const huaweiPasswordField = document.querySelector('#userpassword_ctrl');
        const huaweiLoginButton = document.querySelector('#loginbtn.loginbtn.common_button_long');

        if (huaweiPasswordField && huaweiLoginButton) {
            console.log('Encontrou campos Huawei');
            await fillField(huaweiPasswordField, 'elonet3005');
            huaweiLoginButton.click();
            return;
        }

        const fiberHomeUserField = document.querySelector('input#User[name="User"][type="text"]');
        const fiberHomePasswordField = document.querySelector('input#Passwd[name="Passwd"][type="password"]');
        const fiberHomeLoginButton = document.querySelector('input[type="submit"]');

        if (fiberHomeUserField && fiberHomePasswordField && fiberHomeLoginButton) {
            console.log('Encontrou campos FiberHome');
            await fillField(fiberHomeUserField, 'admin');
            await fillField(fiberHomePasswordField, 'admin');
            fiberHomeLoginButton.click();
            await wait(5000);
            const stillExists = document.querySelector('input#User[name="User"][type="text"]');
            if (stillExists) {
                await fillField(fiberHomeUserField, 'admin');
                await fillField(fiberHomePasswordField, 'admin');
                fiberHomeLoginButton.click();
            }
            return;
        }
        console.log('Nenhum formulário de login reconhecido');
    }

    async function checkLogin() {
        console.log('Função checkLogin chamada');

        const huaweiPasswordField = document.querySelector('#userpassword_ctrl');
        const huaweiLoginButton = document.querySelector('#loginbtn.loginbtn.common_button_long');

        if (huaweiPasswordField && huaweiLoginButton) {
            console.log('Encontrou campos Huawei');
            await fillField(huaweiPasswordField, 'elonet3005');
            huaweiLoginButton.click();
            return;
        }

        const fiberHomeUserField = document.querySelector('input#User[name="User"][type="text"]');
        const fiberHomePasswordField = document.querySelector('input#Passwd[name="Passwd"][type="password"]');
        const fiberHomeLoginButton = document.querySelector('input[type="submit"]');

        if (fiberHomeUserField && fiberHomePasswordField && fiberHomeLoginButton) {
            console.log('Encontrou campos FiberHome');
            await fillField(fiberHomeUserField, 'admin');
            await fillField(fiberHomePasswordField, 'elonet3005');
            fiberHomeLoginButton.click();
            await wait(5000);
            const stillExists = document.querySelector('input#User[name="User"][type="text"]');
            if (stillExists) {
                await fillField(fiberHomeUserField, 'admin');
                await fillField(fiberHomePasswordField, 'admin');
                fiberHomeLoginButton.click();
            }
            return;
        }
        console.log('Nenhum formulário de login reconhecido');
    }

    // ==============================================
    // 4. MODAL ENDEREÇO - Percorre a lista da página
    // ==============================================

    async function preencherCampoERP(selector, value) {
        if (!value) return;
        const el = document.querySelector(selector);
        if (!el) {
            console.error(`❌ Campo não encontrado: ${selector}`);
            return;
        }

        console.log(`✅ Campo encontrado: ${selector}. Inserindo valor: "${value}"`);
        el.focus();

        const valueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set ||
                            Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
        const prototype = Object.getPrototypeOf(el);
        const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;

        if (valueSetter && prototypeValueSetter && valueSetter !== prototypeValueSetter) {
            prototypeValueSetter.call(el, value);
        } else if (valueSetter) {
            valueSetter.call(el, value);
        } else {
            el.value = value;
        }

        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.blur();
        await wait(80);
    }

    function lerEnderecoLinha(row) {
        const cells = row.querySelectorAll('td');
        if (!cells || cells.length < 2) return '';
        return (cells[0]?.textContent || '').trim().toLowerCase();
    }

    function clicarLapisLinha(row) {
        const lapiz = row.querySelector('.btn-editar') || row.querySelector('i.icon-pencil, i.fa-pencil');
        if (lapiz) {
            const clicavel = lapiz.closest('a, button, [class*="btn-editar"]') || lapiz;
            console.log('Clicando no botão de editar da linha:', clicavel);
            clicavel.click();
            clicavel.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
            clicavel.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
            clicavel.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
            return true;
        }
        console.warn('Botão de editar não encontrado na linha:', row);
        return false;
    }

    function aguardarModalERP(maxMs = 5000) {
        return new Promise(resolve => {
            const check = () => {
                const modal = document.querySelector('#modalFormAddress');
                if (!modal) return null;
                const dialog = modal.closest('.ui-dialog');
                if (dialog && dialog.style.display !== 'none' && dialog.offsetParent !== null) {
                    return modal;
                }
                return null;
            };
            const found = check();
            if (found) return resolve(found);
            const obs = new MutationObserver(() => {
                const m = check();
                if (m) { obs.disconnect(); clearTimeout(t); resolve(m); }
            });
            obs.observe(document.body, { childList: true, subtree: true, attributes: true });
            const t = setTimeout(() => { obs.disconnect(); resolve(null); }, maxMs);
        });
    }

    function aguardarModalFechar(maxMs = 5000) {
        return new Promise(resolve => {
            const check = () => {
                const modal = document.querySelector('#modalFormAddress');
                if (!modal) return true;
                const dialog = modal.closest('.ui-dialog');
                if (!dialog || dialog.style.display === 'none' || dialog.offsetParent === null) {
                    return true;
                }
                return false;
            };
            if (check()) return resolve(true);
            const obs = new MutationObserver(() => {
                if (check()) { obs.disconnect(); resolve(true); }
            });
            obs.observe(document.body, { childList: true, subtree: true, attributes: true });
            setTimeout(() => { obs.disconnect(); resolve(false); }, maxMs);
        });
    }

        // Aplica cor visual em uma linha da tabela de endereços e suas células
        // Aplica cor visual na linha inteira (TR e todos os TDs) usando o data-id do ERP ou elemento direto
        // Gerenciador dinâmico de estilos para as linhas da tabela de endereços do ERP
    const estiloEnderecos = {
        styleEl: null,
        regras: {}, // mapa de id -> cor

        init() {
            let el = document.getElementById('twoelve-endereco-styles');
            if (!el) {
                el = document.createElement('style');
                el.id = 'twoelve-endereco-styles';
                document.head.appendChild(el);
            }
            this.styleEl = el;
            this.regras = {};
            this.render();
        },

        definirCor(id, cor) {
            if (!id || !cor) return;
            this.regras[id] = cor;
            this.render();

            // Aplica também via JavaScript nos elementos existentes no DOM
            const seletores = [
                `tr.line[data-id="${id}"]`,
                `tr.line[data-id="${id}"] td`,
                `tr[data-id="${id}"]`,
                `tr[data-id="${id}"] td`,
                `tr[data-twoelve-id="${id}"]`,
                `tr[data-twoelve-id="${id}"] td`
            ].join(', ');

            document.querySelectorAll(seletores).forEach(el => {
                el.style.setProperty('background-color', cor, 'important');
                el.style.setProperty('transition', 'background-color 0.25s ease');
            });
        },

        render() {
            if (!this.styleEl) return;
            let css = '';
            for (const [id, cor] of Object.entries(this.regras)) {
                css += `
                    tr.line[data-id="${id}"], tr.line[data-id="${id}"] td,
                    tr[data-id="${id}"], tr[data-id="${id}"] td,
                    tr[data-twoelve-id="${id}"], tr[data-twoelve-id="${id}"] td {
                        background-color: ${cor} !important;
                    }
                `;
            }
            this.styleEl.textContent = css;
        }
    };

    // Normaliza texto para comparação de endereços sem travar por acento
    function normalizarTextoEndereco(str) {
        if (!str) return '';
        return str
            .toString()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
    }

    // Função principal: identifica todos os endereços do filtro, marca eles com cinza, e então vai mudando para verde
    async function processarEnderecosNaPagina(enderecoAntigo, novosDados, statusEl) {
        console.log('--- INICIANDO MAPEAMENTO E ATUALIZAÇÃO DE ENDEREÇOS ---');
        console.log('Filtro informado:', enderecoAntigo);
        console.log('Novos dados a preencher:', novosDados);

        const filtrarTodos = enderecoAntigo.trim().toUpperCase() === 'TODOS';
        const filtroNorm = normalizarTextoEndereco(enderecoAntigo);

        // Inicializa o gerenciador de estilos
        estiloEnderecos.init();

        // 1. Busca todas as linhas de endereço existentes na tabela
        const todasAsLinhas = Array.from(document.querySelectorAll('table tbody tr.line, table tbody tr'))
            .filter(r => r.getAttribute('data-id') || r.querySelector('a.btn-editar, [class*="btn-editar"], i.icon-pencil, i.fa-pencil'));

        if (todasAsLinhas.length === 0) {
            console.warn('Nenhuma linha de endereço com botão editar foi encontrada na página.');
            statusEl.textContent = '⚠️ Nenhum endereço com botão de editar encontrado na página.';
            return;
        }

        // =========================================================================
        // PASSO 1: IDENTIFICAR TODOS OS ENDEREÇOS DO FILTRO
        // =========================================================================
        statusEl.textContent = '🔍 Identificando endereços do filtro...';
        const mapeados = [];

        for (let i = 0; i < todasAsLinhas.length; i++) {
            const row = todasAsLinhas[i];
            const textoLinha = lerEnderecoLinha(row);
            const textoNorm = normalizarTextoEndereco(textoLinha);

            const match = filtrarTodos ||
                          textoLinha.includes(enderecoAntigo.trim().toLowerCase()) ||
                          (filtroNorm && textoNorm.includes(filtroNorm));

            if (match) {
                // Obtém o data-id do ERP ou atribui identificador fixo
                let id = row.getAttribute('data-id');
                if (!id) {
                    id = 'temp_' + i;
                    row.setAttribute('data-twoelve-id', id);
                }

                mapeados.push({
                    id: String(id),
                    indexOriginal: i,
                    texto: textoLinha
                });
            }
        }

        if (mapeados.length === 0) {
            statusEl.textContent = `⚠️ Nenhum endereço correspondente a "${enderecoAntigo}" encontrado.`;
            return;
        }

        // =========================================================================
        // PASSO 2: MARCAR TODOS OS IDENTIFICADOS COM CINZA CLARO
        // (Faz isso uma única vez para todos os que foram identificados)
        // =========================================================================
        mapeados.forEach(item => {
            estiloEnderecos.definirCor(item.id, '#E2E8F0');
        });

        statusEl.textContent = `📋 ${mapeados.length} endereço(s) marcado(s) em cinza. Iniciando alterações...`;
        await wait(600); // Pausa para visualização das linhas marcadas em cinza

        // =========================================================================
        // PASSO 3: IR MUDANDO TODOS QUE FORAM MARCADOS (E PASSAR PARA VERDE #7FFFD4)
        // (Sem remarcar os outros! Cada um muda para verde assim que é concluído)
        // =========================================================================
        let processados = 0;

        for (let m = 0; m < mapeados.length; m++) {
            const item = mapeados[m];
            statusEl.textContent = `🔄 Atualizando ${m + 1} de ${mapeados.length} endereço(s)...`;

            // Localiza a linha correspondente no DOM atual pelo id
            let row = document.querySelector(`tr[data-id="${item.id}"], tr.line[data-id="${item.id}"], tr[data-twoelve-id="${item.id}"]`);
            if (!row) {
                const linhasAtuais = Array.from(document.querySelectorAll('table tbody tr.line, table tbody tr'));
                if (item.indexOriginal < linhasAtuais.length) {
                    row = linhasAtuais[item.indexOriginal];
                }
            }

            if (!row) {
                console.warn(`Linha com id ${item.id} não encontrada no DOM.`);
                continue;
            }

            // Clica no botão de editar da linha
            const clicou = clicarLapisLinha(row);
            if (!clicou) {
                console.warn(`Não foi possível clicar no botão editar do item id ${item.id}`);
                continue;
            }

            // Aguarda o modal do ERP abrir
            const modal = await aguardarModalERP(5000);
            if (!modal) {
                console.warn(`Modal do ERP não abriu a tempo para o item id ${item.id}`);
                continue;
            }

            // Aguarda o carregamento dos dados pelo AJAX do ERP
            let tentativasCarregamento = 0;
            while (tentativasCarregamento < 25) {
                const streetField = document.querySelector('#PeopleAddressStreet');
                if (streetField && streetField.value.trim().length > 0) break;
                await wait(200);
                tentativasCarregamento++;
            }
            await wait(500);

            // Preenche os campos solicitados
            if (novosDados.rua)        await preencherCampoERP('#PeopleAddressStreet',          novosDados.rua);
            if (novosDados.numero)     await preencherCampoERP('#PeopleAddressNumber',           novosDados.numero);
            if (novosDados.complemento) await preencherCampoERP('#PeopleAddressAddressComplement', novosDados.complemento);
            if (novosDados.bairro)     await preencherCampoERP('#PeopleAddressNeighborhood',     novosDados.bairro);
            if (novosDados.cidade)     await preencherCampoERP('#PeopleAddressCity',             novosDados.cidade);
            if (novosDados.cep)        await preencherCampoERP('#PeopleAddressPostalCode',       novosDados.cep);
            if (novosDados.referencia) await preencherCampoERP('#PeopleAddressAddressReference', novosDados.referencia);

            // Clica em Confirmar
            const confirmarBtn = (() => {
                const pane = document.querySelector('.ui-dialog-buttonpane');
                if (pane) {
                    const btns = pane.querySelectorAll('button');
                    for (const b of btns) {
                        if (b.textContent.trim().toLowerCase().includes('confirmar')) return b;
                    }
                }
                return Array.from(document.querySelectorAll('button'))
                    .find(b => b.textContent.trim().toLowerCase().includes('confirmar') && b.offsetParent !== null);
            })();

            if (confirmarBtn) {
                confirmarBtn.click();
                await aguardarModalFechar(5000);
                await wait(1000); // aguarda salvar e fechar

                // PASSA ESTE ITEM CONCLUÍDO PARA VERDE (#7FFFD4)!
                // Os outros que ainda não foram mexidos permanecem intocados com o cinza deles.
                estiloEnderecos.definirCor(item.id, '#7FFFD4');
                processados++;
            } else {
                console.warn('Botão Confirmar não encontrado no modal ERP');
                document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
                await aguardarModalFechar(3000);
            }
        }

        statusEl.textContent = `✅ ${processados} de ${mapeados.length} endereço(s) atualizado(s) com sucesso!`;
    }

    function criarModalEndereco() {
        if (modalAtivo) {
            modalAtivo.fechar();
            modalAtivo = null;
        }

        const modal = new TwoelveModalBase('📍 Atualizar Endereços');
        modalAtivo = modal;
        modal.abrir();

        const container = document.createElement('div');
        container.style.cssText = 'display: flex; flex-direction: column; gap: 16px;';

        const inputStyle = `
            width: 100%;
            padding: 10px 12px;
            border: 2px solid #000000;
            background: var(--modal-custom-bg, #ffffff);
            color: var(--modal-custom-text, #1f2937);
            font-family: inherit;
            font-size: 13px;
            box-sizing: border-box;
        `;
        const labelStyle = `
            display: block;
            margin-bottom: 6px;
            font-weight: 600;
            font-size: 11px;
            color: #4b5563;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        `;

        // ==============================================
        // Parser / montador
        // ==============================================
        function parseEnderecoCompleto(texto) {
            const resultado = { rua: '', numero: '', complemento: '', bairro: '', cidade: '', cep: '', referencia: '' };
            if (!texto) return resultado;
            const pedacos = String(texto).split(',').map(p => p.trim());
            const ordem = ['rua', 'numero', 'complemento', 'bairro', 'cidade', 'cep', 'referencia'];
            ordem.forEach((campo, i) => {
                if (i < pedacos.length && pedacos[i] !== '') resultado[campo] = pedacos[i];
            });
            return resultado;
        }
        function montarEnderecoCompleto(campos) {
            return [
                campos.rua.value.trim(),
                campos.numero.value.trim(),
                campos.complemento ? campos.complemento.value.trim() : '',
                campos.bairro.value.trim(),
                campos.cidade.value.trim(),
                campos.cep.value.trim(),
                campos.referencia.value.trim()
            ].join(' , ');
        }

        // ==============================================
        // APIs de CEP (ViaCEP)
        // ==============================================
        async function cepParaEndereco(cep) {
            const limpo = String(cep || '').replace(/\D/g, '');
            if (limpo.length !== 8) return null;
            try {
                const resp = await fetch(`https://viacep.com.br/ws/${limpo}/json/`);
                if (!resp.ok) return null;
                const data = await resp.json();
                if (data.erro) return null;
                return {
                    cep: limpo,
                    rua: data.logradouro || '',
                    bairro: data.bairro || '',
                    cidade: data.localidade || '',
                    uf: data.uf || ''
                };
            } catch (e) {
                console.error('[TwoElve] cepParaEndereco:', e);
                return null;
            }
        }

        async function enderecoParaCep(uf, cidade, rua) {
            if (!uf || String(uf).length !== 2 || !cidade || !rua) return null;
            try {
                const url = `https://viacep.com.br/ws/${encodeURIComponent(uf)}/${encodeURIComponent(cidade)}/${encodeURIComponent(rua)}/json/`;
                const resp = await fetch(url);
                if (!resp.ok) return null;
                const data = await resp.json();
                if (!Array.isArray(data) || data.length === 0) return null;
                return data.map(d => ({
                    cep: d.cep, rua: d.logradouro, bairro: d.bairro, cidade: d.localidade, uf: d.uf
                }));
            } catch (e) {
                console.error('[TwoElve] enderecoParaCep:', e);
                return null;
            }
        }

        // ==============================================
        // Preenche formulário direto
        // ==============================================
        async function preencherFormularioDireto(novosDados, statusEl) {
            const MAPA = {
                rua: '#PersonStreet', numero: '#PersonNumber', complemento: '#PersonAddressComplement',
                bairro: '#PersonNeighborhood', cidade: '#PersonCity', cep: null, referencia: '#PersonAddressReference'
            };
            let preenchidos = 0;
            for (const [campo, seletor] of Object.entries(MAPA)) {
                if (!seletor) continue;
                if (!novosDados[campo]) continue;
                const el = document.querySelector(seletor);
                if (!el) continue;
                await preencherCampoERP(seletor, novosDados[campo]);
                preenchidos++;
            }
            if (preenchidos > 0) {
                statusEl.textContent = `✅ ${preenchidos} campo(s) preenchido(s) no formulário direto.`;
            }
            return preenchidos;
        }

        // ==============================================
        // Lê endereço da página
        // ==============================================
        function lerEnderecoDaPagina() {
            const GRUPOS = [
                {
                    rua: '#PersonStreet', numero: '#PersonNumber', complemento: '#PersonAddressComplement',
                    bairro: '#PersonNeighborhood', cidade: '#PersonCity', cep: null, referencia: '#PersonAddressReference'
                },
                {
                    rua: '#PeopleAddressStreet', numero: '#PeopleAddressNumber', complemento: '#PeopleAddressAddressComplement',
                    bairro: '#PeopleAddressNeighborhood', cidade: '#PeopleAddressCity', cep: '#PeopleAddressPostalCode', referencia: '#PeopleAddressAddressReference'
                }
            ];
            const lerValor = (sel) => {
                if (!sel) return '';
                const el = document.querySelector(sel);
                return el ? String(el.value || '').trim() : '';
            };
            for (const g of GRUPOS) {
                const algumExiste = Object.values(g).some(sel => sel && document.querySelector(sel));
                if (!algumExiste) continue;
                return {
                    rua: lerValor(g.rua), numero: lerValor(g.numero), complemento: lerValor(g.complemento),
                    bairro: lerValor(g.bairro), cidade: lerValor(g.cidade), cep: lerValor(g.cep), referencia: lerValor(g.referencia)
                };
            }
            return null;
        }

        function temListaDeEnderecos() {
            return !!document.querySelector('a.btn-editar, i.icon-pencil, i.fa-pencil');
        }

        // ==============================================
        // UI
        // ==============================================
        const info = document.createElement('div');
        info.style.cssText = 'font-size: 12px; color: #6b7280; padding: 8px 12px; background: #f3f4f6; border-left: 3px solid #000;';
        info.textContent = 'Digite "TODOS" em Endereço Antigo para atualizar todos os endereços da lista, ou informe parte do endereço para filtrar. Se a página não tiver lista, os campos diretos serão preenchidos. CEP e endereço se completam automaticamente (UF fixa: MG). Se a rua estiver errada, aparecem sugestões parecidas embaixo do campo.';
        container.appendChild(info);

        // Campo único
        const endCompletoGroup = document.createElement('div');
        const endCompletoLabel = document.createElement('label');
        endCompletoLabel.textContent = '✍️ Endereço completo (rua , numero , bairro , cidade , cep , ref):';
        endCompletoLabel.style.cssText = labelStyle;
        const endCompletoInput = document.createElement('input');
        endCompletoInput.type = 'text';
        endCompletoInput.placeholder = 'Rua André Gotti , 82 , centro , sao joao nepomuceno , 36680123';
        endCompletoInput.style.cssText = inputStyle;
        endCompletoGroup.appendChild(endCompletoLabel);
        endCompletoGroup.appendChild(endCompletoInput);
        container.appendChild(endCompletoGroup);

        // Endereço antigo
        const endAntigoGroup = document.createElement('div');
        const endAntigoLabel = document.createElement('label');
        endAntigoLabel.textContent = '🔍 Endereço Antigo (ou TODOS):';
        endAntigoLabel.style.cssText = labelStyle;
        const endAntigoInput = document.createElement('input');
        endAntigoInput.type = 'text';
        endAntigoInput.placeholder = 'Ex: ANDRE GOTTY  ou  TODOS';
        endAntigoInput.style.cssText = inputStyle;
        endAntigoGroup.appendChild(endAntigoLabel);
        endAntigoGroup.appendChild(endAntigoInput);
        container.appendChild(endAntigoGroup);

        // Separador
        const sep = document.createElement('div');
        sep.style.cssText = 'height: 2px; background: #000; margin: 4px 0;';
        container.appendChild(sep);

        const novoTitulo = document.createElement('div');
        novoTitulo.textContent = 'NOVOS DADOS (deixe vazio para não alterar):';
        novoTitulo.style.cssText = 'font-size: 11px; font-weight: 700; color: #4b5563; text-transform: uppercase; letter-spacing: 0.5px;';
        container.appendChild(novoTitulo);

        // 7 campos (incluindo complemento abaixo do número)
        const camposConfig = [
            { id: 'rua',         label: '🏠 Rua:',         placeholder: 'Ex: Rua André Gotty' },
            { id: 'numero',      label: '🔢 Número:',       placeholder: 'Ex: 82' },
            { id: 'complemento', label: '🚪 Complemento:',  placeholder: 'Ex: Apto 101, Bloco B, Fundos' },
            { id: 'bairro',      label: '🏘️ Bairro:',      placeholder: 'Ex: Centro' },
            { id: 'cidade',      label: '🌆 Cidade:',       placeholder: 'Ex: São João Nepomuceno' },
            { id: 'cep',         label: '📮 CEP:',          placeholder: 'Ex: 36680-000' },
            { id: 'referencia',  label: '📍 Referência:',   placeholder: 'Ex: Próximo ao mercado' }
        ];
        const campos = {};
        camposConfig.forEach(cfg => {
            const group = document.createElement('div');
            const label = document.createElement('label');
            label.textContent = cfg.label;
            label.style.cssText = labelStyle;
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = cfg.placeholder;
            input.style.cssText = inputStyle;
            group.appendChild(label);
            group.appendChild(input);
            container.appendChild(group);
            campos[cfg.id] = input;
        });

        // Status
        const statusEl = document.createElement('div');
        statusEl.style.cssText = 'font-size: 12px; color: #6b7280; min-height: 20px; font-style: italic;';
        container.appendChild(statusEl);

        // ==============================================
        // Sincronização bidirecional
        // ==============================================
        let sincronizando = false;
        const ORDEM = ['rua', 'numero', 'complemento', 'bairro', 'cidade', 'cep', 'referencia'];

        const doCampoUnicoParaSeparados = () => {
            if (sincronizando) return;
            sincronizando = true;
            try {
                const parsed = parseEnderecoCompleto(endCompletoInput.value);
                ORDEM.forEach(k => { campos[k].value = parsed[k]; });
            } finally { sincronizando = false; }
        };
        const dosSeparadosParaCampoUnico = () => {
            if (sincronizando) return;
            sincronizando = true;
            try { endCompletoInput.value = montarEnderecoCompleto(campos); }
            finally { sincronizando = false; }
        };

        // ==============================================
        // Busca de CEP (com flag pra evitar loop)
        // ==============================================
        let buscandoCep = false;

        async function tentarCepParaEndereco() {
            if (buscandoCep) return;
            const cep = campos.cep.value.replace(/\D/g, '');
            if (cep.length !== 8) return;
            if (campos.cep.dataset.ultimoCepBuscado === cep) return;
            campos.cep.dataset.ultimoCepBuscado = cep;

            buscandoCep = true;
            statusEl.textContent = `⏳ Buscando endereço para o CEP ${cep}...`;
            try {
                const dados = await cepParaEndereco(cep);
                if (!dados) {
                    statusEl.textContent = `⚠️ CEP ${cep} não encontrado. Endereço mantido.`;
                    return;
                }
                // CEP é fonte confiável -> SOBRESCREVE rua/bairro/cidade
                sincronizando = true;
                try {
                    if (dados.rua)    campos.rua.value = dados.rua;
                    if (dados.bairro) campos.bairro.value = dados.bairro;
                    if (dados.cidade) campos.cidade.value = dados.cidade;
                } finally { sincronizando = false; }
                dosSeparadosParaCampoUnico();
                statusEl.textContent = `✅ CEP ${dados.cep} → ${dados.cidade}/${dados.uf}`;
            } finally {
                buscandoCep = false;
            }
        }

        async function tentarEnderecoParaCep() {
            if (buscandoCep) return;
            const rua = campos.rua.value.trim();
            const cidade = campos.cidade.value.trim();
            if (!rua || !cidade) return;

            const uf = 'MG'; // UF fixa

            const chave = `${uf}|${cidade}|${rua}`;
            if (campos.rua.dataset.ultimaBusca === chave) return;
            campos.rua.dataset.ultimaBusca = chave;

            buscandoCep = true;
            statusEl.textContent = `⏳ Buscando CEP para "${rua}, ${cidade}/${uf}"...`;
            try {
                const lista = await enderecoParaCep(uf, cidade, rua);
                if (!lista) {
                    statusEl.textContent = '⚠️ Nenhum CEP encontrado. CEP mantido. (veja as sugestões abaixo do campo)';
                    return;
                }
                if (lista.length === 1) {
                    // achou 1 -> SOBRESCREVE o CEP (mesmo que já tenha)
                    const d = lista[0];
                    sincronizando = true;
                    try {
                        campos.cep.value = d.cep;
                        if (d.bairro && !campos.bairro.value.trim()) campos.bairro.value = d.bairro;
                    } finally { sincronizando = false; }
                    dosSeparadosParaCampoUnico();
                    statusEl.textContent = `✅ CEP ${d.cep} encontrado.`;
                } else {
                    // vários -> NÃO chuta, mostra amostra
                    const amostra = lista.slice(0, 3).map(d => `${d.cep} (${d.bairro || '?'})`).join(' | ');
                    statusEl.textContent = `⚠️ Vários CEPs (${lista.length}): ${amostra}. Digite o CEP manualmente.`;
                }
            } finally {
                buscandoCep = false;
            }
        }

        // ==============================================
        // Sugestões fuzzy de endereço (barra embaixo do input)
        // ==============================================
        const semAcento = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
        const limparRua = (s) => semAcento(s).replace(/^(rua|r|avenida|av|travessa|tv|alameda|praca|pca|estrada|beco|rodovia|rod|largo|vila|vl)\s+/, '');

        function dice(a, b) {
            if (a === b) return 1;
            if (a.length < 2 || b.length < 2) return 0;
            const bg = (s) => { const m = new Map(); for (let i = 0; i < s.length - 1; i++) { const k = s.substr(i, 2); m.set(k, (m.get(k) || 0) + 1); } return m; };
            const A = bg(a), B = bg(b);
            let inter = 0;
            A.forEach((v, k) => { if (B.has(k)) inter += Math.min(v, B.get(k)); });
            return (2 * inter) / ((a.length - 1) + (b.length - 1));
        }
        function pontuar(digitado, candidato) {
            const d = limparRua(digitado), c = limparRua(candidato);
            let s = dice(d, c);
            if (c.includes(d) || d.includes(c)) s = Math.max(s, 0.85);
            // melhor casamento palavra a palavra
            const dw = d.split(' ').filter(w => w.length >= 3), cw = c.split(' ');
            if (dw.length) {
                const m = dw.reduce((acc, w) => acc + Math.max(...cw.map(x => dice(w, x))), 0) / dw.length;
                s = Math.max(s, m * 0.95);
            }
            return s;
        }

        const cacheSug = new Map();
        let tokenSug = 0;

        async function buscarSugestoes(rua, cidade) {
            const base = limparRua(rua);
            const palavras = base.split(' ').filter(w => w.length >= 3);
            if (!palavras.length || !cidade) return [];
            const termos = new Set();
            palavras.forEach(w => { termos.add(w); if (w.length > 4) termos.add(w.slice(0, 4)); });
            const lista = Array.from(termos).slice(0, 5);

            const respostas = await Promise.all(lista.map(async (t) => {
                const k = `MG|${semAcento(cidade)}|${t}`;
                if (!cacheSug.has(k)) cacheSug.set(k, await enderecoParaCep('MG', cidade, t));
                return cacheSug.get(k) || [];
            }));

            const unicos = new Map();
            respostas.flat().forEach(d => { if (d && d.cep && !unicos.has(d.cep)) unicos.set(d.cep, d); });

            return Array.from(unicos.values())
                .map(d => ({ ...d, score: pontuar(rua, d.rua || '') }))
                .filter(d => d.score >= 0.4)
                .sort((a, b) => b.score - a.score)
                .slice(0, 6);
        }

        const caixaSug = document.createElement('div');
        caixaSug.style.cssText = 'display:none; border:2px solid #000; border-top:none; background:#fff; max-height:180px; overflow-y:auto; font-size:12px;';
        endCompletoGroup.appendChild(caixaSug);

        function esconderSugestoes() { caixaSug.style.display = 'none'; caixaSug.innerHTML = ''; }

        function selecionarSugestao(d) {
            sincronizando = true;
            try {
                campos.rua.value = d.rua || '';
                campos.bairro.value = d.bairro || '';
                campos.cidade.value = d.cidade || campos.cidade.value;
                campos.cep.value = String(d.cep || '').replace(/\D/g, '');
            } finally { sincronizando = false; }
            // evita as buscas automáticas sobrescreverem a escolha
            campos.cep.dataset.ultimoCepBuscado = campos.cep.value;
            campos.rua.dataset.ultimaBusca = `MG|${campos.cidade.value.trim()}|${campos.rua.value.trim()}`;
            dosSeparadosParaCampoUnico();
            esconderSugestoes();
            statusEl.textContent = `✅ Selecionado: ${d.rua} — CEP ${d.cep}`;
        }

        async function mostrarSugestoes() {
            const rua = campos.rua.value.trim();
            const cidade = campos.cidade.value.trim();
            if (rua.length < 3) { esconderSugestoes(); return; }
            if (!cidade) { statusEl.textContent = '⚠️ Informe a cidade para sugerir endereços.'; return; }

            const meuToken = ++tokenSug;
            const resultados = await buscarSugestoes(rua, cidade);
            if (meuToken !== tokenSug) return; // resposta velha, ignora

            caixaSug.innerHTML = '';
            if (!resultados.length) { esconderSugestoes(); return; }

            resultados.forEach(d => {
                const item = document.createElement('div');
                item.style.cssText = 'padding:8px 10px; cursor:pointer; border-top:1px solid #e5e7eb; color:#1f2937;';
                item.textContent = `${d.rua} — ${d.bairro || '?'} (${d.cep}) · ${Math.round(d.score * 100)}%`;
                item.addEventListener('mouseenter', () => { item.style.background = '#f3f4f6'; });
                item.addEventListener('mouseleave', () => { item.style.background = '#fff'; });
                item.addEventListener('mousedown', (e) => { e.preventDefault(); selecionarSugestao(d); });
                caixaSug.appendChild(item);
            });
            caixaSug.style.display = 'block';
        }

        // ==============================================
        // Listeners de sincronização + busca
        // ==============================================
        let debounceUnico;
        endCompletoInput.addEventListener('input', () => {
            clearTimeout(debounceUnico);
            debounceUnico = setTimeout(() => {
                doCampoUnicoParaSeparados();
                tentarCepParaEndereco();
                tentarEnderecoParaCep();
                mostrarSugestoes();
            }, 400);
        });
        endCompletoInput.addEventListener('blur', () => setTimeout(esconderSugestoes, 150));

        ORDEM.forEach(k => {
            let debounceCampo;
            campos[k].addEventListener('input', () => {
                clearTimeout(debounceCampo);
                debounceCampo = setTimeout(() => {
                    dosSeparadosParaCampoUnico();
                    if (k === 'cep') tentarCepParaEndereco();
                    if (k === 'rua' || k === 'cidade') { tentarEnderecoParaCep(); mostrarSugestoes(); }
                }, 600);
            });
        });

        // ==============================================
        // Botão "Pegar endereço da página"
        // ==============================================
        const btnPegar = document.createElement('button');
        btnPegar.textContent = '📥 Pegar endereço da página';
        btnPegar.className = 'twoelve-button';
        btnPegar.addEventListener('click', async () => {
            const lido = lerEnderecoDaPagina();
            if (!lido) { statusEl.textContent = '⚠️ Nenhum campo de endereço encontrado nesta página.'; return; }
            const algumPreenchido = Object.values(lido).some(v => v.length > 0);
            if (!algumPreenchido) { statusEl.textContent = '⚠️ Os campos da página estão vazios.'; return; }

            sincronizando = true;
            try { Object.keys(lido).forEach(k => { campos[k].value = lido[k]; }); }
            finally { sincronizando = false; }
            dosSeparadosParaCampoUnico();
            statusEl.textContent = '📥 Endereço carregado da página.';

            await tentarCepParaEndereco();
            await tentarEnderecoParaCep();
            mostrarSugestoes();
        });
        container.appendChild(btnPegar);

        // ==============================================
        // Botão Confirmar
        // ==============================================
        const btnConfirmar = document.createElement('button');
        btnConfirmar.textContent = '✅ Atualizar Endereços';
        btnConfirmar.className = 'twoelve-button-primary';
        btnConfirmar.addEventListener('click', async () => {
            const enderecoAntigo = endAntigoInput.value.trim();
            const novosDados = {
                rua: campos.rua.value.trim(), numero: campos.numero.value.trim(),
                complemento: campos.complemento ? campos.complemento.value.trim() : '',
                bairro: campos.bairro.value.trim(), cidade: campos.cidade.value.trim(),
                cep: campos.cep.value.trim(), referencia: campos.referencia.value.trim()
            };
            const algumPreenchido = Object.values(novosDados).some(v => v.length > 0);
            if (!algumPreenchido) { statusEl.textContent = '⚠️ Preencha ao menos um campo novo.'; return; }

            btnConfirmar.disabled = true;
            btnConfirmar.textContent = '⏳ Processando...';
            try {
                const preenchidosDireto = await preencherFormularioDireto(novosDados, statusEl);
                if (temListaDeEnderecos()) {
                    if (!enderecoAntigo) {
                        statusEl.textContent = '⚠️ Informe o endereço antigo ou "TODOS" para atualizar a lista.';
                    } else {
                        await processarEnderecosNaPagina(enderecoAntigo, novosDados, statusEl);
                    }
                } else if (preenchidosDireto === 0) {
                    statusEl.textContent = '⚠️ Nenhum campo de endereço encontrado nesta página.';
                }
            } finally {
                btnConfirmar.disabled = false;
                btnConfirmar.textContent = '✅ Atualizar Endereços';
            }
        });
        container.appendChild(btnConfirmar);

        modal.setConteudoElemento(container);
        modal.setFecharCallback(() => { modalAtivo = null; });
    }

    // ==============================================
    // 5. MODAL HUAWEI (ROUTER MANAGER)
    // ==============================================
    const HUAWEI_CONFIG = {
        baseUrl: window.location.origin + window.location.pathname,
        senhaPadrao: "elonet3005",
        rotas: {
            home: "#/home",
            internet: "#/internet",
            lan: "#/more/lan",
            wifi: "#/wifi"
        },
        seletores: {
            inputLoginSenha: "#userpassword_ctrl",
            btnLogin: "#loginbtn",
            wifiDualSwitchOn: "#dbhoOn_btnId",
            wifiSaveBtn: "#SsidSettings_submitbutton",
            wifi2gName: "#content_wifi_name2G_ctrl",
            wifi2gPass: "#content_wifi_password2G_ctrl",
            wifi5gName: "#content_wifi_name5G_ctrl",
            wifi5gPass: "#content_wifi_password5G_ctrl",
            ppoeUser: "#wan_internet_account_ctrl",
            ppoePass: "#wan_internet_password_ctrl",
            dhcpMin: "#minip_ctrl",
            dhcpMax: "#maxip_ctrl",
            dnsCheckLabel: "#lan_DNSOverrideAllowedctrl_checkbox_ctrl_checkbox_ctrl",
            dnsCheckIcon: "#lan_DNSOverrideAllowedctrl_checkbox_ctrl_checkbox_ctrl i",
            dnsPrimary: "#lan_primary_dnsserverce_labelinfo_ctrl",
            dnsSecondary: "#lan_secondary_dnsserverce_labelinfo_ctrl",
            btnSaveLan: "#lanipsavebtn"
        }
    };

    async function fillFieldHuawei(el, value, win) {
        if (!el || !win) return false;
        try {
            el.focus();
            el.click();
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(win.HTMLInputElement.prototype, "value").set;
            if (nativeInputValueSetter) {
                nativeInputValueSetter.call(el, value);
            } else {
                el.value = value;
            }
            const opts = { bubbles: true, cancelable: true };
            el.dispatchEvent(new win.KeyboardEvent('keydown', opts));
            el.dispatchEvent(new win.KeyboardEvent('keypress', opts));
            el.dispatchEvent(new win.Event('input', opts));
            el.dispatchEvent(new win.Event('change', opts));
            await wait(150);
            el.dispatchEvent(new win.Event('blur', opts));
            return true;
        } catch (error) {
            console.error('Erro em fillFieldHuawei:', error);
            return false;
        }
    }

    function clicarSalvar(doc, idEspecifico) {
        let btn = idEspecifico ? doc.querySelector(idEspecifico) : null;
        if (!btn) {
            const all = Array.from(doc.querySelectorAll('button, input[type="button"], div.common_button_long'));
            btn = all.find(b => (b.innerText && (b.innerText.includes('Salvar') || b.innerText.includes('Apply'))));
        }
        if (btn) {
            const opts = { bubbles: true, cancelable: true, view: doc.defaultView };
            btn.dispatchEvent(new MouseEvent('mousedown', opts));
            btn.dispatchEvent(new MouseEvent('mouseup', opts));
            btn.click();
        }
    }

    async function loginHuawei() {
        console.log('Tentando login Huawei...');
        if (window._huaweiLoginInProgress) {
            console.warn('Login Huawei já em andamento');
            return false;
        }
        window._huaweiLoginInProgress = true;
        try {
            const huaweiPasswordField = document.querySelector('#userpassword_ctrl');
            const huaweiLoginButton = document.querySelector('#loginbtn.loginbtn.common_button_long');
            if (huaweiPasswordField && huaweiLoginButton) {
                await fillField(huaweiPasswordField, 'elonet3005');
                huaweiLoginButton.click();
                return true;
            }
            const huawey_descoberto_user = document.querySelector('#txt_Username');
            const huawey_descoberto_pass = document.querySelector('#txt_Password');
            const huawey_descoberto_login = document.querySelector('#button');
            if (huawey_descoberto_user && huawey_descoberto_pass) {
                await fillField(huawey_descoberto_user, 'elonet');
                await fillField(huawey_descoberto_pass, 'elonet3005');
                huawey_descoberto_login.click();
                return true;
            }
            return false;
        } finally {
            window._huaweiLoginInProgress = false;
        }
    }

    function executarNoGhostFrame(rota, acaoCallback) {
        return new Promise((resolve, reject) => {
            const iframe = document.createElement('iframe');
            Object.assign(iframe.style, { width: "0", height: "0", border: "none", visibility: "hidden", position: "absolute" });
            iframe.src = HUAWEI_CONFIG.baseUrl + rota;
            document.body.appendChild(iframe);
            iframe.onload = async function () {
                try {
                    const doc = iframe.contentDocument || iframe.contentWindow.document;
                    const win = iframe.contentWindow;
                    let tentativas = 0;
                    const checkElement = setInterval(async () => {
                        if (doc.body) {
                            const resultado = await acaoCallback(doc, win);
                            if (resultado === true || tentativas > 60) {
                                clearInterval(checkElement);
                                setTimeout(() => { document.body.removeChild(iframe); resolve(true); }, 1000);
                            }
                        }
                        tentativas++;
                    }, 200);
                } catch (e) { document.body.removeChild(iframe); reject(e); }
            };
        });
    }

    async function lerWifiExclusivo() {
        const dados = {};
        await executarNoGhostFrame(HUAWEI_CONFIG.rotas.wifi, async (doc, win) => {
            const btnOn = doc.querySelector(HUAWEI_CONFIG.seletores.wifiDualSwitchOn);
            if (btnOn) { btnOn.click(); await wait(3000); }
            let w2n = doc.querySelector(HUAWEI_CONFIG.seletores.wifi2gName);
            if (!w2n) { await wait(1500); w2n = doc.querySelector(HUAWEI_CONFIG.seletores.wifi2gName); }
            if (w2n) {
                dados.wifi2gName = w2n.value;
                dados.wifi2gPass = doc.querySelector(HUAWEI_CONFIG.seletores.wifi2gPass)?.value;
                dados.wifi5gName = doc.querySelector(HUAWEI_CONFIG.seletores.wifi5gName)?.value;
                dados.wifi5gPass = doc.querySelector(HUAWEI_CONFIG.seletores.wifi5gPass)?.value;
                return true;
            }
            return false;
        });
        return dados;
    }

    async function lerPPOEExclusivo() {
        const dados = {};
        await executarNoGhostFrame(HUAWEI_CONFIG.rotas.internet, (doc) => {
            const elUser = doc.querySelector(HUAWEI_CONFIG.seletores.ppoeUser);
            if (elUser) {
                dados.ppoeUser = elUser.value;
                dados.ppoePass = doc.querySelector(HUAWEI_CONFIG.seletores.ppoePass)?.value;
                return true;
            }
            return false;
        });
        return dados;
    }

    async function lerLanExclusivo() {
        const dados = {};
        await executarNoGhostFrame(HUAWEI_CONFIG.rotas.lan, async (doc, win) => {
            const checkIcon = doc.querySelector(HUAWEI_CONFIG.seletores.dnsCheckIcon);
            const checkLabel = doc.querySelector(HUAWEI_CONFIG.seletores.dnsCheckLabel);
            if (checkIcon && checkLabel) {
                const estaAtivo = checkIcon.className.includes("on") || checkIcon.className.includes("checked");
                if (!estaAtivo) { checkLabel.click(); await wait(1000); }
            }
            const elMin = doc.querySelector(HUAWEI_CONFIG.seletores.dhcpMin);
            const elMax = doc.querySelector(HUAWEI_CONFIG.seletores.dhcpMax);
            if (elMin && elMax) {
                dados.dhcpMin = elMin.value;
                dados.dhcpMax = elMax.value;
                const dnsEls = doc.querySelectorAll(HUAWEI_CONFIG.seletores.dnsPrimary);
                dados.dnsPri = dnsEls[0] ? dnsEls[0].value : '';
                dados.dnsSec = dnsEls[1] ? dnsEls[1].value : (doc.querySelector(HUAWEI_CONFIG.seletores.dnsSecondary)?.value || '');
                return true;
            }
            return false;
        });
        return dados;
    }

    async function lerTudo() {
        const [dadosWifi, dadosPPOE, dadosLAN] = await Promise.all([
            lerWifiExclusivo(),
            lerPPOEExclusivo(),
            lerLanExclusivo()
        ]);
        const dadosCombinados = { ...dadosWifi, ...dadosPPOE, ...dadosLAN };
        document.getElementById('wifi2gName').value = dadosCombinados.wifi2gName || '';
        document.getElementById('wifi2gPass').value = dadosCombinados.wifi2gPass || '';
        document.getElementById('wifi5gName').value = dadosCombinados.wifi5gName || '';
        document.getElementById('wifi5gPass').value = dadosCombinados.wifi5gPass || '';
        document.getElementById('ppoeUser').value = dadosCombinados.ppoeUser || '';
        document.getElementById('ppoePass').value = dadosCombinados.ppoePass || '';
        document.getElementById('dhcpMin').value = dadosCombinados.dhcpMin || '';
        document.getElementById('dhcpMax').value = dadosCombinados.dhcpMax || '';
        document.getElementById('dnsPri').value = dadosCombinados.dnsPri || '';
        document.getElementById('dnsSec').value = dadosCombinados.dnsSec || '';
        const dadosAtuais = JSON.parse(localStorage.getItem('HUAWEI_DATA') || '{}');
        localStorage.setItem('HUAWEI_DATA', JSON.stringify({ ...dadosAtuais, ...dadosCombinados }));
    }

    async function atualizarCampo(tipo, valor, valorExtra = null) {
        let rota = "", seletor1 = "", seletor2 = "", seletorBtn = "";
        if (tipo === 'ppoeUser') { rota = HUAWEI_CONFIG.rotas.internet; seletor1 = HUAWEI_CONFIG.seletores.ppoeUser; }
        else if (tipo === 'ppoePass') { rota = HUAWEI_CONFIG.rotas.internet; seletor1 = HUAWEI_CONFIG.seletores.ppoePass; }
        else if (tipo === 'wifi2gName') { rota = HUAWEI_CONFIG.rotas.wifi; seletor1 = HUAWEI_CONFIG.seletores.wifi2gName; seletorBtn = HUAWEI_CONFIG.seletores.wifiSaveBtn; }
        else if (tipo === 'wifi2gPass') { rota = HUAWEI_CONFIG.rotas.wifi; seletor1 = HUAWEI_CONFIG.seletores.wifi2gPass; seletorBtn = HUAWEI_CONFIG.seletores.wifiSaveBtn; }
        else if (tipo === 'wifi5gName') { rota = HUAWEI_CONFIG.rotas.wifi; seletor1 = HUAWEI_CONFIG.seletores.wifi5gName; seletorBtn = HUAWEI_CONFIG.seletores.wifiSaveBtn; }
        else if (tipo === 'wifi5gPass') { rota = HUAWEI_CONFIG.rotas.wifi; seletor1 = HUAWEI_CONFIG.seletores.wifi5gPass; seletorBtn = HUAWEI_CONFIG.seletores.wifiSaveBtn; }
        else {
            rota = HUAWEI_CONFIG.rotas.lan; seletorBtn = HUAWEI_CONFIG.seletores.btnSaveLan;
            if (tipo === 'dhcpRange') { seletor1 = HUAWEI_CONFIG.seletores.dhcpMin; seletor2 = HUAWEI_CONFIG.seletores.dhcpMax; }
            else if (tipo === 'dnsPri') seletor1 = HUAWEI_CONFIG.seletores.dnsPrimary;
            else if (tipo === 'dnsSec') seletor1 = HUAWEI_CONFIG.seletores.dnsSecondary;
        }
        await executarNoGhostFrame(rota, async (doc, win) => {
            if (rota === HUAWEI_CONFIG.rotas.wifi) {
                const btnOn = doc.querySelector(HUAWEI_CONFIG.seletores.wifiDualSwitchOn);
                if (btnOn) { btnOn.click(); await wait(2500); }
            }
            if (rota === HUAWEI_CONFIG.rotas.lan) {
                const checkIcon = doc.querySelector(HUAWEI_CONFIG.seletores.dnsCheckIcon);
                const checkLabel = doc.querySelector(HUAWEI_CONFIG.seletores.dnsCheckLabel);
                if (checkIcon && checkLabel) {
                    const estaAtivo = checkIcon.className.includes("on") || checkIcon.className.includes("checked");
                    if (!estaAtivo) { checkLabel.click(); await wait(1000); }
                }
            }
            let el1, el2;
            if (tipo === 'dnsPri') el1 = doc.querySelectorAll(seletor1)[0];
            else if (tipo === 'dnsSec') el1 = doc.querySelectorAll(HUAWEI_CONFIG.seletores.dnsPrimary)[1] || doc.querySelector(seletor1);
            else el1 = doc.querySelector(seletor1);
            if (tipo === 'dhcpRange') {
                el2 = doc.querySelector(seletor2);
                if (el1 && el2) {
                    await fillFieldHuawei(el1, valor, win);
                    await wait(300);
                    await fillFieldHuawei(el2, valorExtra, win);
                    await wait(300);
                    clicarSalvar(doc, seletorBtn);
                    return true;
                }
                return false;
            }
            if (el1) {
                await fillFieldHuawei(el1, valor, win);
                clicarSalvar(doc, seletorBtn || ".common_button_long");
                return true;
            }
            return false;
        });
    }

    function abrirModalHuawei() {
        if (modalAtivo) {
            modalAtivo.fechar();
            modalAtivo = null;
        }

        const dados = JSON.parse(localStorage.getItem('HUAWEI_DATA') || '{}');

        const modal = new TwoelveModalBase('🌐 Huawei Router Manager');
        modalAtivo = modal;
        modal.abrir();

        const container = document.createElement('div');
        container.style.cssText = 'display: flex; flex-direction: column; gap: 16px;';

        const inputStyle = `
            width: 100%;
            padding: 8px 10px;
            border: 2px solid #000000;
            background: var(--modal-custom-bg, #ffffff);
            color: var(--modal-custom-text, #1f2937);
            font-family: inherit;
            font-size: 12px;
            box-sizing: border-box;
        `;
        const labelStyle = `
            display: block;
            margin-bottom: 4px;
            font-weight: 600;
            font-size: 10px;
            color: #4b5563;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        `;
        const cardStyle = `
            background: #f9fafb;
            border: 2px solid #000000;
            padding: 12px;
            margin-bottom: 12px;
        `;
        const cardTitleStyle = `
            font-weight: 700;
            font-size: 12px;
            margin-bottom: 10px;
            color: #10b981;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 5px;
        `;

        const wifiCard = document.createElement('div');
        wifiCard.style.cssText = cardStyle;
        const wifiTitle = document.createElement('div');
        wifiTitle.textContent = '📶 Wi-Fi';
        wifiTitle.style.cssText = cardTitleStyle;
        wifiCard.appendChild(wifiTitle);

        const wifi2gGroup = document.createElement('div');
        wifi2gGroup.style.marginBottom = '10px';
        const wifi2gLabel = document.createElement('label');
        wifi2gLabel.textContent = '2.4 GHz Nome:';
        wifi2gLabel.style.cssText = labelStyle;
        const wifi2gName = document.createElement('input');
        wifi2gName.id = 'wifi2gName';
        wifi2gName.type = 'text';
        wifi2gName.value = dados.wifi2gName || '';
        wifi2gName.style.cssText = inputStyle;
        wifi2gGroup.appendChild(wifi2gLabel);
        wifi2gGroup.appendChild(wifi2gName);
        wifiCard.appendChild(wifi2gGroup);

        const wifi2gPassGroup = document.createElement('div');
        wifi2gPassGroup.style.marginBottom = '10px';
        const wifi2gPassLabel = document.createElement('label');
        wifi2gPassLabel.textContent = '2.4 GHz Senha:';
        wifi2gPassLabel.style.cssText = labelStyle;
        const wifi2gPass = document.createElement('input');
        wifi2gPass.id = 'wifi2gPass';
        wifi2gPass.type = 'text';
        wifi2gPass.value = dados.wifi2gPass || '';
        wifi2gPass.style.cssText = inputStyle;
        wifi2gPassGroup.appendChild(wifi2gPassLabel);
        wifi2gPassGroup.appendChild(wifi2gPass);
        wifiCard.appendChild(wifi2gPassGroup);

        const wifi5gGroup = document.createElement('div');
        wifi5gGroup.style.marginBottom = '10px';
        const wifi5gLabel = document.createElement('label');
        wifi5gLabel.textContent = '5 GHz Nome:';
        wifi5gLabel.style.cssText = labelStyle;
        const wifi5gName = document.createElement('input');
        wifi5gName.id = 'wifi5gName';
        wifi5gName.type = 'text';
        wifi5gName.value = dados.wifi5gName || '';
        wifi5gName.style.cssText = inputStyle;
        wifi5gGroup.appendChild(wifi5gLabel);
        wifi5gGroup.appendChild(wifi5gName);
        wifiCard.appendChild(wifi5gGroup);

        const wifi5gPassGroup = document.createElement('div');
        const wifi5gPassLabel = document.createElement('label');
        wifi5gPassLabel.textContent = '5 GHz Senha:';
        wifi5gPassLabel.style.cssText = labelStyle;
        const wifi5gPass = document.createElement('input');
        wifi5gPass.id = 'wifi5gPass';
        wifi5gPass.type = 'text';
        wifi5gPass.value = dados.wifi5gPass || '';
        wifi5gPass.style.cssText = inputStyle;
        wifi5gPassGroup.appendChild(wifi5gPassLabel);
        wifi5gPassGroup.appendChild(wifi5gPass);
        wifiCard.appendChild(wifi5gPassGroup);

        const wifiButtons = document.createElement('div');
        wifiButtons.style.cssText = 'display: flex; gap: 8px; margin-top: 8px;';
        const btnReadWifi = document.createElement('button');
        btnReadWifi.textContent = '📥 Ler Wi-Fi';
        btnReadWifi.className = 'twoelve-button';
        btnReadWifi.style.flex = '1';
        const btnSaveWifi2g = document.createElement('button');
        btnSaveWifi2g.textContent = '💾 Salvar 2.4';
        btnSaveWifi2g.className = 'twoelve-button';
        btnSaveWifi2g.style.flex = '1';
        const btnSaveWifi5g = document.createElement('button');
        btnSaveWifi5g.textContent = '💾 Salvar 5';
        btnSaveWifi5g.className = 'twoelve-button';
        btnSaveWifi5g.style.flex = '1';
        wifiButtons.appendChild(btnReadWifi);
        wifiButtons.appendChild(btnSaveWifi2g);
        wifiButtons.appendChild(btnSaveWifi5g);
        wifiCard.appendChild(wifiButtons);
        container.appendChild(wifiCard);

        const ppoeCard = document.createElement('div');
        ppoeCard.style.cssText = cardStyle;
        const ppoeTitle = document.createElement('div');
        ppoeTitle.textContent = '🔑 PPPoE';
        ppoeTitle.style.cssText = cardTitleStyle;
        ppoeCard.appendChild(ppoeTitle);

        const ppoeUserGroup = document.createElement('div');
        ppoeUserGroup.style.marginBottom = '10px';
        const ppoeUserLabel = document.createElement('label');
        ppoeUserLabel.textContent = 'Usuário:';
        ppoeUserLabel.style.cssText = labelStyle;
        const ppoeUser = document.createElement('input');
        ppoeUser.id = 'ppoeUser';
        ppoeUser.type = 'text';
        ppoeUser.value = dados.ppoeUser || '';
        ppoeUser.style.cssText = inputStyle;
        ppoeUserGroup.appendChild(ppoeUserLabel);
        ppoeUserGroup.appendChild(ppoeUser);
        ppoeCard.appendChild(ppoeUserGroup);

        const ppoePassGroup = document.createElement('div');
        const ppoePassLabel = document.createElement('label');
        ppoePassLabel.textContent = 'Senha:';
        ppoePassLabel.style.cssText = labelStyle;
        const ppoePass = document.createElement('input');
        ppoePass.id = 'ppoePass';
        ppoePass.type = 'text';
        ppoePass.value = dados.ppoePass || '';
        ppoePass.style.cssText = inputStyle;
        ppoePassGroup.appendChild(ppoePassLabel);
        ppoePassGroup.appendChild(ppoePass);
        ppoeCard.appendChild(ppoePassGroup);

        const ppoeButtons = document.createElement('div');
        ppoeButtons.style.cssText = 'display: flex; gap: 8px; margin-top: 8px;';
        const btnReadPpoe = document.createElement('button');
        btnReadPpoe.textContent = '📥 Ler PPPoE';
        btnReadPpoe.className = 'twoelve-button';
        btnReadPpoe.style.flex = '1';
        const btnSavePpoe = document.createElement('button');
        btnSavePpoe.textContent = '💾 Salvar';
        btnSavePpoe.className = 'twoelve-button-primary';
        btnSavePpoe.style.flex = '1';
        ppoeButtons.appendChild(btnReadPpoe);
        ppoeButtons.appendChild(btnSavePpoe);
        ppoeCard.appendChild(ppoeButtons);
        container.appendChild(ppoeCard);

        const lanCard = document.createElement('div');
        lanCard.style.cssText = cardStyle;
        const lanTitle = document.createElement('div');
        lanTitle.textContent = '📡 LAN & DHCP';
        lanTitle.style.cssText = cardTitleStyle;
        lanCard.appendChild(lanTitle);

        const dhcpGroup = document.createElement('div');
        dhcpGroup.style.marginBottom = '10px';
        const dhcpLabel = document.createElement('label');
        dhcpLabel.textContent = 'Range DHCP:';
        dhcpLabel.style.cssText = labelStyle;
        const dhcpRangeDiv = document.createElement('div');
        dhcpRangeDiv.style.cssText = 'display: flex; gap: 8px;';
        const dhcpMin = document.createElement('input');
        dhcpMin.id = 'dhcpMin';
        dhcpMin.type = 'text';
        dhcpMin.placeholder = 'Min';
        dhcpMin.value = dados.dhcpMin || '';
        dhcpMin.style.cssText = inputStyle;
        const dhcpMax = document.createElement('input');
        dhcpMax.id = 'dhcpMax';
        dhcpMax.type = 'text';
        dhcpMax.placeholder = 'Max';
        dhcpMax.value = dados.dhcpMax || '';
        dhcpMax.style.cssText = inputStyle;
        dhcpRangeDiv.appendChild(dhcpMin);
        dhcpRangeDiv.appendChild(dhcpMax);
        dhcpGroup.appendChild(dhcpLabel);
        dhcpGroup.appendChild(dhcpRangeDiv);
        lanCard.appendChild(dhcpGroup);

        const dnsPriGroup = document.createElement('div');
        dnsPriGroup.style.marginBottom = '10px';
        const dnsPriLabel = document.createElement('label');
        dnsPriLabel.textContent = 'DNS Primário:';
        dnsPriLabel.style.cssText = labelStyle;
        const dnsPri = document.createElement('input');
        dnsPri.id = 'dnsPri';
        dnsPri.type = 'text';
        dnsPri.value = dados.dnsPri || '';
        dnsPri.style.cssText = inputStyle;
        dnsPriGroup.appendChild(dnsPriLabel);
        dnsPriGroup.appendChild(dnsPri);
        lanCard.appendChild(dnsPriGroup);

        const dnsSecGroup = document.createElement('div');
        const dnsSecLabel = document.createElement('label');
        dnsSecLabel.textContent = 'DNS Secundário:';
        dnsSecLabel.style.cssText = labelStyle;
        const dnsSec = document.createElement('input');
        dnsSec.id = 'dnsSec';
        dnsSec.type = 'text';
        dnsSec.value = dados.dnsSec || '';
        dnsSec.style.cssText = inputStyle;
        dnsSecGroup.appendChild(dnsSecLabel);
        dnsSecGroup.appendChild(dnsSec);
        lanCard.appendChild(dnsSecGroup);

        const lanButtons = document.createElement('div');
        lanButtons.style.cssText = 'display: flex; gap: 8px; margin-top: 8px;';
        const btnReadLan = document.createElement('button');
        btnReadLan.textContent = '📥 Ler LAN';
        btnReadLan.className = 'twoelve-button';
        btnReadLan.style.flex = '1';
        const btnSaveLan = document.createElement('button');
        btnSaveLan.textContent = '💾 Salvar LAN';
        btnSaveLan.className = 'twoelve-button-primary';
        btnSaveLan.style.flex = '1';
        lanButtons.appendChild(btnReadLan);
        lanButtons.appendChild(btnSaveLan);
        lanCard.appendChild(lanButtons);
        container.appendChild(lanCard);

        const acoesDiv = document.createElement('div');
        acoesDiv.style.cssText = 'display: flex; gap: 8px; margin-top: 8px;';

        const btnLoginHuawei = document.createElement('button');
        btnLoginHuawei.textContent = '🔑 Login Huawei';
        btnLoginHuawei.className = 'twoelve-button';
        btnLoginHuawei.style.flex = '1';

        const btnLerTudo = document.createElement('button');
        btnLerTudo.textContent = '📥 Ler Tudo';
        btnLerTudo.className = 'twoelve-button-primary';
        btnLerTudo.style.flex = '1';

        acoesDiv.appendChild(btnLoginHuawei);
        acoesDiv.appendChild(btnLerTudo);
        container.appendChild(acoesDiv);

        modal.setConteudoElemento(container);

        btnReadWifi.addEventListener('click', async () => {
            const dados = await lerWifiExclusivo();
            wifi2gName.value = dados.wifi2gName || '';
            wifi2gPass.value = dados.wifi2gPass || '';
            wifi5gName.value = dados.wifi5gName || '';
            wifi5gPass.value = dados.wifi5gPass || '';
        });

        btnSaveWifi2g.addEventListener('click', async () => {
            await atualizarCampo('wifi2gName', wifi2gName.value);
            await atualizarCampo('wifi2gPass', wifi2gPass.value);
            alert('Wi-Fi 2.4GHz salvo!');
        });

        btnSaveWifi5g.addEventListener('click', async () => {
            await atualizarCampo('wifi5gName', wifi5gName.value);
            await atualizarCampo('wifi5gPass', wifi5gPass.value);
            alert('Wi-Fi 5GHz salvo!');
        });

        btnReadPpoe.addEventListener('click', async () => {
            const dados = await lerPPOEExclusivo();
            ppoeUser.value = dados.ppoeUser || '';
            ppoePass.value = dados.ppoePass || '';
        });

        btnSavePpoe.addEventListener('click', async () => {
            await atualizarCampo('ppoeUser', ppoeUser.value);
            await atualizarCampo('ppoePass', ppoePass.value);
            alert('PPPoE salvo!');
        });

        btnReadLan.addEventListener('click', async () => {
            const dados = await lerLanExclusivo();
            dhcpMin.value = dados.dhcpMin || '';
            dhcpMax.value = dados.dhcpMax || '';
            dnsPri.value = dados.dnsPri || '';
            dnsSec.value = dados.dnsSec || '';
        });

        btnSaveLan.addEventListener('click', async () => {
            await atualizarCampo('dhcpRange', dhcpMin.value, dhcpMax.value);
            await atualizarCampo('dnsPri', dnsPri.value);
            await atualizarCampo('dnsSec', dnsSec.value);
            alert('Configurações LAN salvas!');
        });

        btnLoginHuawei.addEventListener('click', async () => {
            btnLoginHuawei.textContent = '⏳...';
            await loginHuawei();
            btnLoginHuawei.textContent = '✅ OK';
            setTimeout(() => { btnLoginHuawei.textContent = '🔑 Login Huawei'; }, 1500);
        });

        btnLerTudo.addEventListener('click', async () => {
            btnLerTudo.textContent = '⏳ Lendo...';
            await lerTudo();
            btnLerTudo.textContent = '✅ Concluído';
            setTimeout(() => { btnLerTudo.textContent = '📥 Ler Tudo'; }, 2000);
        });

        modal.setFecharCallback(() => {
            modalAtivo = null;
            window._huaweiLoginInProgress = false;
        });
    }

    // ==============================================
    // 6. FUNÇÕES DE TOGGLE (AUTO.JS)
    // ==============================================
    window.TwoElveControle = {
        autoOverlay: true,
        autoMensagem: true,
        saudacaoMensagem: '',
        saudacaoPrevia: false,
        trocarAbaSaudacao: true
    };

    chrome.storage.local.get(['autoOverlay', 'autoMensagem', 'saudacaoMensagem', 'saudacaoPrevia', 'trocarAbaSaudacao'], (result) => {
        window.TwoElveControle.autoOverlay = result.autoOverlay !== false;
        window.TwoElveControle.autoMensagem = result.autoMensagem !== false;
        window.TwoElveControle.saudacaoMensagem = result.saudacaoMensagem || '';
        window.TwoElveControle.saudacaoPrevia = result.saudacaoPrevia === true;
        window.TwoElveControle.trocarAbaSaudacao = result.trocarAbaSaudacao !== false;
        console.log('[TwoElve] Controles carregados:', window.TwoElveControle);
    });

    chrome.runtime.onMessage.addListener((msg) => {
        if (msg && msg.action === 'twoelve-config-changed') {
            chrome.storage.local.get(['autoOverlay', 'autoMensagem', 'saudacaoMensagem', 'saudacaoPrevia', 'trocarAbaSaudacao'], (result) => {
                window.TwoElveControle.autoOverlay = result.autoOverlay !== false;
                window.TwoElveControle.autoMensagem = result.autoMensagem !== false;
                window.TwoElveControle.saudacaoMensagem = result.saudacaoMensagem || '';
                window.TwoElveControle.saudacaoPrevia = result.saudacaoPrevia === true;
                window.TwoElveControle.trocarAbaSaudacao = result.trocarAbaSaudacao !== false;
                console.log('[TwoElve] Controles atualizados pela Configuração:', window.TwoElveControle);
            });
        }
    });

    // ==============================================
    // 7. MODAL PRINCIPAL UTILS
    // ==============================================
    async function abrirModalUtils() {
        if (modalAtivo) {
            modalAtivo.fechar();
            modalAtivo = null;
            return;
        }

        const modal = new TwoelveModalBase('🛠️ Utilitários');
        modalAtivo = modal;
        modal.abrir();

        const container = document.createElement('div');
        container.style.cssText = 'display: flex; flex-direction: column; gap: 16px;';

        const botoes = [
            { text: '🔐 Login Router', action: login, class: 'twoelve-button' },
            { text: '🔑 Login (Alternativo)', action: checkLogin, class: 'twoelve-button' },
            { text: '🌐 Huawei Manager', action: abrirModalHuawei, class: 'twoelve-button-primary' },
            { text: '📍 Editar Endereço', action: criarModalEndereco, class: 'twoelve-button' }
        ];

        botoes.forEach(btnConfig => {
            const btn = document.createElement('button');
            btn.textContent = btnConfig.text;
            btn.className = btnConfig.class;
            btn.addEventListener('click', () => {
                btnConfig.action();
                if (btnConfig.action !== abrirModalHuawei && btnConfig.action !== criarModalEndereco) {
                    modal.fechar();
                    modalAtivo = null;
                }
            });
            container.appendChild(btn);
        });

        modal.setConteudoElemento(container);
        modal.setFecharCallback(() => {
            modalAtivo = null;
        });
    }

    // ==============================================
    // 8. INICIALIZAÇÃO
    // ==============================================
    (async function init() {
        window.abrirModalUtils = abrirModalUtils;
        console.log('✅ Utils.js v6.0 carregado');
    })();

})();
