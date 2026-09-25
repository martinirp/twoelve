// content-controller.js - Controla a visibilidade das abas na página
class ContentController {
    constructor() {
        this.abas = {
            'utils': { 
                elemento: null, 
                alca: null,
                seletor: '#utils-side-panel',
                seletorAlca: '#utils-handle'
            },
            'messages': { 
                elemento: null, 
                alca: null,
                seletor: '#nova-side-panel-branca', 
                seletorAlca: '#nova-alca-handle-branca'
            },
            'content': { 
                elemento: null, 
                alca: null,
                seletor: '#side-panel', 
                seletorAlca: '#side-panel-handle'
            },
            'visit': { 
                elemento: null, 
                alca: null,
                seletor: '#nova-side-panel', 
                seletorAlca: '#nova-alca-handle'
            },
            'forward': { 
                elemento: null, 
                alca: null,
                seletor: '#forward-side-panel', 
                seletorAlca: '#forward-handle'
            }
        };
        
        this.init();
    }

    init() {
        this.detectarElementos();
        this.carregarConfiguracoes();
        this.setupMessageListener();
    }

    detectarElementos() {
        // Aguarda um pouco para garantir que as abas foram criadas
        setTimeout(() => {
            Object.entries(this.abas).forEach(([id, config]) => {
                config.elemento = document.querySelector(config.seletor);
                config.alca = document.querySelector(config.seletorAlca);
                console.log(`Aba ${id}:`, config.elemento ? 'Encontrada' : 'Não encontrada');
            });
        }, 1000);
    }

    aplicarConfiguracoes(configuracoes) {
        Object.entries(configuracoes).forEach(([id, visivel]) => {
            this.toggleAba(id, visivel);
        });
    }

    toggleAba(id, visivel) {
        const aba = this.abas[id];
        if (aba) {
            if (aba.elemento) {
                aba.elemento.style.display = visivel ? 'flex' : 'none';
            }
            if (aba.alca) {
                aba.alca.style.display = visivel ? 'flex' : 'none';
            }
            console.log(`Aba ${id}: ${visivel ? 'visível' : 'oculta'}`);
        } else {
            console.log(`Aba ${id} não encontrada`);
        }
    }

    carregarConfiguracoes() {
        chrome.storage.local.get(['controleAbas'], (result) => {
            if (result.controleAbas) {
                this.aplicarConfiguracoes(result.controleAbas);
            }
        });
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'aplicarConfiguracoes') {
                this.aplicarConfiguracoes(request.configuracoes);
                sendResponse({success: true});
            }
        });
    }
}

// Inicialização
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ContentController();
    });
} else {
    new ContentController();
}