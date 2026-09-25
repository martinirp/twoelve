// control-panel.js - Controle do Popup da Extensão
document.addEventListener('DOMContentLoaded', function() {
    const checkboxes = {
        'todos': document.getElementById('checkbox-todos'),
        'utils': document.getElementById('checkbox-utils'),
        'messages': document.getElementById('checkbox-messages'),
        'content': document.getElementById('checkbox-content'),
        'visit': document.getElementById('checkbox-visit'),
        'forward': document.getElementById('checkbox-forward')
    };
    
    const btnAplicar = document.getElementById('btn-aplicar');
    const btnReset = document.getElementById('btn-reset');
    const status = document.getElementById('status');

    // Carrega as configurações salvas
    carregarConfiguracoes();

    // Evento para checkbox "Todos"
    checkboxes.todos.addEventListener('change', function() {
        const checked = this.checked;
        Object.keys(checkboxes).forEach(key => {
            if (key !== 'todos') {
                checkboxes[key].checked = checked;
            }
        });
    });

    // Evento para checkboxes individuais
    Object.keys(checkboxes).forEach(key => {
        if (key !== 'todos') {
            checkboxes[key].addEventListener('change', function() {
                verificarEstadoTodos();
            });
        }
    });

    // Botão Aplicar
    btnAplicar.addEventListener('click', function() {
        aplicarConfiguracoes();
        mostrarStatus('Aplicado!', 'success');
    });

    // Botão Reset
    btnReset.addEventListener('click', function() {
        restaurarPadrao();
        mostrarStatus('Padrão!', 'success');
    });

    function verificarEstadoTodos() {
        const todasMarcadas = ['utils', 'messages', 'content', 'visit', 'forward']
            .every(key => checkboxes[key].checked);
        checkboxes.todos.checked = todasMarcadas;
    }

    function aplicarConfiguracoes() {
        const configuracoes = {};
        
        Object.keys(checkboxes).forEach(key => {
            if (key !== 'todos') {
                configuracoes[key] = checkboxes[key].checked;
            }
        });

        // Salva no storage
        chrome.storage.local.set({ controleAbas: configuracoes }, function() {
            // Envia mensagem para as abas aplicarem as configurações
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'aplicarConfiguracoes',
                    configuracoes: configuracoes
                });
            });
        });
    }

    function carregarConfiguracoes() {
        chrome.storage.local.get(['controleAbas'], function(result) {
            const configuracoes = result.controleAbas;
            
            if (configuracoes) {
                Object.keys(configuracoes).forEach(key => {
                    if (checkboxes[key]) {
                        checkboxes[key].checked = configuracoes[key];
                    }
                });
                verificarEstadoTodos();
            }
        });
    }

    function restaurarPadrao() {
        // Marca todas como true
        Object.keys(checkboxes).forEach(key => {
            checkboxes[key].checked = true;
        });
        
        aplicarConfiguracoes();
    }

    function mostrarStatus(mensagem, tipo) {
        status.textContent = mensagem;
        status.style.color = tipo === 'success' ? '#28a745' : '#dc3545';
        
        setTimeout(() => {
            status.textContent = '';
        }, 1500);
    }
});