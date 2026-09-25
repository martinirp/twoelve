// ==============================================
// FORWARD.JS - TwoElve v6.0
// Gerenciador de Encaminhamentos
// ==============================================

(function() {
    // ==============================================
    // 1. STORAGE
    // ==============================================
    const forwardStorage = {
        items: [],
        
        async load() {
            const result = await chrome.storage.local.get(['forwardButtons']);
            this.items = result.forwardButtons || this.getDefaults();
            return this.items;
        },
        
        async save() {
            await chrome.storage.local.set({ forwardButtons: this.items });
        },
        
        getDefaults() {
            return [
                { id: 'fwd-1', text: 'Enc. Suporte', action: 'encaminhamento', setor: '2.1 - Suporte' },
                { id: 'fwd-2', text: 'Enc. Faturamento', action: 'encaminhamento', setor: '4.1 - Faturamento' },
                { id: 'fwd-3', text: 'Enc. Vendas', action: 'encaminhamento', setor: '3.1 - Comercial' }
            ];
        },
        
        reset() {
            this.items = this.getDefaults();
            this.save();
        },
        
        add(text, setor) {
            this.items.push({
                id: 'fwd-' + Date.now(),
                text: text,
                action: 'encaminhamento',
                setor: setor
            });
            this.save();
        },
        
        update(id, text, setor) {
            const index = this.items.findIndex(i => i.id === id);
            if (index !== -1) {
                this.items[index] = { ...this.items[index], text, setor };
                this.save();
            }
        },
        
        remove(id) {
            this.items = this.items.filter(i => i.id !== id);
            this.save();
        }
    };
    
    // ==============================================
    // 2. VARIÁVEIS
    // ==============================================
    let modalAtivo = null;
    
    // ==============================================
    // 3. FUNÇÕES AUXILIARES
    // ==============================================
    async function esperar(delayMs) {
        return new Promise(resolve => setTimeout(resolve, delayMs));
    }
    
    async function waitForElement(selector, maxTime = 5000, checkInterval = 100) {
        const startTime = Date.now();
        while (Date.now() - startTime < maxTime) {
            const element = document.querySelector(selector);
            if (element && element.offsetParent !== null) {
                return element;
            }
            await esperar(checkInterval);
        }
        return null;
    }
    
    async function waitForButton(buttonText, maxTime = 5000) {
        const startTime = Date.now();
        while (Date.now() - startTime < maxTime) {
            const botoes = document.querySelectorAll('button');
            for (const btn of botoes) {
                if (btn.textContent.trim() === buttonText && btn.offsetParent !== null && !btn.disabled) {
                    return btn;
                }
            }
            await esperar(100);
        }
        return null;
    }
    
    async function clicarNoNao() {
        let botaoNao = await waitForButton("Não", 3000);
        if (!botaoNao) {
            botaoNao = document.querySelector('button.MuiButton-outlinedSecondary');
        }
        if (botaoNao && botaoNao.offsetParent !== null) {
            botaoNao.click();
            return true;
        }
        return false;
    }
    
    async function selecionarSetor(setor) {
        try {
            const teamInput = await waitForElement('#teamId', 5000);
            if (!teamInput) {
                return false;
            }
            if (window.selecionarValor) {
                await window.selecionarValor(teamInput, setor);
            } else {
                teamInput.focus();
                teamInput.value = setor;
                teamInput.dispatchEvent(new Event('input', { bubbles: true }));
                teamInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
            return true;
        } catch (error) {
            return false;
        }
    }
    
    async function selecionarStatus(status) {
        try {
            const statusInput = await waitForElement('#incidentStatusId', 5000);
            if (!statusInput) return false;
            if (window.selecionarValor) {
                await window.selecionarValor(statusInput, status);
            }
            return true;
        } catch (error) {
            return false;
        }
    }
    
    async function selecionarMotivo() {
        try {
            const motivoInput = await waitForElement('#solicitationRoutingMotiveId', 5000);
            if (!motivoInput) return false;
            if (window.selecionarValor) {
                await window.selecionarValor(motivoInput, "1002 - Encaminhamento");
            }
            return true;
        } catch (error) {
            return false;
        }
    }
    
    async function limparResponsavel() {
        try {
            const responsavelInput = await waitForElement('#responsibleId', 4000);
            if (!responsavelInput) {
                return false;
            }
            const autocompleteRoot = responsavelInput.closest('.MuiAutocomplete-root');
            if (!autocompleteRoot) {
                return false;
            }
            autocompleteRoot.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
            await esperar(150);
            const clearBtn = autocompleteRoot.querySelector(
                'button.MuiAutocomplete-clearIndicator, button[title="Clear"], button[aria-label="Clear"]'
            );
            if (clearBtn) {
                clearBtn.click();
                return true;
            }
            return false;
        } catch (error) {
            return false;
        }
    }
    
    async function escreverRelato(msg) {
        try {
            if (window.escreverRelato && window.escreverRelato !== escreverRelato) {
                return await window.escreverRelato(msg);
            }
            const relatos = document.querySelectorAll('.ql-editor');
            relatos.forEach(relato => {
                relato.innerHTML = msg;
                relato.dispatchEvent(new Event('input', { bubbles: true }));
                relato.dispatchEvent(new Event('change', { bubbles: true }));
            });
            return true;
        } catch (e) {
            return false;
        }
    }

    // ==============================================
    // HELPER: verifica e corrige botão do grupo
    // ==============================================
    async function verificarECorrigirBotaoGrupo() {
        const botoesGrupo = document.querySelectorAll('[role="group"] button');
        if (botoesGrupo && botoesGrupo.length > 0) {
            const botao1 = botoesGrupo[0];
            if (!botao1.classList.contains('jss34')) {
                botao1.click();
                await esperar(300);
                return true;
            }
            return true;
        }
        return false;
    }
    
    // ==============================================
    // 4. FUNÇÃO PRINCIPAL DE ENCAMINHAMENTO
    // ==============================================
    async function encaminhamento(setor) {
        try {
            // PASSO 1: Categoria
            if (window.setCategoriaUI) {
                await window.setCategoriaUI(false);
            } else if (window.categoriaFuncWrapper) {
                await window.categoriaFuncWrapper('Suporte');
            }

            // PASSO 2: Classificação
            const classifInput = await waitForElement('#solicitationClassificationId', 6000);
            if (classifInput) {
                if (window.selecionarValor) {
                    await window.selecionarValor(classifInput, '4.0.3 - Transferência de setor');
                } else {
                    classifInput.focus();
                    classifInput.value = '4.0.3 - Transferência de setor';
                    classifInput.dispatchEvent(new Event('input', { bubbles: true }));
                    classifInput.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }

            // PASSO 3: Escrever "." no relato
            await escreverRelato(".");
            await esperar(500);

            // PASSO 4: Clicar Não (se existir)
            await clicarNoNao();

            // PASSO 5: Verificar e corrigir botão do grupo antes de Avançar
            await verificarECorrigirBotaoGrupo();

            // PASSO 6: Clicar em Avançar
            const avancarBtn = await waitForButton("Avançar", 5000);
            if (avancarBtn) {
                avancarBtn.click();
                await esperar(1000);
            }

            // PASSO 7: Status Andamento
            await selecionarStatus("Andamento");
            await esperar(500);

            // PASSO 8: Abrir modal Encaminhar
            const openerBtn = await waitForButton("Encaminhar", 3000);
            if (openerBtn) {
                openerBtn.click();
                await esperar(800);
            } else {
                const primBotoes = document.querySelectorAll('.MuiButton-containedPrimary');
                if (primBotoes && primBotoes.length > 0) {
                    primBotoes[primBotoes.length - 1].click();
                    await esperar(300);
                    await verificarECorrigirBotaoGrupo();
                }
            }

            // PASSO 9: Setor
            await selecionarSetor(setor);
            await esperar(800);

            // PASSO 10: Limpar responsável
            await limparResponsavel();
            await esperar(300);

            // PASSO 11: Motivo
            await selecionarMotivo();
            await esperar(500);

            // PASSO 12: Confirmar
            const btnFinal = Array.from(document.querySelectorAll('.MuiDialogActions-root button'))
                .find(b => b.textContent.trim() === 'Encaminhar' || b.textContent.trim() === 'Confirmar');

            if (btnFinal) {
                btnFinal.click();
            } else {
                const primBotoes = document.querySelectorAll('.MuiButton-containedPrimary');
                if (primBotoes.length > 0) {
                    primBotoes[primBotoes.length - 1].click();
                    await esperar(300);
                    await verificarECorrigirBotaoGrupo();
                }
            }
        } catch (error) {
            // Silently fail
        }
    }
    
    // ==============================================
    // 5. MODAL PRINCIPAL - LISTA DE ENCAMINHAMENTOS
    // ==============================================
    async function abrirModalEncaminhar() {
        if (modalAtivo) {
            modalAtivo.fechar();
            modalAtivo = null;
            return;
        }
        
        await forwardStorage.load();
        
        const modal = new TwoelveModalBase('📤 Encaminhamentos');
        modalAtivo = modal;
        modal.abrir();
        
        const container = document.createElement('div');
        container.style.cssText = 'display: flex; flex-direction: column; gap: 20px; min-height: 350px;';
        
        const gridContainer = document.createElement('div');
        gridContainer.className = 'twoelve-buttons-grid';
        
        const footer = document.createElement('div');
        footer.style.cssText = 'display: flex; gap: 12px; padding-top: 16px; border-top: 2px solid #000000;';
        
        const btnAdicionar = document.createElement('button');
        btnAdicionar.textContent = '➕ Adicionar';
        btnAdicionar.className = 'twoelve-button-primary';
        
        const btnReset = document.createElement('button');
        btnReset.textContent = '↺ Reset Padrão';
        btnReset.className = 'twoelve-button';
        
        footer.appendChild(btnAdicionar);
        footer.appendChild(btnReset);
        container.appendChild(gridContainer);
        container.appendChild(footer);
        
        modal.setConteudoElemento(container);
        
        function renderizarLista() {
            gridContainer.innerHTML = '';
            
            if (forwardStorage.items.length === 0) {
                const emptyMsg = document.createElement('div');
                emptyMsg.textContent = 'Nenhum encaminhamento cadastrado. Clique em "➕ Adicionar" para criar.';
                emptyMsg.style.cssText = 'text-align: center; padding: 40px; color: #6b7280; grid-column: 1 / -1;';
                gridContainer.appendChild(emptyMsg);
                return;
            }
            
            forwardStorage.items.forEach(item => {
                const btn = document.createElement('button');
                btn.textContent = item.text;
                btn.title = 'Clique para encaminhar | Botão direito para editar';
                
                btn.addEventListener('click', async () => {
                    modal.fechar();
                    modalAtivo = null;
                    await encaminhamento(item.setor);
                });
                
                btn.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    abrirModalEditarEncaminhamento(item);
                });
                
                gridContainer.appendChild(btn);
            });
        }
        
        renderizarLista();
        
        btnAdicionar.addEventListener('click', () => {
            modal.fechar();
            modalAtivo = null;
            abrirModalAdicionarEncaminhamento();
        });
        
        btnReset.addEventListener('click', async () => {
            if (confirm('Restaurar os botões padrão de encaminhamento?')) {
                forwardStorage.reset();
                renderizarLista();
            }
        });
        
        modal.setFecharCallback(() => {
            modalAtivo = null;
        });
    }
    
    // ==============================================
    // 6. MODAL ADICIONAR ENCAMINHAMENTO
    // ==============================================
    function abrirModalAdicionarEncaminhamento() {
        if (modalAtivo) {
            modalAtivo.fechar();
            modalAtivo = null;
        }
        
        const modal = new TwoelveModalBase('➕ Adicionar Encaminhamento');
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
        
        // Nome do botão
        const nomeGroup = document.createElement('div');
        const nomeLabel = document.createElement('label');
        nomeLabel.textContent = '🏷️ Nome do Botão:';
        nomeLabel.style.cssText = labelStyle;
        const nomeInput = document.createElement('input');
        nomeInput.type = 'text';
        nomeInput.placeholder = 'Ex: Enc. Comercial';
        nomeInput.style.cssText = inputStyle;
        nomeGroup.appendChild(nomeLabel);
        nomeGroup.appendChild(nomeInput);
        container.appendChild(nomeGroup);
        
        // Setor
        const setorGroup = document.createElement('div');
        const setorLabel = document.createElement('label');
        setorLabel.textContent = '🏢 Setor de Destino:';
        setorLabel.style.cssText = labelStyle;
        const setorInput = document.createElement('input');
        setorInput.type = 'text';
        setorInput.placeholder = 'Ex: 3.1 - Comercial';
        setorInput.style.cssText = inputStyle;
        setorGroup.appendChild(setorLabel);
        setorGroup.appendChild(setorInput);
        container.appendChild(setorGroup);
        
        // Botões
        const footer = document.createElement('div');
        footer.style.cssText = 'display: flex; gap: 12px; margin-top: 8px;';
        
        const btnSalvar = document.createElement('button');
        btnSalvar.textContent = '✅ Adicionar';
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
            const setor = setorInput.value.trim();
            
            if (!nome || !setor) {
                alert('Por favor, preencha todos os campos.');
                return;
            }
            
            forwardStorage.add(nome, setor);
            modal.fechar();
            modalAtivo = null;
            await abrirModalEncaminhar();
        });
        
        btnCancelar.addEventListener('click', async () => {
            modal.fechar();
            modalAtivo = null;
            await abrirModalEncaminhar();
        });
        
        modal.setFecharCallback(async () => {
            modalAtivo = null;
            await abrirModalEncaminhar();
        });
    }
    
    // ==============================================
    // 7. MODAL EDITAR ENCAMINHAMENTO
    // ==============================================
    function abrirModalEditarEncaminhamento(item) {
        if (!item) return;
        
        if (modalAtivo) {
            modalAtivo.fechar();
            modalAtivo = null;
        }
        
        const modal = new TwoelveModalBase(`✏️ Editar: ${item.text}`);
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
        nomeInput.value = item.text;
        nomeInput.style.cssText = inputStyle;
        nomeGroup.appendChild(nomeLabel);
        nomeGroup.appendChild(nomeInput);
        container.appendChild(nomeGroup);
        
        // Setor
        const setorGroup = document.createElement('div');
        const setorLabel = document.createElement('label');
        setorLabel.textContent = '🏢 Setor:';
        setorLabel.style.cssText = labelStyle;
        const setorInput = document.createElement('input');
        setorInput.type = 'text';
        setorInput.value = item.setor;
        setorInput.placeholder = 'Ex: 2.1 - Suporte';
        setorInput.style.cssText = inputStyle;
        setorGroup.appendChild(setorLabel);
        setorGroup.appendChild(setorInput);
        container.appendChild(setorGroup);
        
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
            const setor = setorInput.value.trim();
            
            if (!nome || !setor) {
                alert('Por favor, preencha todos os campos.');
                return;
            }
            
            forwardStorage.update(item.id, nome, setor);
            modal.fechar();
            modalAtivo = null;
            await abrirModalEncaminhar();
        });
        
        btnExcluir.addEventListener('click', async () => {
            if (confirm(`Excluir "${item.text}"?`)) {
                forwardStorage.remove(item.id);
                modal.fechar();
                modalAtivo = null;
                await abrirModalEncaminhar();
            }
        });
        
        btnCancelar.addEventListener('click', async () => {
            modal.fechar();
            modalAtivo = null;
            await abrirModalEncaminhar();
        });
        
        modal.setFecharCallback(async () => {
            modalAtivo = null;
            await abrirModalEncaminhar();
        });
    }
    
    // ==============================================
    // 8. INICIALIZAÇÃO
    // ==============================================
    (async function init() {
        window.abrirModalEncaminhar = abrirModalEncaminhar;
    })();
    
})();