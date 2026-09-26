// ==============================================
// UTILS.JS - TwoElve v6.0
// Utilitários (Huawei, Endereço, Login, etc.)
// ==============================================

(function() {
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
        
        // Huawei Descoberto
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
        
        // Huawei
        const huaweiPasswordField = document.querySelector('#userpassword_ctrl');
        const huaweiLoginButton = document.querySelector('#loginbtn.loginbtn.common_button_long');
        
        if (huaweiPasswordField && huaweiLoginButton) {
            console.log('Encontrou campos Huawei');
            await fillField(huaweiPasswordField, 'elonet3005');
            huaweiLoginButton.click();
            return;
        }
        
        // FiberHome
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

    // Preenche um campo dentro do modal nativo do ERP e dispara eventos
    async function preencherCampoERP(selector, value) {
        if (!value) return;
        const el = document.querySelector(selector);
        if (!el) {
            console.error(`❌ Campo não encontrado: ${selector}`);
            return;
        }
        
        console.log(`✅ Campo encontrado: ${selector}. Inserindo valor: "${value}"`);
        el.focus();
        
        // Muitos frameworks (React, Vue) ignoram el.value direto. Usamos o setter nativo.
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

    // Lê o texto de endereço de uma linha da tabela
    function lerEnderecoLinha(row) {
        const cells = row.querySelectorAll('td');
        if (!cells || cells.length < 2) return '';
        // Primeira célula normalmente é o endereço+número
        return (cells[0]?.textContent || '').trim().toLowerCase();
    }

    // Clicar no ícone de lápis (editar) de uma linha
    function clicarLapisLinha(row) {
        // Tenta encontrar qualquer elemento que seja botão de editar ou o próprio ícone do lápis
        const lapiz = row.querySelector('.btn-editar') || row.querySelector('i.icon-pencil, i.fa-pencil');
        if (lapiz) {
            const clicavel = lapiz.closest('a, button, [class*="btn-editar"]') || lapiz;
            console.log('Clicando no botão de editar da linha:', clicavel);
            
            // Tenta o clique nativo e os eventos simulados
            clicavel.click();
            clicavel.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
            clicavel.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
            clicavel.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
            
            return true;
        }
        console.warn('Botão de editar não encontrado na linha:', row);
        return false;
    }

    // Aguarda o modal nativo #modalFormAddress abrir (jQuery UI dialog)
    function aguardarModalERP(maxMs = 5000) {
        return new Promise(resolve => {
            // O modal é um jQuery UI dialog: div#modalFormAddress fica dentro de div.ui-dialog
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

    // Aguarda o modal fechar
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

    // Função principal: abre modal de cada endereço, preenche e confirma
    async function processarEnderecosNaPagina(enderecoAntigo, novosDados, statusEl) {
        console.log('--- INICIANDO PROCESSAMENTO DE ENDEREÇOS ---');
        console.log('Filtro (antigo):', enderecoAntigo);
        console.log('Novos dados:', novosDados);

        const filtrarTodos = enderecoAntigo.trim().toUpperCase() === 'TODOS';
        let processados = 0;
        let encontrados = 0;
        
        // Em vez de pegar todas as linhas uma vez só, pegamos a quantidade total e iteramos.
        // O ERP recarrega a tabela (AJAX) após cada salvamento, então os elementos <tr> ficam obsoletos.
        // Precisamos buscar o <tr> novamente a cada iteração.
        const getRows = () => Array.from(document.querySelectorAll('table tbody tr')).filter(r => r.querySelector('a.btn-editar') || r.querySelector('i.icon-pencil, i.fa-pencil'));
        
        let initialRows = getRows();
        if (initialRows.length === 0) {
            console.warn('Nenhuma linha de endereço com botão editar foi encontrada.');
            statusEl.textContent = '⚠️ Nenhum endereço com botão de editar encontrado na página.';
            return;
        }

        console.log(`Total de linhas de endereço encontradas inicialmente: ${initialRows.length}`);
        let limit = initialRows.length; // Quantidade de linhas para processar
        let rowIndex = 0;

        while (rowIndex < limit) {
            // Busca as linhas fresquinhas do DOM
            const currentRows = getRows();
            if (rowIndex >= currentRows.length) {
                console.log('A tabela diminuiu de tamanho ou sumiu. Parando.');
                break;
            }

            const row = currentRows[rowIndex];
            const textoLinha = lerEnderecoLinha(row);
            console.log(`Linha ${rowIndex} texto extraído: "${textoLinha}"`);

            // Se não bate com o filtro, só avança pra próxima linha
            if (!filtrarTodos && !textoLinha.includes(enderecoAntigo.trim().toLowerCase())) {
                console.log(`Linha ${rowIndex} ignorada (não corresponde ao filtro).`);
                rowIndex++;
                continue;
            }

            encontrados++;
            statusEl.textContent = `🔄 Processando endereço ${encontrados}...`;
            console.log(`Processando linha ${rowIndex} (Encontrado #${encontrados})`);

            // Clica no lápis para abrir o modal de edição
            const clicou = clicarLapisLinha(row);
            if (!clicou) {
                console.warn(`Não foi possível clicar no botão editar na linha ${rowIndex}`);
                rowIndex++;
                continue;
            }

            console.log('Aguardando modal ERP abrir...');
            const modal = await aguardarModalERP(5000);
            if (!modal) {
                console.warn(`Modal não abriu no tempo esperado para linha ${rowIndex}`);
                rowIndex++;
                continue;
            }
            console.log('Modal aberto com sucesso!');

            // O pulo do gato: o ERP faz uma requisição AJAX para buscar os dados do endereço.
            // Se o nosso robô digitar rápido demais, o ERP apaga o nosso texto quando a requisição termina.
            // Vamos aguardar o campo "Rua" ser preenchido com o endereço antigo antes de sobreescrevermos.
            console.log('Aguardando carregamento dos dados do servidor...');
            let tentativasCarregamento = 0;
            while (tentativasCarregamento < 25) { // Espera até 5 segundos
                const streetField = document.querySelector('#PeopleAddressStreet');
                if (streetField && streetField.value.trim().length > 0) {
                    break;
                }
                await wait(200);
                tentativasCarregamento++;
            }
            await wait(500); // Uma pequena margem de segurança após o carregamento

            // Preenche os campos
            if (novosDados.rua)       await preencherCampoERP('#PeopleAddressStreet',          novosDados.rua);
            if (novosDados.numero)    await preencherCampoERP('#PeopleAddressNumber',           novosDados.numero);
            if (novosDados.bairro)    await preencherCampoERP('#PeopleAddressNeighborhood',     novosDados.bairro);
            if (novosDados.cidade)    await preencherCampoERP('#PeopleAddressCity',             novosDados.cidade);
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
                await wait(1000); // aguarda 1 segundo inteiro para a tabela recarregar com ajax
                
                // --- VERIFICAÇÃO SE ALTEROU ---
                // Pegamos a linha novamente para checar se o novo texto está lá
                const verifyRows = getRows();
                if (rowIndex < verifyRows.length) {
                    const textoLinhaVerify = lerEnderecoLinha(verifyRows[rowIndex]);
                    if (novosDados.rua && !textoLinhaVerify.includes(novosDados.rua.trim().toLowerCase())) {
                        console.error(`⚠️ O endereço na linha ${rowIndex} falhou na verificação final (esperava: ${novosDados.rua}).`);
                        statusEl.textContent = `⚠️ Atenção: A rua "${novosDados.rua}" parece não ter sido salva pelo ERP.`;
                    }
                }
                
                processados++;
            } else {
                console.warn('Botão Confirmar não encontrado no modal ERP');
                document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
                await aguardarModalFechar(3000);
            }
            
            // Independente de sucesso ou erro, avançamos o índice para não ficar num loop infinito
            // Caso a ordenação mude muito, isso pode pular alguns. Mas garante que não trava.
            rowIndex++;
        }

        if (processados === 0 && encontrados === 0) {
            statusEl.textContent = `⚠️ Nenhum endereço correspondente a "${enderecoAntigo}" encontrado.`;
        } else {
            statusEl.textContent = `✅ ${processados} endereço(s) atualizado(s) com sucesso!`;
        }
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

        // Info
        const info = document.createElement('div');
        info.style.cssText = 'font-size: 12px; color: #6b7280; padding: 8px 12px; background: #f3f4f6; border-left: 3px solid #000;';
        info.textContent = 'Digite "TODOS" em Endereço Antigo para atualizar todos os endereços da lista, ou informe parte do endereço para filtrar.';
        container.appendChild(info);

        // Campo: Endereço Antigo
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

        // Campos novos
        const camposConfig = [
            { id: 'rua',       label: '🏠 Rua:',        placeholder: 'Ex: Rua André Gotty' },
            { id: 'numero',    label: '🔢 Número:',      placeholder: 'Ex: 82' },
            { id: 'bairro',    label: '🏘️ Bairro:',     placeholder: 'Ex: Centro' },
            { id: 'cidade',    label: '🌆 Cidade:',      placeholder: 'Ex: São João Nepomuceno' },
            { id: 'referencia',label: '📍 Referência:',  placeholder: 'Ex: Próximo ao mercado' }
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

        // Botão confirmar
        const btnConfirmar = document.createElement('button');
        btnConfirmar.textContent = '✅ Atualizar Endereços';
        btnConfirmar.className = 'twoelve-button-primary';

        btnConfirmar.addEventListener('click', async () => {
            const enderecoAntigo = endAntigoInput.value.trim();
            if (!enderecoAntigo) {
                statusEl.textContent = '⚠️ Informe o endereço antigo ou "TODOS".';
                return;
            }

            const novosDados = {
                rua:        campos.rua.value.trim(),
                numero:     campos.numero.value.trim(),
                bairro:     campos.bairro.value.trim(),
                cidade:     campos.cidade.value.trim(),
                referencia: campos.referencia.value.trim()
            };

            const algumPreenchido = Object.values(novosDados).some(v => v.length > 0);
            if (!algumPreenchido) {
                statusEl.textContent = '⚠️ Preencha ao menos um campo novo.';
                return;
            }

            btnConfirmar.disabled = true;
            btnConfirmar.textContent = '⏳ Processando...';

            await processarEnderecosNaPagina(enderecoAntigo, novosDados, statusEl);

            btnConfirmar.disabled = false;
            btnConfirmar.textContent = '✅ Atualizar Endereços';
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
        
        // Wi-Fi Section
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
        
        // PPPoE Section
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
        
        // LAN Section
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
        
        // Ações gerais
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
        
        // Eventos
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
        autoMensagem: true
    };
    
    chrome.storage.local.get(['autoOverlay', 'autoMensagem'], (result) => {
        window.TwoElveControle.autoOverlay = result.autoOverlay !== false;
        window.TwoElveControle.autoMensagem = result.autoMensagem !== false;
        console.log('[TwoElve] Controles carregados:', window.TwoElveControle);
    });

    // Atualiza os controles quando a página de Configurações muda as automações
    chrome.runtime.onMessage.addListener((msg) => {
        if (msg && msg.action === 'twoelve-config-changed') {
            chrome.storage.local.get(['autoOverlay', 'autoMensagem'], (result) => {
                window.TwoElveControle.autoOverlay = result.autoOverlay !== false;
                window.TwoElveControle.autoMensagem = result.autoMensagem !== false;
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
        
        // Botões principais
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
        
        // Toggles de automação removidos — agora ficam na página de Configurações.

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