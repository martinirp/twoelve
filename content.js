// ==============================================
// CONTENT.JS - TwoElve v6.0
// ==============================================

window.CONFIG_LOCATIONS = [
    "Carlos Alves-Rio Novo-Goiana-Piau",
    "Desc-Guarani-Pirauba-RP-Rodeiro-Ad-Gui",
    "Mar de Espanha",
    "Maripa-Guarara-Bicas-Rochedo",
    "São João Nepomuceno"
];

function esperar(delayMs) {
    return new Promise(resolve => setTimeout(resolve, delayMs));
}

function observeDOM(conditionFn, maxTime = 10000) {
    return new Promise(resolve => {
        const initialCheck = conditionFn();
        if (initialCheck) return resolve(initialCheck);

        const observer = new MutationObserver(() => {
            const result = conditionFn();
            if (result) {
                observer.disconnect();
                clearTimeout(timeoutId);
                resolve(result);
            }
        });

        observer.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true });

        const timeoutId = setTimeout(() => {
            observer.disconnect();
            resolve(null);
        }, maxTime);
    });
}

async function waitForElement(selector, maxTime = 10000) {
    const el = await observeDOM(() => {
        const element = document.querySelector(selector);
        return (element && element.offsetParent !== null) ? element : null;
    }, maxTime);
    if (!el) console.warn(`Elemento não encontrado: ${selector}`);
    return el;
}

async function waitForEnabled(selector, maxTime = 5000) {
    return observeDOM(() => {
        const element = document.querySelector(selector);
        return (element && !element.disabled && element.offsetParent !== null) ? element : null;
    }, maxTime);
}

function normalizarTexto(texto) {
    return String(texto || '')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}

async function waitForOption(optionText, maxTime = 3000) {
    const alvo = normalizarTexto(optionText);
    return observeDOM(() => {
        const options = document.querySelectorAll('[role="option"], .MuiAutocomplete-option, .MuiMenuItem-root');
        for (const opt of options) {
            if (normalizarTexto(opt.textContent).includes(alvo) && opt.offsetParent !== null) return opt;
        }
        return null;
    }, maxTime);
}

async function waitForExactOption(optionText, maxTime = 3000) {
    const alvo = normalizarTexto(optionText);
    return observeDOM(() => {
        const options = document.querySelectorAll('[role="option"], .MuiAutocomplete-option, .MuiMenuItem-root');
        for (const opt of options) {
            if (opt.offsetParent !== null && normalizarTexto(opt.textContent) === alvo) return opt;
        }
        return null;
    }, maxTime);
}

async function waitForButton(buttonText, maxTime = 5000) {
    return observeDOM(() => {
        const botoes = document.querySelectorAll('button');
        for (const btn of botoes) {
            if (btn.textContent.trim() === buttonText && btn.offsetParent !== null && !btn.disabled) return btn;
        }
        return null;
    }, maxTime);
}

async function waitForRelatoWritten(expectedText = null, maxTime = 5000) {
    return observeDOM(() => {
        const relatos = document.querySelectorAll('.ql-editor');
        if (relatos.length === 0) return null;
        const filledAll = Array.from(relatos).every(rel => {
            const texto = rel.innerText || rel.textContent || '';
            return expectedText ? texto.includes(expectedText) : texto.trim().length > 0;
        });
        return filledAll ? relatos[0] : null;
    }, maxTime);
}

async function selecionarValor(inputElement, valorDesejado) {
    try {
        if (!inputElement) throw new Error('InputElement inválido');
        const alvo = normalizarTexto(valorDesejado);
        const autocomplete = inputElement.closest('.MuiAutocomplete-root') || inputElement.closest('.MuiFormControl-root');
        if (!autocomplete) throw new Error('Container do Autocomplete não encontrado');

        const abrir = () => {
            inputElement.focus();
            const openButton = autocomplete.querySelector('[aria-label="Open"], .MuiAutocomplete-popupIndicator');
            if (openButton && !openButton.disabled) openButton.click();
            else inputElement.click();
        };

        const escreverBusca = () => {
            const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
            setter.call(inputElement, valorDesejado);
            inputElement.dispatchEvent(new InputEvent('input', {
                bubbles: true,
                inputType: 'insertText',
                data: valorDesejado
            }));
        };

        for (let tentativa = 0; tentativa < 3; tentativa++) {
            abrir();
            await esperar(150);
            escreverBusca();

            const opcao = await waitForExactOption(valorDesejado, 2500);
            if (opcao) {
                // MUI confirma a opção no mouseDown; click sozinho pode só fechar a lista.
                opcao.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                opcao.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                opcao.click();
            } else {
                // Fallback sem alterar o value diretamente: o teclado passa pelo estado do React.
                inputElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', code: 'ArrowDown', bubbles: true }));
                inputElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
            }

            const confirmado = await observeDOM(() => {
                const valorAtual = normalizarTexto(inputElement.value);
                return valorAtual === alvo ? inputElement : null;
            }, 1800);
            if (confirmado) {
                console.log(`✅ Valor selecionado: ${valorDesejado} → "${inputElement.value}"`);
                return true;
            }

            // Limpa a busca antes de tentar novamente, sem fabricar uma seleção.
            const clearButton = autocomplete.querySelector('button[aria-label="Clear"], button[title="Clear"], .MuiAutocomplete-clearIndicator');
            if (clearButton) clearButton.click();
            await esperar(250);
        }

        console.warn(`❌ Não foi possível confirmar a opção no Autocomplete: ${valorDesejado}`);
        return false;
    } catch (error) {
        console.error('selecionarValor erro:', error && error.message);
        return false;
    }
}

async function escreverRelatoNaInstancia(editorEl, msg) {
    try {
        const container = editorEl.closest('.dx-htmleditor');
        if (container && window.$) {
            const dxInstance = window.$(container).dxHtmlEditor('instance');
            if (dxInstance && typeof dxInstance.option === 'function') {
                dxInstance.option('value', msg);
                return true;
            }
        }
    } catch (e) {}

    try {
        const qlContainer = editorEl.closest('.ql-container') || editorEl.parentElement;
        const quill = qlContainer && qlContainer.__quill;
        if (quill) {
            quill.root.innerHTML = msg;
            quill.update();
            return true;
        }
    } catch (e) {}

    try {
        editorEl.focus();
        document.execCommand('selectAll', false, null);
        document.execCommand('insertHTML', false, msg);
        editorEl.dispatchEvent(new Event('input', { bubbles: true }));
        editorEl.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
    } catch (e) {
        return false;
    }
}

async function escreverRelato(msg) {
    try {
        const primeira = await waitForElement('.ql-editor', 5000);
        if (!primeira) return false;

        const fim = Date.now() + 4000;
        const escritos = new Set();

        const escreverAtuais = () => {
            let alterou = false;
            document.querySelectorAll('.ql-editor').forEach(rel => {
                if (!escritos.has(rel)) {
                    escreverRelatoNaInstancia(rel, msg);
                    escritos.add(rel);
                    alterou = true;
                }
            });
            return alterou;
        };

        await new Promise((resolve) => {
            let quietTimer = null;
            const check = () => {
                if (Date.now() >= fim) return resolve();
                if (escreverAtuais()) {
                    // editor novo apareceu — aguarda quietude para pegar os demais
                    clearTimeout(quietTimer);
                    quietTimer = setTimeout(check, 150);
                    return;
                }
                resolve();
            };
            check();
        });

        await waitForRelatoWritten(msg.substring(0, 20), 3000);
        return true;
    } catch (e) {
        console.error('escreverRelato erro', e);
        return false;
    }
}

async function verificarEReescreverRelato(msg, tentativas = 3) {
    for (let i = 0; i < tentativas; i++) {
        const relatos = document.querySelectorAll('.ql-editor');
        const inicio = msg.substring(0, 30);
        const ok = relatos.length > 0 && Array.from(relatos).every(rel => {
            const texto = rel.innerText || rel.textContent || '';
            return texto.includes(inicio);
        });

        if (ok) {
            console.log('✅ Relato verificado, conteúdo OK');
            return true;
        }

        console.warn(`⚠️ Relato apagado! Tentativa ${i + 1} de reescrever...`);
        for (const relato of relatos) {
            await escreverRelatoNaInstancia(relato, msg);
            await esperar(300);
        }
        await esperar(300);
    }

    console.error('❌ Não foi possível manter o relato após várias tentativas');
    return false;
}

function getCategory() { return document.querySelector('#serviceCategoryId1'); }
function getStatus() { return document.querySelector('#incidentStatusId'); }
function getTeam() { return document.querySelector('#teamId'); }
function getResponsibleInput() { return document.querySelector('#responsibleId'); }
function getMotivo() { return document.querySelector('#solicitationRoutingMotiveId'); }
function getNoButton() { return document.querySelector('button.MuiButton-outlinedSecondary span.MuiButton-label div span'); }

async function setCategoriaUI(categoria) {
    try {
        // Aceita o texto livre da categoria; mantém compatibilidade com chamadas antigas (false → Suporte)
        const valor = (typeof categoria === 'string' && categoria.trim()) ? categoria.trim() : "Suporte";
        const catEl = getCategory();
        if (!catEl) return false;
        await selecionarValor(catEl, valor);
        return true;
    } catch (e) {
        return false;
    }
}

async function categoriaFuncWrapper(categoriaParam) {
    try {
        if (typeof categoriaParam === 'string' && categoriaParam.trim()) {
            await setCategoriaUI(categoriaParam);
        } else {
            await setCategoriaUI("Suporte");
        }
        return true;
    } catch (e) {
        return false;
    }
}

async function problemaGenerico() {
    const problemEl = document.querySelector('input#solicitationProblemId');
    if (!problemEl) return false;
    await selecionarValor(problemEl, "1 - Problema Genérico");
    return true;
}

async function selecionarStatus(status) {
    const statusEl = getStatus();
    if (!statusEl) return false;
    await selecionarValor(statusEl, status);
    return true;
}

async function selecionarEquipe() {
    const teamEl = getTeam();
    if (!teamEl) return false;
    await selecionarValor(teamEl, "6.1 - Técnica");
    return true;
}

async function selecionarResponsavel(nomeResponsavel) {
    const respEl = getResponsibleInput();
    if (!respEl) return false;
    await selecionarValor(respEl, nomeResponsavel);
    return true;
}

async function selecionarMotivo() {
    const motivoEl = getMotivo();
    if (!motivoEl) return false;
    await selecionarValor(motivoEl, "1002 - Encaminhamento");
    return true;
}

function selecionarBotaoPorTexto(texto) {
    const botoes = document.querySelectorAll('.MuiButton-containedPrimary');
    for (const botao of botoes) {
        if ((botao.textContent || '').trim() === texto) return botao;
    }
    return null;
}

async function caixaDeTextoPadrao() {
    try {
        const no = getNoButton();
        if (no) no.click();
    } catch (e) {}
    return true;
}

async function escreverNoChat(elemento, valor) {
    if (elemento && elemento.value !== valor) {
        Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set.call(elemento, valor);
        elemento.dispatchEvent(new Event('input', { bubbles: true }));
        elemento.dispatchEvent(new Event('change', { bubbles: true }));
    }
}

async function enviarMensagemChat(mensagem) {
    try {
        const campoChat = document.querySelector('textarea[rows="1"].MuiInputBase-inputMultiline');
        if (!campoChat) return false;

        await escreverNoChat(campoChat, mensagem);
        await esperar(100);

        const botaoEnviar = document.querySelector('button[type="submit"][tooltip="Enviar mensagem"]');
        if (botaoEnviar) {
            botaoEnviar.click();
            await esperar(200);
            return true;
        }
        return false;
    } catch (error) {
        return false;
    }
}

async function finalizarOuEncaminhar(comando, localizacao, mensagemRelato) {
    try {
        // ✅ Verifica se o relato ainda está preenchido antes de avançar
        if (mensagemRelato) {
            await verificarEReescreverRelato(mensagemRelato);
        }

        let avancarBtn = await waitForButton("Avançar", 5000);
        if (!avancarBtn) avancarBtn = selecionarBotaoPorTexto("Avançar");
        if (avancarBtn) avancarBtn.click();

        if (comando) {
            const statusInput = await waitForElement('#incidentStatusId', 3000);
            if (statusInput) await selecionarValor(statusInput, "Andamento");

            let btnEncaminharOpener = await waitForButton("Encaminhar", 3000);
            if (btnEncaminharOpener) btnEncaminharOpener.click();

            const teamInput = await waitForElement('#teamId', 3000);
            if (teamInput && !await selecionarValor(teamInput, "6.1 - Técnica")) return false;

            if (localizacao) {
                const respInput = await waitForElement('#responsibleId', 3000);
                if (!respInput || !await selecionarValor(respInput, localizacao)) {
                    console.error(`❌ Responsável não confirmado no ERP: ${localizacao}`);
                    return false;
                }
            }

            const motivoInput = await waitForElement('#solicitationRoutingMotiveId', 3000);
            if (motivoInput && !await selecionarValor(motivoInput, "1002 - Encaminhamento")) return false;

            const btnFinal = await observeDOM(() => {
                return Array.from(document.querySelectorAll('.MuiDialogActions-root button'))
                    .find(b => (b.textContent.trim() === 'Encaminhar' || b.textContent.trim() === 'Confirmar') && !b.disabled && b.offsetParent !== null) || null;
            }, 5000);
            if (btnFinal) btnFinal.click();
            return true;
        } else {
            const statusEl = await waitForElement('#incidentStatusId', 5000);
            if (statusEl) await selecionarValor(statusEl, "Encerramento");

            let btnEncerrar = await waitForButton("Encerrar Atendimento", 5000);
            if (btnEncerrar) btnEncerrar.click();

            let btnConcluir = await waitForButton("Concluir este atendimento", 5000);
            if (btnConcluir) btnConcluir.click();
            return true;
        }
    } catch (e) {
        return false;
    }
}

async function selecionarContexto(contexto, mensagem, categoria, localizacao) {
    try {
        const textoCategoria = String(categoria || "").trim();
        const isVisita = textoCategoria === "Visita Técnica";

        await categoriaFuncWrapper(categoria);
        await escreverRelato(mensagem);

        const ctxEl = await waitForElement('input#solicitationClassificationId', 5000);
        if (ctxEl) await selecionarValor(ctxEl, contexto);

        await caixaDeTextoPadrao();

        const problemEl = await waitForElement('input#solicitationProblemId', 5000);
        if (problemEl) await selecionarValor(problemEl, "1 - Problema Genérico");

        await finalizarOuEncaminhar(isVisita, localizacao, mensagem);
        return true;
    } catch (e) {
        return false;
    }
}

function adicionarOverlayCopiaNome() {
    const containers = document.querySelectorAll('.MuiBox-root');
    containers.forEach(container => {
        const labelCliente = container.querySelector('span.MuiTypography-body1.MuiTypography-noWrap');
        if (labelCliente && labelCliente.textContent.trim() === 'Cliente') {
            const linkNome = container.querySelector('a.MuiLink-root.MuiLink-underlineHover');
            if (linkNome && !linkNome.dataset.overlayAdded) {
                linkNome.dataset.overlayAdded = 'true';
                linkNome.style.position = 'relative';
                linkNome.style.cursor = 'pointer';

                const overlay = document.createElement('div');
                overlay.style.cssText = `
                    position: absolute;
                    top: -4px; left: -4px; right: -4px; bottom: -4px;
                    background: rgba(0,123,255,0.1);
                    border: 2px dashed #007bff;
                    border-radius: 4px;
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity 0.2s ease;
                `;

                linkNome.appendChild(overlay);
                linkNome.addEventListener('mouseenter', () => overlay.style.opacity = '1');
                linkNome.addEventListener('mouseleave', () => overlay.style.opacity = '0');

                linkNome.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const nomeCliente = linkNome.textContent.trim();
                    try {
                        await navigator.clipboard.writeText(nomeCliente);
                        overlay.style.background = 'rgba(115,103,240,0.2)';
                        overlay.style.border = '2px solid #7367f0';
                        setTimeout(() => {
                            overlay.style.background = 'rgba(0,123,255,0.1)';
                            overlay.style.border = '2px dashed #007bff';
                        }, 1000);
                    } catch (err) {}
                });
            }
        }
    });
}

let customButtons = [];
let modalAtivo = null;

async function carregarCustomButtons() {
    const result = await chrome.storage.local.get(['customButtons']);
    customButtons = result.customButtons || [];
}

async function salvarCustomButtons() {
    await chrome.storage.local.set({ customButtons: customButtons });
}

function renderizarBotoesNoModal(container) {
    if (!container) return;
    container.innerHTML = '';

    if (customButtons.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.textContent = 'Nenhum botão cadastrado. Clique em "➕ Adicionar" para criar.';
        emptyMsg.style.cssText = `text-align: center; padding: 40px 20px; color: #6b7280; font-size: 13px;`;
        container.appendChild(emptyMsg);
        return;
    }

    const grid = document.createElement('div');
    grid.className = 'twoelve-buttons-grid';

    customButtons.forEach(botao => {
        const btn = document.createElement('button');
        btn.textContent = botao.nome;
        btn.title = 'Clique para executar | Botão direito para editar';

        btn.addEventListener('click', async () => {
            if (modalAtivo) {
                modalAtivo.fechar();
                modalAtivo = null;
            }
            await executarBotao(botao);
        });

        btn.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            abrirModalEditarBotao(botao);
        });

        grid.appendChild(btn);
    });

    container.appendChild(grid);
}

async function executarBotao(botao) {
    const categoriaParam = botao.categoria || 'Suporte';
    const loc = botao.localizacao || null;

    if (botao.mensagemChat) {
        await enviarMensagemChat(botao.mensagemChat);
    }

    if (botao.tipo === 'definido' && botao.mensagemPadrao) {
        await selecionarContexto(botao.contexto, botao.mensagemPadrao, categoriaParam, loc);
    } else {
        const modal = new TwoelveModalBase(`📝 ${botao.nome}`);
        modalAtivo = modal;
        modal.abrir();

        const content = document.createElement('div');
        content.style.cssText = `display: flex; flex-direction: column; gap: 16px;`;

        const label = document.createElement('label');
        label.textContent = `Relato para ${botao.nome}:`;
        label.style.cssText = `font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #4b5563; margin-bottom: 6px; display: block;`;

        const textarea = document.createElement('textarea');
        textarea.placeholder = 'Digite o relato...';
        textarea.style.cssText = `width: 100%; min-height: 120px; padding: 10px 12px; border: 1px solid #ccc; font-size: 13px; resize: vertical; box-sizing: border-box;`;

        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `display: flex; gap: 12px; margin-top: 8px;`;

        const confirmBtn = document.createElement('button');
        confirmBtn.textContent = 'Executar';
        confirmBtn.className = 'twoelve-button-primary';

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancelar';
        cancelBtn.className = 'twoelve-button';

        buttonContainer.appendChild(confirmBtn);
        buttonContainer.appendChild(cancelBtn);

        content.appendChild(label);
        content.appendChild(textarea);
        content.appendChild(buttonContainer);

        modal.setConteudoElemento(content);

        confirmBtn.addEventListener('click', async () => {
            const relato = textarea.value.trim();
            if (!relato) {
                alert('Digite um relato');
                return;
            }
            modal.fechar();
            modalAtivo = null;
            await selecionarContexto(botao.contexto, relato, categoriaParam, loc);
        });

        cancelBtn.addEventListener('click', () => {
            modal.fechar();
            modalAtivo = null;
        });

        modal.setFecharCallback(() => {
            modalAtivo = null;
        });
    }
}

async function abrirModalSuporte() {
    await carregarCustomButtons();

    const modal = new TwoelveModalBase('✅ Botões de Suporte');
    modalAtivo = modal;
    modal.abrir();

    const content = document.createElement('div');
    content.style.cssText = `display: flex; flex-direction: column; gap: 20px; min-height: 300px;`;

    const botoesContainer = document.createElement('div');
    botoesContainer.style.cssText = `flex: 1; padding-right: 8px;`;

    const footer = document.createElement('div');
    footer.style.cssText = `display: flex; gap: 12px; padding-top: 16px; border-top: 2px solid #000000;`;

    const addButton = document.createElement('button');
    addButton.textContent = '➕ Adicionar Botão';
    addButton.className = 'twoelve-button-primary';
    addButton.addEventListener('click', () => {
        modal.fechar();
        modalAtivo = null;
        abrirModalAdicionarBotao();
    });

    footer.appendChild(addButton);
    content.appendChild(botoesContainer);
    content.appendChild(footer);

    modal.setConteudoElemento(content);
    renderizarBotoesNoModal(botoesContainer);

    modal.setFecharCallback(() => {
        modalAtivo = null;
    });
}

async function abrirModalAdicionarBotao() {
    if (modalAtivo) {
        modalAtivo.fechar();
        modalAtivo = null;
    }

    const modal = new TwoelveModalBase('➕ Adicionar Novo Botão');
    modalAtivo = modal;
    modal.abrir();

    const content = document.createElement('div');
    content.style.cssText = `display: flex; flex-direction: column; gap: 16px;`;

    const tipoContainer = document.createElement('div');
    tipoContainer.style.cssText = `display: flex; gap: 10px; margin-bottom: 16px;`;

    let tipoSelecionado = 'informativo';
    let messagesAtivo = false;

    const btnDefinido = document.createElement('button');
    btnDefinido.textContent = 'Definido';
    btnDefinido.className = 'twoelve-button';
    
    const btnInformativo = document.createElement('button');
    btnInformativo.textContent = 'Informativo';
    btnInformativo.className = 'twoelve-button';
    
    const btnMessages = document.createElement('button');
    btnMessages.textContent = 'Messages';
    btnMessages.className = 'twoelve-button';

    function atualizarBotoesTipo() {
        btnDefinido.style.background = tipoSelecionado === 'definido' ? '#10b981' : '#ffffff';
        btnDefinido.style.color = tipoSelecionado === 'definido' ? 'white' : '#1f2937';
        btnInformativo.style.background = tipoSelecionado === 'informativo' ? '#10b981' : '#ffffff';
        btnInformativo.style.color = tipoSelecionado === 'informativo' ? 'white' : '#1f2937';
        btnMessages.style.background = messagesAtivo ? '#10b981' : '#ffffff';
        btnMessages.style.color = messagesAtivo ? 'white' : '#1f2937';
    }

    btnDefinido.addEventListener('click', () => {
        tipoSelecionado = 'definido';
        atualizarBotoesTipo();
        relatoWrap.style.display = 'block';
    });
    btnInformativo.addEventListener('click', () => {
        tipoSelecionado = 'informativo';
        atualizarBotoesTipo();
        relatoWrap.style.display = 'none';
    });
    btnMessages.addEventListener('click', () => {
        messagesAtivo = !messagesAtivo;
        atualizarBotoesTipo();
        chatWrap.style.display = messagesAtivo ? 'block' : 'none';
    });

    tipoContainer.appendChild(btnDefinido);
    tipoContainer.appendChild(btnInformativo);
    tipoContainer.appendChild(btnMessages);

    function criarCampo(labelText, tipo, placeholder) {
        const wrap = document.createElement('div');
        wrap.style.marginBottom = '16px';
        
        const label = document.createElement('label');
        label.textContent = labelText;
        label.style.cssText = `display: block; margin-bottom: 6px; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #4b5563;`;
        
        const input = document.createElement(tipo === 'textarea' ? 'textarea' : 'input');
        if (tipo !== 'textarea') input.type = tipo;
        input.placeholder = placeholder || '';
        input.style.cssText = `width: 100%; padding: 10px 12px; border: 1px solid #ccc; font-size: 13px; box-sizing: border-box; ${tipo === 'textarea' ? 'min-height: 80px; resize: vertical;' : ''}`;
        
        wrap.appendChild(label);
        wrap.appendChild(input);
        return { wrap, input };
    }

    const nomeField = criarCampo('Nome do Botão:', 'text', 'Ex: TVBOX');
    const categoriaField = criarCampo('Categoria:', 'text', 'Ex: Suporte');
    const contextoField = criarCampo('Contexto:', 'text', 'Ex: 3.6.1 - Iptv/TvBox');
    const relatoField = criarCampo('Relato Padrão:', 'textarea', 'Digite o relato padrão...');
    const chatField = criarCampo('Mensagem para o Chat:', 'textarea', 'Digite a mensagem que será enviada ao chat...');

    const relatoWrap = relatoField.wrap;
    const chatWrap = chatField.wrap;
    relatoWrap.style.display = 'none';
    chatWrap.style.display = 'none';

    // 🆕 Campo de Equipe Responsável (usado no encaminhamento para preencher #responsibleId)
    const localizacaoWrap = document.createElement('div');
    localizacaoWrap.style.marginBottom = '16px';
    const localizacaoLabel = document.createElement('label');
    localizacaoLabel.textContent = 'Equipe Responsável:';
    localizacaoLabel.style.cssText = `display: block; margin-bottom: 6px; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #4b5563;`;
    const localizacaoSelect = document.createElement('select');
    localizacaoSelect.style.cssText = `width: 100%; padding: 10px 12px; border: 1px solid #ccc; font-size: 13px; box-sizing: border-box;`;
    const optVazia = document.createElement('option');
    optVazia.value = '';
    optVazia.textContent = '(Nenhuma)';
    localizacaoSelect.appendChild(optVazia);
    (window.CONFIG_LOCATIONS || []).forEach(loc => {
        const opt = document.createElement('option');
        opt.value = loc;
        opt.textContent = loc;
        localizacaoSelect.appendChild(opt);
    });
    localizacaoWrap.appendChild(localizacaoLabel);
    localizacaoWrap.appendChild(localizacaoSelect);

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `display: flex; gap: 12px; margin-top: 8px;`;

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Salvar';
    saveBtn.className = 'twoelve-button-primary';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.className = 'twoelve-button';

    buttonContainer.appendChild(saveBtn);
    buttonContainer.appendChild(cancelBtn);

    content.appendChild(tipoContainer);
    content.appendChild(nomeField.wrap);
    content.appendChild(categoriaField.wrap);
    content.appendChild(contextoField.wrap);
    content.appendChild(relatoWrap);
    content.appendChild(chatWrap);
    content.appendChild(localizacaoWrap);
    content.appendChild(buttonContainer);

    modal.setConteudoElemento(content);

    saveBtn.addEventListener('click', async () => {
        const nome = nomeField.input.value.trim();
        const categoria = categoriaField.input.value.trim() || 'Suporte';
        const contexto = contextoField.input.value.trim();
        const relato = relatoField.input.value.trim();
        const mensagemChat = chatField.input.value.trim();
        const localizacao = localizacaoSelect.value || null;

        if (!nome || !contexto) {
            alert('Preencha Nome e Contexto');
            return;
        }
        if (tipoSelecionado === 'definido' && !relato) {
            alert('Relato Padrão é obrigatório');
            return;
        }
        if (messagesAtivo && !mensagemChat) {
            alert('Preencha a mensagem para o chat');
            return;
        }

        const novoBotao = {
            id: 'custom-' + Date.now(),
            nome: nome,
            contexto: contexto,
            localizacao: localizacao,
            tipo: tipoSelecionado,
            categoria: categoria,
            mensagemPadrao: tipoSelecionado === 'definido' ? relato : null,
            mensagemChat: messagesAtivo ? mensagemChat : null
        };

        customButtons.push(novoBotao);
        await salvarCustomButtons();

        modal.fechar();
        modalAtivo = null;
        abrirModalSuporte();
    });

    cancelBtn.addEventListener('click', () => {
        modal.fechar();
        modalAtivo = null;
        abrirModalSuporte();
    });

    modal.setFecharCallback(() => {
        modalAtivo = null;
    });

    atualizarBotoesTipo();
}

async function abrirModalEditarBotao(botao) {
    if (modalAtivo) {
        modalAtivo.fechar();
        modalAtivo = null;
    }

    const modal = new TwoelveModalBase(`✏️ Editar Botão: ${botao.nome}`);
    modalAtivo = modal;
    modal.abrir();

    const content = document.createElement('div');
    content.style.cssText = `display: flex; flex-direction: column; gap: 16px;`;

    const tipoContainer = document.createElement('div');
    tipoContainer.style.cssText = `display: flex; gap: 10px; margin-bottom: 16px;`;

    let tipoSelecionado = botao.tipo || 'informativo';
    let messagesAtivo = Boolean(botao.mensagemChat);

    const btnDefinido = document.createElement('button');
    btnDefinido.textContent = 'Definido';
    btnDefinido.className = 'twoelve-button';
    
    const btnInformativo = document.createElement('button');
    btnInformativo.textContent = 'Informativo';
    btnInformativo.className = 'twoelve-button';
    
    const btnMessages = document.createElement('button');
    btnMessages.textContent = 'Messages';
    btnMessages.className = 'twoelve-button';

    function atualizarBotoesTipo() {
        btnDefinido.style.background = tipoSelecionado === 'definido' ? '#10b981' : '#ffffff';
        btnDefinido.style.color = tipoSelecionado === 'definido' ? 'white' : '#1f2937';
        btnInformativo.style.background = tipoSelecionado === 'informativo' ? '#10b981' : '#ffffff';
        btnInformativo.style.color = tipoSelecionado === 'informativo' ? 'white' : '#1f2937';
        btnMessages.style.background = messagesAtivo ? '#10b981' : '#ffffff';
        btnMessages.style.color = messagesAtivo ? 'white' : '#1f2937';
    }

    btnDefinido.addEventListener('click', () => {
        tipoSelecionado = 'definido';
        atualizarBotoesTipo();
        relatoWrap.style.display = 'block';
    });
    btnInformativo.addEventListener('click', () => {
        tipoSelecionado = 'informativo';
        atualizarBotoesTipo();
        relatoWrap.style.display = 'none';
    });
    btnMessages.addEventListener('click', () => {
        messagesAtivo = !messagesAtivo;
        atualizarBotoesTipo();
        chatWrap.style.display = messagesAtivo ? 'block' : 'none';
    });

    tipoContainer.appendChild(btnDefinido);
    tipoContainer.appendChild(btnInformativo);
    tipoContainer.appendChild(btnMessages);

    function criarCampo(labelText, tipo, placeholder, valorInicial = '') {
        const wrap = document.createElement('div');
        wrap.style.marginBottom = '16px';
        
        const label = document.createElement('label');
        label.textContent = labelText;
        label.style.cssText = `display: block; margin-bottom: 6px; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #4b5563;`;
        
        const input = document.createElement(tipo === 'textarea' ? 'textarea' : 'input');
        if (tipo !== 'textarea') input.type = tipo;
        input.placeholder = placeholder || '';
        input.value = valorInicial;
        input.style.cssText = `width: 100%; padding: 10px 12px; border: 1px solid #ccc; font-size: 13px; box-sizing: border-box; ${tipo === 'textarea' ? 'min-height: 80px; resize: vertical;' : ''}`;
        
        wrap.appendChild(label);
        wrap.appendChild(input);
        return { wrap, input };
    }

    const nomeField = criarCampo('Nome do Botão:', 'text', 'Ex: TVBOX', botao.nome || '');
    const categoriaField = criarCampo('Categoria:', 'text', 'Ex: Suporte', botao.categoria || '');
    const contextoField = criarCampo('Contexto:', 'text', 'Ex: 3.6.1 - Iptv/TvBox', botao.contexto || '');
    const relatoField = criarCampo('Relato Padrão:', 'textarea', 'Digite o relato padrão...', botao.mensagemPadrao || '');
    const chatField = criarCampo('Mensagem para o Chat:', 'textarea', 'Digite a mensagem...', botao.mensagemChat || '');

    const relatoWrap = relatoField.wrap;
    const chatWrap = chatField.wrap;
    relatoWrap.style.display = tipoSelecionado === 'definido' ? 'block' : 'none';
    chatWrap.style.display = messagesAtivo ? 'block' : 'none';

    // 🆕 Campo de Equipe Responsável (usado no encaminhamento para preencher #responsibleId)
    const localizacaoWrap = document.createElement('div');
    localizacaoWrap.style.marginBottom = '16px';
    const localizacaoLabel = document.createElement('label');
    localizacaoLabel.textContent = 'Equipe Responsável:';
    localizacaoLabel.style.cssText = `display: block; margin-bottom: 6px; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #4b5563;`;
    const localizacaoSelect = document.createElement('select');
    localizacaoSelect.style.cssText = `width: 100%; padding: 10px 12px; border: 1px solid #ccc; font-size: 13px; box-sizing: border-box;`;
    const optVazia = document.createElement('option');
    optVazia.value = '';
    optVazia.textContent = '(Nenhuma)';
    localizacaoSelect.appendChild(optVazia);
    (window.CONFIG_LOCATIONS || []).forEach(loc => {
        const opt = document.createElement('option');
        opt.value = loc;
        opt.textContent = loc;
        if (botao.localizacao === loc) opt.selected = true;
        localizacaoSelect.appendChild(opt);
    });
    localizacaoWrap.appendChild(localizacaoLabel);
    localizacaoWrap.appendChild(localizacaoSelect);

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `display: flex; gap: 12px; margin-top: 8px;`;

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Salvar Alterações';
    saveBtn.className = 'twoelve-button-primary';

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '🗑️ Excluir';
    deleteBtn.className = 'twoelve-button-danger';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.className = 'twoelve-button';

    buttonContainer.appendChild(saveBtn);
    buttonContainer.appendChild(deleteBtn);
    buttonContainer.appendChild(cancelBtn);

    content.appendChild(tipoContainer);
    content.appendChild(nomeField.wrap);
    content.appendChild(categoriaField.wrap);
    content.appendChild(contextoField.wrap);
    content.appendChild(relatoWrap);
    content.appendChild(chatWrap);
    content.appendChild(localizacaoWrap);
    content.appendChild(buttonContainer);

    modal.setConteudoElemento(content);

    saveBtn.addEventListener('click', async () => {
        const nome = nomeField.input.value.trim();
        const categoria = categoriaField.input.value.trim() || 'Suporte';
        const contexto = contextoField.input.value.trim();
        const relato = relatoField.input.value.trim();
        const mensagemChat = chatField.input.value.trim();
        const localizacao = localizacaoSelect.value || null;

        if (!nome || !contexto) {
            alert('Preencha Nome e Contexto');
            return;
        }
        if (tipoSelecionado === 'definido' && !relato) {
            alert('Relato Padrão é obrigatório');
            return;
        }

        const index = customButtons.findIndex(b => b.id === botao.id);
        if (index !== -1) {
            customButtons[index] = {
                ...botao,
                nome: nome,
                categoria: categoria,
                contexto: contexto,
                localizacao: localizacao,
                tipo: tipoSelecionado,
                mensagemPadrao: tipoSelecionado === 'definido' ? relato : null,
                mensagemChat: messagesAtivo ? mensagemChat : null
            };
            await salvarCustomButtons();
        }

        modal.fechar();
        modalAtivo = null;
        abrirModalSuporte();
    });

    deleteBtn.addEventListener('click', async () => {
        if (confirm(`Tem certeza que deseja excluir o botão "${botao.nome}"?`)) {
            customButtons = customButtons.filter(b => b.id !== botao.id);
            await salvarCustomButtons();
            modal.fechar();
            modalAtivo = null;
            abrirModalSuporte();
        }
    });

    cancelBtn.addEventListener('click', () => {
        modal.fechar();
        modalAtivo = null;
        abrirModalSuporte();
    });

    modal.setFecharCallback(() => {
        modalAtivo = null;
    });

    atualizarBotoesTipo();
}

(async function init() {
    await carregarCustomButtons();
    
    // Expor globalmente para o sidebar.js usar via gerenciarModal()
    window.abrirModalSuporte = abrirModalSuporte;
    
    setTimeout(() => {
        adicionarOverlayCopiaNome();
        const observerNome = new MutationObserver(() => adicionarOverlayCopiaNome());
        observerNome.observe(document.body, { childList: true, subtree: true });
    }, 1000);

    console.log('✅ TwoElve v6.0 - Content.js carregado');
})();
