// ==============================================
// CONFIG.JS - GERENCIADOR DE PERSONALIZAÇÃO E BACKUP
// ==============================================

(function() {
    const DEFAULTS = {
        fonte: {
            familia: 'Inter',
            tamanho: '14px'
        },
        cores: {
            fundo: '#ffffff',
            borda: '#000000',
            texto: '#1a1a1a',
            botaoFundo: '#ffffff',
            botaoTexto: '#1a1a1a',
            botaoBorda: '#000000'
        },
        opacidade: 1,
        usarEmotes: true
    };

    const PRESET_THEMES = {
        'Library': {
            fundo: '#f4f1ea',
            borda: '#4a3c31',
            texto: '#2b221a',
            botaoFundo: '#ebdcb9',
            botaoBorda: '#4a3c31',
            botaoTexto: '#2b221a'
        },
        'Mint': {
            fundo: '#f1fbf7',
            borda: '#114b3e',
            texto: '#0a2e26',
            botaoFundo: '#d2f5e8',
            botaoBorda: '#114b3e',
            botaoTexto: '#0a2e26'
        }
    };

    const FONTES = [
        'Inter', 'Arial', 'Helvetica', 'Verdana', 'Tahoma', 'Trebuchet MS',
        'Roboto', 'Open Sans', 'Lato', 'Poppins', 'Montserrat', 'Oswald',
        'Raleway', 'Nunito', 'Ubuntu', 'Cabin', 'Merriweather', 'Playfair Display',
        'Source Code Pro', 'Courier New', 'Georgia', 'Times New Roman'
    ];

    const TAMANHOS_FONTE = [
        '10px', '11px', '12px', '13px', '14px', '15px', '16px', '17px', '18px', '19px', '20px',
        '21px', '22px', '23px', '24px', '25px', '26px', '27px', '28px', '29px', '30px',
        '31px', '32px', '33px', '34px', '35px', '36px', '37px', '38px', '39px', '40px',
        '41px', '42px', '43px', '44px', '45px', '46px', '47px', '48px', '49px', '50px',
        '51px', '52px', '53px', '54px', '55px', '56px', '57px', '58px', '59px', '60px',
        '61px', '62px', '63px', '64px', '65px', '66px', '67px', '68px', '69px', '70px',
        '71px', '72px'
    ];

    let modal = null;
    let configAtual = { ...DEFAULTS };

    async function carregarConfiguracoes() {
        try {
            const result = await chrome.storage.local.get(['twoelveConfig']);
            if (result.twoelveConfig) {
                configAtual = { ...DEFAULTS, ...result.twoelveConfig };
            }
            aplicarConfiguracoesGlobais();
            return configAtual;
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
            return DEFAULTS;
        }
    }

    async function salvarConfiguracoes(novaConfig) {
        try {
            configAtual = { ...configAtual, ...novaConfig };
            await chrome.storage.local.set({ twoelveConfig: configAtual });
            aplicarConfiguracoesGlobais();
            console.log('✅ Configurações salvas');
            return true;
        } catch (error) {
            console.error('Erro ao salvar configurações:', error);
            return false;
        }
    }

    function aplicarConfiguracoesGlobais() {
        let styleEl = document.getElementById('twoelve-config-styles');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'twoelve-config-styles';
            document.head.appendChild(styleEl);
        }

        styleEl.textContent = `
            :root {
                --modal-custom-font-size: ${configAtual.fonte.tamanho};
                --modal-custom-font-family: '${configAtual.fonte.familia}', sans-serif;
                --modal-custom-bg: ${configAtual.cores.fundo};
                --modal-custom-border: ${configAtual.cores.borda};
                --modal-custom-text: ${configAtual.cores.texto};
                --modal-custom-btn-bg: ${configAtual.cores.botaoFundo};
                --modal-custom-btn-text: ${configAtual.cores.botaoTexto};
                --modal-custom-btn-border: ${configAtual.cores.botaoBorda};
                --modal-custom-opacity: ${configAtual.opacidade};
            }
            
            .twoelve-modal-container {
                background: var(--modal-custom-bg) !important;
                border-color: var(--modal-custom-border) !important;
                box-shadow: 8px 8px 0px var(--modal-custom-border, #000000) !important;
                opacity: var(--modal-custom-opacity) !important;
                font-family: var(--modal-custom-font-family) !important;
                font-size: var(--modal-custom-font-size) !important;
                color: var(--modal-custom-text) !important;
            }
            
            .twoelve-modal-header {
                background: var(--modal-custom-bg) !important;
                border-bottom-color: var(--modal-custom-border) !important;
            }
            
            .twoelve-modal-title {
                color: var(--modal-custom-text) !important;
            }
            
            .twoelve-modal-close {
                background: var(--modal-custom-btn-bg) !important;
                color: var(--modal-custom-btn-text) !important;
                border-color: var(--modal-custom-btn-border) !important;
                box-shadow: 3px 3px 0px var(--modal-custom-btn-border) !important;
            }
            
            .twoelve-modal-close:hover {
                box-shadow: 5px 5px 0px var(--modal-custom-border) !important;
            }
            
            .twoelve-modal-body {
                background: var(--modal-custom-bg) !important;
                color: var(--modal-custom-text) !important;
                font-size: 1em !important;
            }
            
            .twoelve-modal-body * {
                font-family: var(--modal-custom-font-family) !important;
                color: var(--modal-custom-text) !important;
            }
            
            .twoelve-button,
            .twoelve-modal-container button:not(.twoelve-modal-close) {
                background: var(--modal-custom-btn-bg) !important;
                color: var(--modal-custom-btn-text) !important;
                border-color: var(--modal-custom-btn-border) !important;
                box-shadow: 3px 3px 0px var(--modal-custom-btn-border) !important;
                font-family: var(--modal-custom-font-family) !important;
            }
            
            .twoelve-button:hover,
            .twoelve-modal-container button:not(.twoelve-modal-close):hover {
                border-color: var(--modal-custom-btn-border) !important;
                box-shadow: 5px 5px 0px var(--modal-custom-btn-border) !important;
            }
            
            .twoelve-button:active,
            .twoelve-modal-container button:not(.twoelve-modal-close):active {
                box-shadow: 1px 1px 0px var(--modal-custom-btn-border) !important;
            }
            
            .twoelve-buttons-grid button {
                background: var(--modal-custom-btn-bg) !important;
                color: var(--modal-custom-btn-text) !important;
                border-color: var(--modal-custom-btn-border) !important;
                box-shadow: 3px 3px 0px var(--modal-custom-btn-border) !important;
                font-family: var(--modal-custom-font-family) !important;
            }
            
            input[type="text"],
            input[type="number"],
            input[type="date"],
            textarea,
            select {
                background: var(--modal-custom-bg) !important;
                color: var(--modal-custom-text) !important;
                border-color: var(--modal-custom-border) !important;
                font-family: var(--modal-custom-font-family) !important;
            }
        `;

        const modalsAbertos = document.querySelectorAll('.twoelve-modal-container');
        modalsAbertos.forEach(modalEl => {
            modalEl.style.fontSize = configAtual.fonte.tamanho;
        });
    }

    function criarInterface() {
        let fontesHtml = '';
        for (const fonte of FONTES) {
            fontesHtml += `<option value="${fonte}" ${configAtual.fonte.familia === fonte ? 'selected' : ''}>${fonte}</option>`;
        }

        let tamanhosHtml = '';
        for (const tamanho of TAMANHOS_FONTE) {
            tamanhosHtml += `<option value="${tamanho}" ${configAtual.fonte.tamanho === tamanho ? 'selected' : ''}>${tamanho}</option>`;
        }

        return `
            <style>
                .config-section { padding: 8px 0; }
                .config-group { margin-bottom: 24px; }
                .config-label {
                    display: block;
                    font-weight: 600;
                    margin-bottom: 8px;
                    font-size: 13px;
                    color: #1a1a1a;
                }
                .config-select, .config-input, .config-color {
                    width: 100%;
                    padding: 10px;
                    border: 2px solid #000000;
                    background: #ffffff;
                    font-size: 14px;
                    box-shadow: 2px 2px 0px #000000;
                }
                .config-range { width: 100%; margin: 10px 0; }
                .config-row { display: flex; gap: 16px; margin-bottom: 16px; }
                .config-row > div { flex: 1; }
                .config-toggle {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px;
                    background: #f8f8f8;
                    border: 1px solid #e5e5e5;
                }
                .config-toggle input { width: 20px; height: 20px; cursor: pointer; }
                .config-divider { height: 2px; background: #000000; margin: 24px 0; }
                .config-buttons { display: flex; gap: 16px; margin-top: 20px; }
                .config-btn {
                    flex: 1;
                    padding: 12px 24px;
                    font-size: 14px;
                    font-weight: 600;
                    background: #ffffff;
                    border: 2px solid #000000;
                    cursor: pointer;
                    box-shadow: 3px 3px 0px #000000;
                    transition: all 0.08s linear;
                    text-align: center;
                }
                .config-btn:hover {
                    transform: translate(-2px, -2px);
                    box-shadow: 5px 5px 0px #000000;
                }
                .config-btn:active {
                    transform: translate(1px, 1px);
                    box-shadow: 1px 1px 0px #000000;
                }
                .config-btn-export { background: #10b981; color: white; }
                .config-btn-import { background: #3b82f6; color: white; }
                .config-title { font-size: 18px; font-weight: 700; margin-bottom: 20px; color: #1a1a1a; }
                .config-subtitle { font-size: 14px; font-weight: 600; margin-bottom: 16px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
                .status-msg { margin-top: 16px; padding: 12px; font-size: 13px; display: none; }
                .status-success { background: #d1fae5; color: #065f46; border-left: 4px solid #10b981; }
                .status-error { background: #fee2e2; color: #991b1b; border-left: 4px solid #ef4444; }
                .status-info { background: #cffafe; color: #155e75; border-left: 4px solid #0891b2; }
            </style>

            <div class="config-section">
                <div class="config-title">⚙️ Personalização</div>

                <div class="config-group">
                    <label class="config-label">🎨 Tema</label>
                    <select id="config-tema" class="config-select">
                        <option value="personalizado" ${configAtual.tema === 'personalizado' ? 'selected' : ''}>Personalizado</option>
                        <option value="padrao" ${!configAtual.tema || configAtual.tema === 'padrao' ? 'selected' : ''}>Padrão (Retro)</option>
                        <option value="Library" ${configAtual.tema === 'Library' ? 'selected' : ''}>Library</option>
                        <option value="Mint" ${configAtual.tema === 'Mint' ? 'selected' : ''}>Mint</option>
                    </select>
                </div>

                <div class="config-group">
                    <label class="config-label">🔤 Fonte</label>
                    <select id="config-fonte" class="config-select">
                        ${fontesHtml}
                    </select>
                </div>

                <div class="config-row">
                    <div>
                        <label class="config-label">📏 Tamanho da Fonte</label>
                        <select id="config-tamanho" class="config-select">
                            ${tamanhosHtml}
                        </select>
                    </div>
                    <div>
                        <label class="config-label">🎨 Opacidade</label>
                        <input type="range" id="config-opacidade" class="config-range" min="0.5" max="1" step="0.01" value="${configAtual.opacidade}">
                        <span id="opacidade-valor" style="font-size: 12px;">${Math.round(configAtual.opacidade * 100)}%</span>
                    </div>
                </div>

                <div class="config-row">
                    <div>
                        <label class="config-label">🎨 Cor de Fundo</label>
                        <input type="color" id="config-fundo" class="config-color" value="${configAtual.cores.fundo}">
                    </div>
                    <div>
                        <label class="config-label">🖌️ Cor das Bordas</label>
                        <input type="color" id="config-borda" class="config-color" value="${configAtual.cores.borda}">
                    </div>
                </div>

                <div class="config-row">
                    <div>
                        <label class="config-label">✍️ Cor do Texto</label>
                        <input type="color" id="config-texto" class="config-color" value="${configAtual.cores.texto}">
                    </div>
                    <div>
                        <label class="config-label">🔘 Botão - Fundo</label>
                        <input type="color" id="config-botao-fundo" class="config-color" value="${configAtual.cores.botaoFundo || '#ffffff'}">
                    </div>
                </div>

                <div class="config-row">
                    <div>
                        <label class="config-label">🔘 Botão - Borda</label>
                        <input type="color" id="config-botao-borda" class="config-color" value="${configAtual.cores.botaoBorda || '#000000'}">
                    </div>
                    <div>
                        <label class="config-label">🔘 Botão - Texto</label>
                        <input type="color" id="config-botao-texto" class="config-color" value="${configAtual.cores.botaoTexto || '#1a1a1a'}">
                    </div>
                </div>

                <div class="config-group">
                    <div class="config-toggle">
                        <input type="checkbox" id="config-emotes" ${configAtual.usarEmotes ? 'checked' : ''}>
                        <label>😊 Usar emotes nos botões da toolbar</label>
                    </div>
                </div>

                <div class="config-divider"></div>

                <div class="config-title">💾 Preferências</div>
                
                <div class="config-buttons">
                    <button id="btn-exportar" class="config-btn config-btn-export">📤 Exportar</button>
                    <button id="btn-importar" class="config-btn config-btn-import">📥 Importar</button>
                </div>

                <div id="status-msg" class="status-msg"></div>
                <input type="file" id="file-import" accept=".json" style="display: none;">
            </div>
        `;
    }

    function configurarEventos() {
        document.getElementById('config-fonte')?.addEventListener('change', (e) => {
            salvarConfiguracoes({
                fonte: { ...configAtual.fonte, familia: e.target.value }
            });
        });

        document.getElementById('config-tamanho')?.addEventListener('change', (e) => {
            salvarConfiguracoes({
                fonte: { ...configAtual.fonte, tamanho: e.target.value }
            });
        });

        document.getElementById('config-opacidade')?.addEventListener('input', (e) => {
            const valor = parseFloat(e.target.value);
            document.getElementById('opacidade-valor').textContent = `${Math.round(valor * 100)}%`;
            salvarConfiguracoes({ opacidade: valor });
        });

        document.getElementById('config-fundo')?.addEventListener('change', (e) => {
            salvarConfiguracoes({
                cores: { ...configAtual.cores, fundo: e.target.value }
            });
        });

        document.getElementById('config-borda')?.addEventListener('change', (e) => {
            salvarConfiguracoes({
                cores: { ...configAtual.cores, borda: e.target.value }
            });
        });

        // Texto color
        document.getElementById('config-texto')?.addEventListener('change', (e) => {
            salvarConfiguracoes({ cores: { ...configAtual.cores, texto: e.target.value } });
        });

        // Botão colors
        document.getElementById('config-botao-fundo')?.addEventListener('change', (e) => {
            salvarConfiguracoes({ cores: { ...configAtual.cores, botaoFundo: e.target.value } });
        });
        document.getElementById('config-botao-borda')?.addEventListener('change', (e) => {
            salvarConfiguracoes({ cores: { ...configAtual.cores, botaoBorda: e.target.value } });
        });
        document.getElementById('config-botao-texto')?.addEventListener('change', (e) => {
            salvarConfiguracoes({ cores: { ...configAtual.cores, botaoTexto: e.target.value } });
        });

        // Theme preset selector
        document.getElementById('config-tema')?.addEventListener('change', (e) => {
            const val = e.target.value;
            if (val === 'personalizado') return;
            if (val === 'padrao') {
                // revert to defaults
                salvarConfiguracoes({ cores: { ...DEFAULTS.cores }, tema: 'padrao' });
                // update inputs
                setTimeout(() => carregarConfiguracoes(), 50);
                return;
            }
            const theme = PRESET_THEMES[val];
            if (theme) {
                // populate inputs and save
                const novasCores = {
                    ...configAtual.cores,
                    fundo: theme.fundo,
                    borda: theme.borda,
                    texto: theme.texto,
                    botaoFundo: theme.botaoFundo,
                    botaoBorda: theme.botaoBorda,
                    botaoTexto: theme.botaoTexto
                };
                // update UI inputs
                document.getElementById('config-fundo').value = novasCores.fundo;
                document.getElementById('config-borda').value = novasCores.borda;
                document.getElementById('config-texto').value = novasCores.texto;
                document.getElementById('config-botao-fundo').value = novasCores.botaoFundo;
                document.getElementById('config-botao-borda').value = novasCores.botaoBorda;
                document.getElementById('config-botao-texto').value = novasCores.botaoTexto;
                salvarConfiguracoes({ cores: novasCores, tema: val });
            }
        });

        document.getElementById('config-emotes')?.addEventListener('change', (e) => {
            salvarConfiguracoes({ usarEmotes: e.target.checked });
            atualizarEmotesToolbar();
        });

        document.getElementById('btn-exportar')?.addEventListener('click', exportarDados);
        document.getElementById('btn-importar')?.addEventListener('click', () => {
            document.getElementById('file-import').click();
        });
        document.getElementById('file-import')?.addEventListener('change', importarDados);
    }

    function atualizarEmotesToolbar() {
        const botoes = document.querySelectorAll('.twoelve-btn');
        if (!configAtual.usarEmotes) {
            botoes.forEach(btn => {
                const texto = btn.textContent;
                const textoSemEmote = texto.replace(/[^\w\s]/g, '').trim();
                if (texto !== textoSemEmote) {
                    btn.textContent = textoSemEmote;
                }
            });
        } else {
            const textosOriginais = {
                'Utils': '🛠️ Utils',
                'Mensagens': '💬 Mensagens',
                'Suporte': '✅ Suporte',
                'Visita': '🚗 Visita',
                'Encaminhar': '📤 Encaminhar'
            };
            botoes.forEach(btn => {
                const textoLimpo = btn.textContent.replace(/[^\w\s]/g, '').trim();
                if (textosOriginais[textoLimpo]) {
                    btn.textContent = textosOriginais[textoLimpo];
                }
            });
        }
    }

    async function exportarDados() {
        mostrarStatus('📤 Exportando...', 'info');

        try {
            const storageKeys = [
                'customButtons', 'customVisits', 'whitePanelMessages',
                'forwardButtons', 'customTheme', 'controleAbas',
                'autoOverlay', 'autoMensagem', 'twoelveConfig'
            ];

            const result = await chrome.storage.local.get(storageKeys);
            
            const exportData = {
                exportadoEm: new Date().toISOString(),
                versao: '1.0',
                dados: result
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `twoelve_backup_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            mostrarStatus('✅ Exportado com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao exportar:', error);
            mostrarStatus(`❌ Erro ao exportar: ${error.message}`, 'error');
        }
    }

    async function importarDados(event) {
        const file = event.target.files[0];
        if (!file) return;

        mostrarStatus('📥 Importando...', 'info');

        try {
            const text = await file.text();
            const importData = JSON.parse(text);

            if (!importData.dados || typeof importData.dados !== 'object') {
                throw new Error('Arquivo inválido');
            }

            await chrome.storage.local.set(importData.dados);
            await carregarConfiguracoes();

            const reload = confirm(
                '✅ Importado com sucesso!\n\nDeseja recarregar a página para aplicar as mudanças?'
            );
            
            if (reload) {
                location.reload();
            } else {
                mostrarStatus('✅ Importado com sucesso! Recarregue a página para aplicar.', 'success');
                if (modal) modal.fechar();
            }

        } catch (error) {
            console.error('Erro ao importar:', error);
            mostrarStatus(`❌ Erro ao importar: ${error.message}`, 'error');
        }

        event.target.value = '';
    }

    function mostrarStatus(mensagem, tipo) {
        const statusDiv = document.getElementById('status-msg');
        if (!statusDiv) return;
        
        statusDiv.textContent = mensagem;
        statusDiv.className = `status-msg status-${tipo}`;
        statusDiv.style.display = 'block';
        
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 3000);
    }

    window.abrirConfig = async function() {
        if (typeof TwoelveModalBase === 'undefined') {
            console.error('TwoelveModalBase não encontrado');
            return;
        }

        await carregarConfiguracoes();

        modal = new TwoelveModalBase('⚙️ Configurações');
        modal.abrir();
        modal.setConteudo(criarInterface());
        modal.setFecharCallback(() => {
            modal = null;
        });

        setTimeout(() => {
            configurarEventos();
        }, 100);
    };

    // Reaplica as configurações quando forem alteradas pela página de configurações
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        try {
            if (message && message.action === 'twoelve-config-changed') {
                carregarConfiguracoes().then(() => {
                    atualizarEmotesToolbar();
                    sendResponse && sendResponse({ ok: true });
                }).catch(() => {
                    sendResponse && sendResponse({ ok: false });
                });
                return true;
            }
        } catch (e) {
            console.error('config.js onMessage error', e);
        }
    });

    carregarConfiguracoes();

    console.log('✅ Config.js carregado');
})();