// ==============================================
// VISIT.JS - TwoElve v6.0 (CORRIGIDO)
// Gerenciador de Visitas Técnicas
// ==============================================

(function() {
    // ==============================================
    // 1. STORAGE
    // ==============================================
    const storage = {
        visits: [],
        
        async load() {
            const result = await chrome.storage.local.get(['customVisits']);
            this.visits = result.customVisits || [];
            return this.visits;
        },
        
        async save() {
            await chrome.storage.local.set({ customVisits: this.visits });
        },
        
        add(visit) {
            this.visits.push({
                id: 'visit-' + Date.now(),
                ...visit
            });
            this.save();
        },
        
        update(id, updates) {
            const index = this.visits.findIndex(v => v.id === id);
            if (index !== -1) {
                this.visits[index] = { ...this.visits[index], ...updates };
                this.save();
            }
        },
        
        remove(id) {
            this.visits = this.visits.filter(v => v.id !== id);
            this.save();
        },
        
        exportConfig() {
            return { customVisits: this.visits };
        },
        
        importConfig(config) {
            if (config.customVisits) {
                this.visits = config.customVisits;
                this.save();
                return true;
            }
            return false;
        },
        
        reset() {
            this.visits = [];
            this.save();
        }
    };
    
    // ==============================================
    // 2. VARIÁVEIS
    // ==============================================
    let modalAtivo = null;
    
    // ==============================================
    // 3. FUNÇÃO PARA PREENCHER ENDEREÇO NO SISTEMA
    // ==============================================

    
    // ==============================================
    // 4. MODAL PRINCIPAL - LISTA DE VISITAS
    // ==============================================
    async function abrirModalVisitas() {
        if (modalAtivo) {
            modalAtivo.fechar();
            modalAtivo = null;
            return;
        }
        
        await storage.load();
        
        const modal = new TwoelveModalBase('🚗 Visitas Técnicas');
        modalAtivo = modal;
        modal.abrir();
        
        const container = document.createElement('div');
        container.style.cssText = 'display: flex; flex-direction: column; gap: 20px; min-height: 350px;';
        
        const gridContainer = document.createElement('div');
        gridContainer.className = 'twoelve-buttons-grid';
        
        const footer = document.createElement('div');
        footer.style.cssText = 'display: flex; gap: 12px; padding-top: 16px; border-top: 2px solid #000000;';
        
        const btnAdicionar = document.createElement('button');
        btnAdicionar.textContent = '➕ Adicionar Visita';
        btnAdicionar.className = 'twoelve-button-primary';
        
        footer.appendChild(btnAdicionar);
        container.appendChild(gridContainer);
        container.appendChild(footer);
        
        modal.setConteudoElemento(container);
        
        function renderizarLista() {
            gridContainer.innerHTML = '';
            
            if (storage.visits.length === 0) {
                const emptyMsg = document.createElement('div');
                emptyMsg.textContent = 'Nenhuma visita cadastrada. Clique em "➕ Adicionar Visita" para criar.';
                emptyMsg.style.cssText = 'text-align: center; padding: 40px; color: #6b7280; grid-column: 1 / -1;';
                gridContainer.appendChild(emptyMsg);
                return;
            }
            
            storage.visits.forEach(visit => {
                const btn = document.createElement('button');
                btn.textContent = visit.name;
                btn.title = 'Clique para executar | Botão direito para editar';
                
                btn.addEventListener('click', async () => {
                    modal.fechar();
                    modalAtivo = null;
                    await abrirModalExecutarVisita(visit);
                });
                
                btn.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    abrirModalEditarVisita(visit);
                });
                
                gridContainer.appendChild(btn);
            });
        }
        
        renderizarLista();
        
        btnAdicionar.addEventListener('click', () => {
            modal.fechar();
            modalAtivo = null;
            abrirModalAdicionarVisita();
        });
        
        
        
        modal.setFecharCallback(() => {
            modalAtivo = null;
        });
    }
    
    // ==============================================
    // 5. MODAL EXECUTAR VISITA
    // ==============================================
    async function abrirModalExecutarVisita(visit) {
        if (modalAtivo) {
            modalAtivo.fechar();
            modalAtivo = null;
        }
        
        const modal = new TwoelveModalBase(`🚗 ${visit.name}`);
        modalAtivo = modal;
        modal.abrir();
        
        const style = document.createElement('style');
        style.textContent = `
            .visit-form-group { margin-bottom: 16px; }
            .visit-form-label {
                display: block;
                margin-bottom: 6px;
                font-weight: 600;
                font-size: 11px;
                color: #4b5563;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .visit-form-input, .visit-form-select, .visit-form-textarea {
                width: 100%;
                padding: 10px 12px;
                border: 2px solid #000000;
                background: var(--modal-custom-bg, #ffffff);
                color: var(--modal-custom-text, #1f2937);
                font-family: inherit;
                font-size: 13px;
                box-sizing: border-box;
            }
            .visit-form-textarea {
                min-height: 80px;
                resize: vertical;
            }
            .visit-description-box {
                padding: 12px;
                background: #f3f4f6;
                border: 2px solid #000000;
                font-size: 13px;
                line-height: 1.5;
            }
            .visit-row {
                display: flex;
                gap: 12px;
                margin-bottom: 16px;
            }
            .visit-row > * {
                flex: 1;
            }
        `;
        document.head.appendChild(style);
        
        const container = document.createElement('div');
        container.style.cssText = 'display: flex; flex-direction: column; gap: 16px;';
        
        const locations = window.CONFIG_LOCATIONS || [];
        
        const locGroup = document.createElement('div');
        locGroup.className = 'visit-form-group';
        const locLabel = document.createElement('label');
        locLabel.className = 'visit-form-label';
        locLabel.textContent = '📍 Localização:';
        const locSelect = document.createElement('select');
        locSelect.className = 'visit-form-select';
        const blankOption = document.createElement('option');
        blankOption.value = '';
        blankOption.textContent = '-- Selecione a localização --';
        locSelect.appendChild(blankOption);
        locations.forEach(loc => {
            const option = document.createElement('option');
            option.value = loc;
            option.textContent = loc;
            locSelect.appendChild(option);
        });
        locGroup.appendChild(locLabel);
        locGroup.appendChild(locSelect);
        container.appendChild(locGroup);
        
        const descGroup = document.createElement('div');
        descGroup.className = 'visit-form-group';
        const descLabel = document.createElement('label');
        descLabel.className = 'visit-form-label';
        descLabel.textContent = '📋 Descrição:';
        const descBox = document.createElement('div');
        descBox.className = 'visit-description-box';
        descBox.textContent = visit.description;
        descGroup.appendChild(descLabel);
        descGroup.appendChild(descBox);
        container.appendChild(descGroup);
        
        // Campo Contexto - APENAS LEITURA (disabled)
        const ctxGroup = document.createElement('div');
        ctxGroup.className = 'visit-form-group';
        const ctxLabel = document.createElement('label');
        ctxLabel.className = 'visit-form-label';
        ctxLabel.textContent = '📂 Contexto:';
        const ctxInput = document.createElement('input');
        ctxInput.className = 'visit-form-input';
        ctxInput.placeholder = 'Ex: 3.4 - Desconexão';
        ctxInput.value = visit.context || '';
        ctxInput.disabled = true;
        ctxInput.style.background = '#f3f4f6';
        ctxInput.style.cursor = 'not-allowed';
        ctxGroup.appendChild(ctxLabel);
        ctxGroup.appendChild(ctxInput);
        container.appendChild(ctxGroup);
        
        const obsGroup = document.createElement('div');
        obsGroup.className = 'visit-form-group';
        const obsLabel = document.createElement('label');
        obsLabel.className = 'visit-form-label';
        obsLabel.textContent = '📝 Observação:';
        const obsInput = document.createElement('textarea');
        obsInput.className = 'visit-form-textarea';
        obsInput.placeholder = 'Digite as observações...';
        obsGroup.appendChild(obsLabel);
        obsGroup.appendChild(obsInput);
        container.appendChild(obsGroup);
        
        let enderecoAntigoInput, enderecoNovoContainer;

        if (visit.type === 'mudança') {
            // Endereço antigo
            const endAntigoGroup = document.createElement('div');
            endAntigoGroup.className = 'visit-form-group';
            const endAntigoLabel = document.createElement('label');
            endAntigoLabel.className = 'visit-form-label';
            endAntigoLabel.textContent = '🏠 Endereço Antigo:';
            enderecoAntigoInput = document.createElement('input');
            enderecoAntigoInput.className = 'visit-form-input';
            enderecoAntigoInput.placeholder = 'Digite o endereço antigo...';
            endAntigoGroup.appendChild(endAntigoLabel);
            endAntigoGroup.appendChild(enderecoAntigoInput);
            container.appendChild(endAntigoGroup);

            // Endereço novo com sub-campos e label
            enderecoNovoContainer = document.createElement('div');
            enderecoNovoContainer.className = 'visit-form-group';

            const endNovoHeader = document.createElement('div');
            endNovoHeader.style.cssText = 'display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;';
            const endNovoTitulo = document.createElement('label');
            endNovoTitulo.className = 'visit-form-label';
            endNovoTitulo.style.margin = '0';
            endNovoTitulo.textContent = '🏠 Endereço Novo:';

            const tipoResidenciaWrap = document.createElement('div');
            tipoResidenciaWrap.style.cssText = 'display: flex; gap: 12px; align-items: center;';
            let tipoResidenciaSelecionado = 'casa';

            const makeTipoRadio = (label, valor) => {
                const lbl = document.createElement('label');
                lbl.style.cssText = 'display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; cursor: pointer;';
                const radio = document.createElement('input');
                radio.type = 'radio';
                radio.name = 'tipoResidencia_exec';
                radio.value = valor;
                if (valor === 'casa') radio.checked = true;
                radio.addEventListener('change', () => { tipoResidenciaSelecionado = valor; });
                lbl.appendChild(radio);
                lbl.appendChild(document.createTextNode(label));
                return lbl;
            };
            tipoResidenciaWrap.appendChild(makeTipoRadio('Casa', 'casa'));
            tipoResidenciaWrap.appendChild(makeTipoRadio('Apartamento', 'apartamento'));

            endNovoHeader.appendChild(endNovoTitulo);
            endNovoHeader.appendChild(tipoResidenciaWrap);
            enderecoNovoContainer.appendChild(endNovoHeader);

            // Row com sub-campos + sub-labels
            const endNovoRow = document.createElement('div');
            endNovoRow.style.cssText = 'display: flex; gap: 8px; width: 100%;';

            const makeSubField = (labelText, placeholder, flex) => {
                const wrap = document.createElement('div');
                wrap.style.cssText = `flex: ${flex}; display: flex; flex-direction: column; gap: 4px;`;
                const lbl = document.createElement('label');
                lbl.textContent = labelText;
                lbl.style.cssText = 'font-size: 11px; font-weight: 600; color: #4b5563; text-transform: uppercase; letter-spacing: 0.4px;';
                const input = document.createElement('input');
                input.className = 'visit-form-input';
                input.placeholder = placeholder;
                wrap.appendChild(lbl);
                wrap.appendChild(input);
                endNovoRow.appendChild(wrap);
                return input;
            };

            const ruaInput    = makeSubField('Rua',    'Ex: Rua das Flores', 3);
            const numeroInput = makeSubField('Número', 'Ex: 123',            1);
            const bairroInput = makeSubField('Bairro', 'Ex: Centro',         2);
            const cidadeInput = makeSubField('Cidade', 'Ex: Mar de Espanha', 2);

            enderecoNovoContainer.appendChild(endNovoRow);
            container.appendChild(enderecoNovoContainer);

            enderecoNovoContainer._fields = {
                ruaInput, numeroInput, bairroInput, cidadeInput,
                getTipo: () => tipoResidenciaSelecionado
            };
        } else {
            const endGroup = document.createElement('div');
            endGroup.className = 'visit-form-group';
            const endLabel = document.createElement('label');
            endLabel.className = 'visit-form-label';
            endLabel.textContent = '🏠 Endereço:';
            const endInput = document.createElement('input');
            endInput.className = 'visit-form-input';
            endInput.placeholder = 'Digite o endereço...';
            endGroup.appendChild(endLabel);
            endGroup.appendChild(endInput);
            container.appendChild(endGroup);
            enderecoAntigoInput = endInput;
        }
        
        const refGroup = document.createElement('div');
        refGroup.className = 'visit-form-group';
        const refLabel = document.createElement('label');
        refLabel.className = 'visit-form-label';
        refLabel.textContent = '📍 Referência:';
        const refInput = document.createElement('input');
        refInput.className = 'visit-form-input';
        refInput.placeholder = 'Ponto de referência...';
        refGroup.appendChild(refLabel);
        refGroup.appendChild(refInput);
        container.appendChild(refGroup);
        
        const contatoGroup = document.createElement('div');
        contatoGroup.className = 'visit-form-group';
        const contatoLabel = document.createElement('label');
        contatoLabel.className = 'visit-form-label';
        contatoLabel.textContent = '📞 Contato:';
        const contatoInput = document.createElement('input');
        contatoInput.className = 'visit-form-input';
        contatoInput.placeholder = '(00) 00000-0000';
        contatoGroup.appendChild(contatoLabel);
        contatoGroup.appendChild(contatoInput);
        container.appendChild(contatoGroup);
        
        const btnConfirmar = document.createElement('button');
        btnConfirmar.textContent = '✅ Confirmar Visita';
        btnConfirmar.className = 'twoelve-button-primary';
        
        btnConfirmar.addEventListener('click', async () => {
            const localizacao = locSelect.value;
            const contexto = ctxInput.value;
            const obs = obsInput.value.trim();
            const referencia = refInput.value.trim();
            const contato = contatoInput.value.trim();
            
            if (!localizacao) {
                alert('Por favor, selecione uma localização antes de confirmar.');
                locSelect.focus();
                return;
            }
            
            const descSemNumeros = visit.description.replace(/^[\d.]+\s*[-–]\s*/, '').trim();
            let mensagem = `Descrição: ${descSemNumeros}\n`;
            mensagem += `Obs: ${obs}\n`;
            
            if (visit.type === 'mudança') {
                const enderecoAntigo = enderecoAntigoInput?.value.trim() || '';
                mensagem += `Endereço Antigo: ${enderecoAntigo}\n`;

                if (enderecoNovoContainer?._fields) {
                    const f = enderecoNovoContainer._fields;
                    const rua    = f.ruaInput.value.trim();
                    const numero = f.numeroInput.value.trim();
                    const bairro = f.bairroInput.value.trim();
                    const cidade = f.cidadeInput.value.trim();
                    const tipo   = f.getTipo();
                    const enderecoNovo = `${rua} , ${numero} , ${bairro} , ${cidade}`;
                    mensagem += `Endereço Novo: ${enderecoNovo}\n`;

                }
            } else {
                const endereco = enderecoAntigoInput?.value.trim() || '';
                mensagem += `Endereço: ${endereco}\n`;
            }
            
            mensagem += `Referência: ${referencia}\n`;
            mensagem += `Contato: ${contato}`;
            
            if (window.selecionarContexto) {
                await window.selecionarContexto(
                    contexto,
                    mensagem,
                    "Visita Técnica",
                    localizacao
                );
            } else {
                console.log('Mensagem da visita:', mensagem);
                alert('Função selecionarContexto não disponível. Verifique o console.');
            }
            
            modal.fechar();
            modalAtivo = null;
        });
        
        container.appendChild(btnConfirmar);
        modal.setConteudoElemento(container);
        
        modal.setFecharCallback(() => {
            modalAtivo = null;
            if (style.parentNode) style.remove();
        });
    }
    
    // ==============================================
    // 6. MODAL ADICIONAR VISITA
    // ==============================================
    function abrirModalAdicionarVisita() {
        if (modalAtivo) {
            modalAtivo.fechar();
            modalAtivo = null;
        }
        
        const modal = new TwoelveModalBase('➕ Adicionar Visita');
        modalAtivo = modal;
        modal.abrir();
        
        const style = document.createElement('style');
        style.textContent = `
            .visit-add-group { margin-bottom: 16px; }
            .visit-add-label {
                display: block;
                margin-bottom: 6px;
                font-weight: 600;
                font-size: 11px;
                color: #4b5563;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .visit-add-input, .visit-add-textarea {
                width: 100%;
                padding: 10px 12px;
                border: 2px solid #000000;
                background: var(--modal-custom-bg, #ffffff);
                font-family: inherit;
                font-size: 13px;
                box-sizing: border-box;
            }
            .visit-add-textarea { min-height: 80px; resize: vertical; }
            .visit-type-buttons { display: flex; gap: 12px; margin: 8px 0; }
            
            .visit-type-btn {
                flex: 1;
                padding: 14px 16px;
                font-size: 0.95em;
                font-weight: 600;
                background: var(--modal-custom-btn-bg, #ffffff) !important;
                color: var(--modal-custom-btn-text, #1a1a1a) !important;
                border: 3px solid var(--modal-custom-border, #000000) !important;
                border-radius: 0px;
                cursor: pointer;
                text-align: center;
                transition: all 0.1s linear;
                font-family: var(--modal-custom-font-family, 'Inter', sans-serif) !important;
                box-shadow: 3px 3px 0px var(--modal-custom-btn-border, #000000) !important;
            }
            
            .visit-type-btn.inactive {
                opacity: 0.6;
                transform: scale(0.98);
            }
            
            .visit-type-btn.active {
                background: var(--modal-custom-border, #000000) !important;
                color: var(--modal-custom-bg, #ffffff) !important;
                border-color: var(--modal-custom-border, #000000) !important;
                box-shadow: 5px 5px 0px var(--modal-custom-border, #000000) !important;
                transform: scale(1.02);
                font-weight: 700;
            }
            
            .visit-type-btn.active:hover {
                box-shadow: 6px 6px 0px var(--modal-custom-border, #000000) !important;
                transform: scale(1.02) translate(-1px, -1px);
            }
        `;
        document.head.appendChild(style);
        
        const container = document.createElement('div');
        container.style.cssText = 'display: flex; flex-direction: column; gap: 16px;';
        
        const nomeGroup = document.createElement('div');
        nomeGroup.className = 'visit-add-group';
        const nomeLabel = document.createElement('label');
        nomeLabel.className = 'visit-add-label';
        nomeLabel.textContent = '🏷️ Nome do Botão:';
        const nomeInput = document.createElement('input');
        nomeInput.className = 'visit-add-input';
        nomeInput.placeholder = 'Ex: Desconexão, Visita Técnica...';
        nomeGroup.appendChild(nomeLabel);
        nomeGroup.appendChild(nomeInput);
        container.appendChild(nomeGroup);
        
        const tipoGroup = document.createElement('div');
        tipoGroup.className = 'visit-add-group';
        const tipoLabel = document.createElement('label');
        tipoLabel.className = 'visit-add-label';
        tipoLabel.textContent = '📂 Tipo:';
        const tipoButtons = document.createElement('div');
        tipoButtons.className = 'visit-type-buttons';
        const btnVisita = document.createElement('button');
        btnVisita.textContent = '🚗 Visita';
        btnVisita.className = 'visit-type-btn active';
        const btnMudanca = document.createElement('button');
        btnMudanca.textContent = '🚚 Mudança';
        btnMudanca.className = 'visit-type-btn inactive';
        let tipoSelecionado = 'visita';
        
        btnVisita.addEventListener('click', () => {
            tipoSelecionado = 'visita';
            btnVisita.className = 'visit-type-btn active';
            btnMudanca.className = 'visit-type-btn inactive';
        });
        btnMudanca.addEventListener('click', () => {
            tipoSelecionado = 'mudança';
            btnMudanca.className = 'visit-type-btn active';
            btnVisita.className = 'visit-type-btn inactive';
        });
        
        tipoButtons.appendChild(btnVisita);
        tipoButtons.appendChild(btnMudanca);
        tipoGroup.appendChild(tipoLabel);
        tipoGroup.appendChild(tipoButtons);
        container.appendChild(tipoGroup);
        
        const ctxGroup = document.createElement('div');
        ctxGroup.className = 'visit-add-group';
        const ctxLabel = document.createElement('label');
        ctxLabel.className = 'visit-add-label';
        ctxLabel.textContent = '📂 Contexto:';
        const ctxInput = document.createElement('input');
        ctxInput.className = 'visit-add-input';
        ctxInput.placeholder = 'Ex: 3.4 - Desconexão';
        ctxGroup.appendChild(ctxLabel);
        ctxGroup.appendChild(ctxInput);
        container.appendChild(ctxGroup);
        
        const descGroup = document.createElement('div');
        descGroup.className = 'visit-add-group';
        const descLabel = document.createElement('label');
        descLabel.className = 'visit-add-label';
        descLabel.textContent = '📝 Descrição Fixa:';
        const descInput = document.createElement('textarea');
        descInput.className = 'visit-add-textarea';
        descInput.placeholder = 'Descrição que aparecerá no modal...';
        descGroup.appendChild(descLabel);
        descGroup.appendChild(descInput);
        container.appendChild(descGroup);
        
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
            const contexto = ctxInput.value.trim();
            const descricao = descInput.value.trim();
            
            if (!nome || !contexto || !descricao) {
                alert('Por favor, preencha todos os campos (Nome, Contexto e Descrição).');
                return;
            }
            
            storage.add({
                name: nome,
                type: tipoSelecionado,
                context: contexto,
                description: descricao
            });
            
            modal.fechar();
            modalAtivo = null;
            await abrirModalVisitas();
            
            if (style.parentNode) style.remove();
        });
        
        btnCancelar.addEventListener('click', async () => {
            modal.fechar();
            modalAtivo = null;
            await abrirModalVisitas();
            if (style.parentNode) style.remove();
        });
        
        modal.setFecharCallback(async () => {
            modalAtivo = null;
            if (style.parentNode) style.remove();
            await abrirModalVisitas();
        });
    }
    
    // ==============================================
    // 7. MODAL EDITAR VISITA
    // ==============================================
    function abrirModalEditarVisita(visit) {
        if (!visit) return;
        
        if (modalAtivo) {
            modalAtivo.fechar();
            modalAtivo = null;
        }
        
        const modal = new TwoelveModalBase(`✏️ Editar: ${visit.name}`);
        modalAtivo = modal;
        modal.abrir();
        
        const style = document.createElement('style');
        style.textContent = `
            .visit-edit-group { margin-bottom: 16px; }
            .visit-edit-label {
                display: block;
                margin-bottom: 6px;
                font-weight: 600;
                font-size: 11px;
                color: #4b5563;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .visit-edit-input, .visit-edit-textarea {
                width: 100%;
                padding: 10px 12px;
                border: 2px solid #000000;
                background: var(--modal-custom-bg, #ffffff);
                font-family: inherit;
                font-size: 13px;
                box-sizing: border-box;
            }
            .visit-edit-textarea { min-height: 80px; resize: vertical; }
            .visit-edit-buttons { display: flex; gap: 12px; margin-top: 8px; }
            
            .visit-type-btn {
                flex: 1;
                padding: 14px 16px;
                font-size: 0.95em;
                font-weight: 600;
                background: var(--modal-custom-btn-bg, #ffffff) !important;
                color: var(--modal-custom-btn-text, #1a1a1a) !important;
                border: 3px solid var(--modal-custom-border, #000000) !important;
                border-radius: 0px;
                cursor: pointer;
                text-align: center;
                transition: all 0.1s linear;
                font-family: var(--modal-custom-font-family, 'Inter', sans-serif) !important;
                box-shadow: 3px 3px 0px var(--modal-custom-btn-border, #000000) !important;
            }
            
            .visit-type-btn.inactive {
                opacity: 0.6;
                transform: scale(0.98);
            }
            
            .visit-type-btn.active {
                background: var(--modal-custom-border, #000000) !important;
                color: var(--modal-custom-bg, #ffffff) !important;
                border-color: var(--modal-custom-border, #000000) !important;
                box-shadow: 5px 5px 0px var(--modal-custom-border, #000000) !important;
                transform: scale(1.02);
                font-weight: 700;
            }
            
            .visit-type-btn.active:hover {
                box-shadow: 6px 6px 0px var(--modal-custom-border, #000000) !important;
                transform: scale(1.02) translate(-1px, -1px);
            }
        `;
        document.head.appendChild(style);
        
        const container = document.createElement('div');
        container.style.cssText = 'display: flex; flex-direction: column; gap: 16px;';
        
        const nomeGroup = document.createElement('div');
        nomeGroup.className = 'visit-edit-group';
        const nomeLabel = document.createElement('label');
        nomeLabel.className = 'visit-edit-label';
        nomeLabel.textContent = '🏷️ Nome:';
        const nomeInput = document.createElement('input');
        nomeInput.className = 'visit-edit-input';
        nomeInput.value = visit.name;
        nomeGroup.appendChild(nomeLabel);
        nomeGroup.appendChild(nomeInput);
        container.appendChild(nomeGroup);
        
        const tipoGroup = document.createElement('div');
        tipoGroup.className = 'visit-edit-group';
        const tipoLabel = document.createElement('label');
        tipoLabel.className = 'visit-edit-label';
        tipoLabel.textContent = '📂 Tipo:';
        const tipoButtons = document.createElement('div');
        tipoButtons.style.cssText = 'display: flex; gap: 12px;';
        const btnVisita = document.createElement('button');
        btnVisita.textContent = '🚗 Visita';
        const btnMudanca = document.createElement('button');
        btnMudanca.textContent = '🚚 Mudança';
        let tipoSelecionado = visit.type || 'visita';
        
        const atualizarBotoes = () => {
            btnVisita.className = tipoSelecionado === 'visita' ? 'visit-type-btn active' : 'visit-type-btn inactive';
            btnMudanca.className = tipoSelecionado === 'mudança' ? 'visit-type-btn active' : 'visit-type-btn inactive';
        };
        
        btnVisita.addEventListener('click', () => {
            tipoSelecionado = 'visita';
            atualizarBotoes();
        });
        btnMudanca.addEventListener('click', () => {
            tipoSelecionado = 'mudança';
            atualizarBotoes();
        });
        
        tipoButtons.appendChild(btnVisita);
        tipoButtons.appendChild(btnMudanca);
        tipoGroup.appendChild(tipoLabel);
        tipoGroup.appendChild(tipoButtons);
        container.appendChild(tipoGroup);
        atualizarBotoes();
        
        const ctxGroup = document.createElement('div');
        ctxGroup.className = 'visit-edit-group';
        const ctxLabel = document.createElement('label');
        ctxLabel.className = 'visit-edit-label';
        ctxLabel.textContent = '📂 Contexto:';
        const ctxInput = document.createElement('input');
        ctxInput.className = 'visit-edit-input';
        ctxInput.value = visit.context || '';
        ctxGroup.appendChild(ctxLabel);
        ctxGroup.appendChild(ctxInput);
        container.appendChild(ctxGroup);
        
        const descGroup = document.createElement('div');
        descGroup.className = 'visit-edit-group';
        const descLabel = document.createElement('label');
        descLabel.className = 'visit-edit-label';
        descLabel.textContent = '📝 Descrição:';
        const descInput = document.createElement('textarea');
        descInput.className = 'visit-edit-textarea';
        descInput.value = visit.description;
        descGroup.appendChild(descLabel);
        descGroup.appendChild(descInput);
        container.appendChild(descGroup);
        
        const footer = document.createElement('div');
        footer.className = 'visit-edit-buttons';
        
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
            const contexto = ctxInput.value.trim();
            const descricao = descInput.value.trim();
            
            if (!nome || !contexto || !descricao) {
                alert('Por favor, preencha todos os campos (Nome, Contexto e Descrição).');
                return;
            }
            
            storage.update(visit.id, {
                name: nome,
                type: tipoSelecionado,
                context: contexto,
                description: descricao
            });
            
            modal.fechar();
            modalAtivo = null;
            await abrirModalVisitas();
            if (style.parentNode) style.remove();
        });
        
        btnExcluir.addEventListener('click', async () => {
            if (confirm(`Excluir "${visit.name}"?`)) {
                storage.remove(visit.id);
                modal.fechar();
                modalAtivo = null;
                await abrirModalVisitas();
                if (style.parentNode) style.remove();
            }
        });
        
        btnCancelar.addEventListener('click', async () => {
            modal.fechar();
            modalAtivo = null;
            await abrirModalVisitas();
            if (style.parentNode) style.remove();
        });
        
        modal.setFecharCallback(async () => {
            modalAtivo = null;
            if (style.parentNode) style.remove();
            await abrirModalVisitas();
        });
    }
    
    // Per-module config (export/import/reset) removed — use central `abrirConfig()`
    
    // ==============================================
    // 9. INICIALIZAÇÃO
    // ==============================================
    window.abrirModalVisitas = abrirModalVisitas;
    
    console.log('✅ Visit.js v6.0 carregado');
    
})();