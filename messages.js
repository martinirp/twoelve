// ==============================================
// MESSAGES.JS - TwoElve v6.0
// Gerenciador de Mensagens Rápidas
// ==============================================

(function() {
    // ==============================================
    // 1. STORAGE (MANTIDO ORIGINAL)
    // ==============================================
    const messageStorage = {
        customMessages: [],

        async load() {
            const result = await chrome.storage.local.get(['whitePanelMessages']);
            this.customMessages = result.whitePanelMessages || [];
            return this.customMessages;
        },

        async save() {
            await chrome.storage.local.set({ whitePanelMessages: this.customMessages });
        },

        add(name, content) {
            this.customMessages.push({
                id: 'msg-' + Date.now(),
                name: name,
                content: content
            });
            this.save();
        },

        update(id, name, content) {
            const index = this.customMessages.findIndex(m => m.id === id);
            if (index !== -1) {
                this.customMessages[index] = { ...this.customMessages[index], name, content };
                this.save();
            }
        },

        remove(id) {
            this.customMessages = this.customMessages.filter(m => m.id !== id);
            this.save();
        },

        exportConfig() {
            return { customMessages: this.customMessages };
        },

        importConfig(config) {
            if (config.customMessages) {
                this.customMessages = config.customMessages;
                this.save();
                return true;
            }
            return false;
        },

        reset() {
            this.customMessages = [];
            this.save();
        }
    };

    // ==============================================
    // 2. VARIÁVEIS
    // ==============================================
    let modalAtivo = null;

    // ==============================================
    // 3. FUNÇÃO PARA ESCREVER NO CHAT (MANTIDA ORIGINAL)
    // ==============================================
    function chat() {
        return document.querySelector('textarea[rows="1"].MuiInputBase-inputMultiline');
    }

    async function escreverNoChat(elemento, valor) {
        if (elemento && elemento.value !== valor) {
            Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set.call(elemento, valor);
            elemento.dispatchEvent(new Event('input', { bubbles: true }));
            elemento.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    // ==============================================
    // 4. MODAL PRINCIPAL - LISTA DE MENSAGENS
    // ==============================================
    async function abrirModalMensagens() {
        if (modalAtivo) {
            modalAtivo.fechar();
            modalAtivo = null;
            return;
        }

        await messageStorage.load();

        const modal = new TwoelveModalBase('💬 Mensagens Rápidas');
        modalAtivo = modal;
        modal.abrir();

        // Container principal
        const container = document.createElement('div');
        container.style.cssText = 'display: flex; flex-direction: column; gap: 20px; min-height: 350px;';

        // Grid de botões
        const gridContainer = document.createElement('div');
        gridContainer.className = 'twoelve-buttons-grid';
        gridContainer.style.maxHeight = '400px';
        gridContainer.style.overflowY = 'auto';

        // Footer com botões de ação
        const footer = document.createElement('div');
        footer.style.cssText = 'display: flex; gap: 12px; padding-top: 16px; border-top: 2px solid #000000;';

        const btnAdicionar = document.createElement('button');
        btnAdicionar.textContent = '➕ Adicionar Mensagem';
        btnAdicionar.className = 'twoelve-button-primary';

        footer.appendChild(btnAdicionar);
        container.appendChild(gridContainer);
        container.appendChild(footer);

        modal.setConteudoElemento(container);

        // Renderizar lista de mensagens
        function renderizarLista() {
            gridContainer.innerHTML = '';

            if (messageStorage.customMessages.length === 0) {
                const emptyMsg = document.createElement('div');
                emptyMsg.textContent = 'Nenhuma mensagem cadastrada. Clique em "➕ Adicionar Mensagem" para criar.';
                emptyMsg.style.cssText = 'text-align: center; padding: 40px; color: #6b7280; grid-column: 1 / -1;';
                gridContainer.appendChild(emptyMsg);
                return;
            }

            messageStorage.customMessages.forEach(msg => {
                const btn = document.createElement('button');
                btn.textContent = msg.name;
                btn.title = 'Clique para enviar | Botão direito para editar';

                btn.addEventListener('click', async () => {
                    const elementoChat = chat();
                    if (elementoChat) {
                        await escreverNoChat(elementoChat, msg.content);
                        modal.fechar();
                        modalAtivo = null;
                    } else {
                        alert('Campo de chat não encontrado na página.');
                    }
                });

                btn.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    abrirModalEditarMensagem(msg);
                });

                gridContainer.appendChild(btn);
            });
        }

        renderizarLista();

        // Eventos
        btnAdicionar.addEventListener('click', () => {
            modal.fechar();
            modalAtivo = null;
            abrirModalAdicionarMensagem();
        });

        

        modal.setFecharCallback(() => {
            modalAtivo = null;
        });
    }

    // ==============================================
    // 5. MODAL ADICIONAR MENSAGEM
    // ==============================================
    function abrirModalAdicionarMensagem() {
        if (modalAtivo) {
            modalAtivo.fechar();
            modalAtivo = null;
        }

        const modal = new TwoelveModalBase('➕ Adicionar Mensagem');
        modalAtivo = modal;
        modal.abrir();

        const container = document.createElement('div');
        container.style.cssText = 'display: flex; flex-direction: column; gap: 16px;';

        // Estilos
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

        // Nome
        const nomeGroup = document.createElement('div');
        const nomeLabel = document.createElement('label');
        nomeLabel.textContent = '🏷️ Nome do Botão:';
        nomeLabel.style.cssText = labelStyle;
        const nomeInput = document.createElement('input');
        nomeInput.type = 'text';
        nomeInput.placeholder = 'Ex: Falha Técnica, Saudação...';
        nomeInput.style.cssText = inputStyle;
        nomeGroup.appendChild(nomeLabel);
        nomeGroup.appendChild(nomeInput);
        container.appendChild(nomeGroup);

        // Conteúdo
        const conteudoGroup = document.createElement('div');
        const conteudoLabel = document.createElement('label');
        conteudoLabel.textContent = '📝 Conteúdo da Mensagem:';
        conteudoLabel.style.cssText = labelStyle;
        const conteudoInput = document.createElement('textarea');
        conteudoInput.placeholder = 'Digite a mensagem que será enviada ao chat...';
        conteudoInput.style.cssText = inputStyle + 'min-height: 150px; resize: vertical;';
        conteudoGroup.appendChild(conteudoLabel);
        conteudoGroup.appendChild(conteudoInput);
        container.appendChild(conteudoGroup);

        // Botões
        const footer = document.createElement('div');
        footer.style.cssText = 'display: flex; gap: 12px; margin-top: 8px;';

        const btnSalvar = document.createElement('button');
        btnSalvar.textContent = '✅ Salvar';
        btnSalvar.className = 'twoelve-button-primary';

        const btnCancelar = document.createElement('button');
        btnCancelar.textContent = 'Cancelar';
        btnCancelar.className = 'twoelve-button';

        footer.appendChild(btnSalvar);
        footer.appendChild(btnCancelar);
        container.appendChild(footer);

        modal.setConteudoElemento(container);

        btnSalvar.addEventListener('click', async () => {
            const nome = nomeInput.value.trim();
            const conteudo = conteudoInput.value.trim();

            if (!nome || !conteudo) {
                alert('Por favor, preencha todos os campos.');
                return;
            }

            messageStorage.add(nome, conteudo);
            modal.fechar();
            modalAtivo = null;
            await abrirModalMensagens();
        });

        btnCancelar.addEventListener('click', async () => {
            modal.fechar();
            modalAtivo = null;
            await abrirModalMensagens();
        });

        modal.setFecharCallback(async () => {
            modalAtivo = null;
            await abrirModalMensagens();
        });
    }

    // ==============================================
    // 6. MODAL EDITAR MENSAGEM
    // ==============================================
    function abrirModalEditarMensagem(msg) {
        if (!msg) return;

        if (modalAtivo) {
            modalAtivo.fechar();
            modalAtivo = null;
        }

        const modal = new TwoelveModalBase(`✏️ Editar: ${msg.name}`);
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

        // Nome
        const nomeGroup = document.createElement('div');
        const nomeLabel = document.createElement('label');
        nomeLabel.textContent = '🏷️ Nome:';
        nomeLabel.style.cssText = labelStyle;
        const nomeInput = document.createElement('input');
        nomeInput.type = 'text';
        nomeInput.value = msg.name;
        nomeInput.style.cssText = inputStyle;
        nomeGroup.appendChild(nomeLabel);
        nomeGroup.appendChild(nomeInput);
        container.appendChild(nomeGroup);

        // Conteúdo
        const conteudoGroup = document.createElement('div');
        const conteudoLabel = document.createElement('label');
        conteudoLabel.textContent = '📝 Conteúdo:';
        conteudoLabel.style.cssText = labelStyle;
        const conteudoInput = document.createElement('textarea');
        conteudoInput.value = msg.content;
        conteudoInput.style.cssText = inputStyle + 'min-height: 150px; resize: vertical;';
        conteudoGroup.appendChild(conteudoLabel);
        conteudoGroup.appendChild(conteudoInput);
        container.appendChild(conteudoGroup);

        // Botões
        const footer = document.createElement('div');
        footer.style.cssText = 'display: flex; gap: 12px; margin-top: 8px;';

        const btnSalvar = document.createElement('button');
        btnSalvar.textContent = '💾 Salvar';
        btnSalvar.className = 'twoelve-button-primary';

        const btnExcluir = document.createElement('button');
        btnExcluir.textContent = '🗑️ Excluir';
        btnExcluir.className = 'twoelve-button-danger';

        const btnCancelar = document.createElement('button');
        btnCancelar.textContent = 'Cancelar';
        btnCancelar.className = 'twoelve-button';

        footer.appendChild(btnSalvar);
        footer.appendChild(btnExcluir);
        footer.appendChild(btnCancelar);
        container.appendChild(footer);

        modal.setConteudoElemento(container);

        btnSalvar.addEventListener('click', async () => {
            const nome = nomeInput.value.trim();
            const conteudo = conteudoInput.value.trim();

            if (!nome || !conteudo) {
                alert('Por favor, preencha todos os campos.');
                return;
            }

            messageStorage.update(msg.id, nome, conteudo);
            modal.fechar();
            modalAtivo = null;
            await abrirModalMensagens();
        });

        btnExcluir.addEventListener('click', async () => {
            if (confirm(`Excluir "${msg.name}"?`)) {
                messageStorage.remove(msg.id);
                modal.fechar();
                modalAtivo = null;
                await abrirModalMensagens();
            }
        });

        btnCancelar.addEventListener('click', async () => {
            modal.fechar();
            modalAtivo = null;
            await abrirModalMensagens();
        });

        modal.setFecharCallback(async () => {
            modalAtivo = null;
            await abrirModalMensagens();
        });
    }

    // Per-module config (export/import/reset) removed — use central `abrirConfig()`

    // ==============================================
    // 8. INICIALIZAÇÃO
    // ==============================================
    (async function init() {
        // Expor função global para o sidebar.js
        window.abrirModalMensagens = abrirModalMensagens;

        console.log('✅ Messages.js v6.0 carregado');
    })();

})();