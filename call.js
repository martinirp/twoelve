(function() {
    // ⚙️ CONFIGURAÇÕES
    const DELAY_MIN = 1500; // Delay mínimo em milissegundos
    const DELAY_MAX = 4000; // Delay máximo em milissegundos
    // Ajuste os valores conforme necessário:
    // 1000 = 1 segundo | 3000 = 3 segundos | 5000 = 5 segundos

    const delayAleatorio = () => Math.floor(Math.random() * (DELAY_MAX - DELAY_MIN + 1)) + DELAY_MIN;
    
    function aguardarBotao(tentativas = 20) {
        const botao = document.querySelector('[slide-toggle="#inCallButtons"] i.fa-phone');
        
        if (!botao) {
            if (tentativas <= 0) return console.log('❌ Botão não encontrado após espera');
            setTimeout(() => aguardarBotao(tentativas - 1), 500);
            return;
        }

        let observer = null;

        const ativar = () => {
            const span = document.querySelector('footer.navbar span.text-light[title="Usuário conectado"] span.ng-binding');
            console.log('✅ Auto-atendedor ativo:', span?.textContent?.trim());
            console.log(`⏱️  Delay configurado: entre ${DELAY_MIN}ms e ${DELAY_MAX}ms`);

            observer = new MutationObserver(() => {
                const texto = span.textContent.trim();
                console.log('🔔 Status:', texto);

                if (texto.includes('Tocando')) {
                    const delay = delayAleatorio();
                    console.log(`📞 Chamada detectada! Aguardando ${delay}ms para atender...`);
                    const painel = document.querySelector('#inCallButtons');
                    const estaAberto = painel?.style.height !== '0px' && painel?.style.height !== '';
                    if (!estaAberto) {
                        console.log('📂 Abrindo painel...');
                        document.querySelector('[slide-toggle="#inCallButtons"]').click();
                    }
                    
                    // ⏰ Delay aleatório antes de clicar no botão de atender
                    setTimeout(() => {
                        const btn = document.querySelectorAll('div.call')[1];
                        console.log('Classes do botão:', btn?.className);
                        btn?.click();
                        console.log(`✅ Chamada atendida após ${delay}ms!`);
                    }, estaAberto ? delay : delay + 1200);
                }
            });

            observer.observe(span, { childList: true, subtree: true, characterData: true });
        };

        const desativar = () => {
            if (observer) {
                observer.disconnect();
                observer = null;
                console.log('🔴 Auto-atendedor desativado');
            }
        };

        botao.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (botao.style.color === 'hotpink') {
                botao.style.color = '';
                botao.style.textShadow = '';
                desativar();
            } else {
                botao.style.color = 'hotpink';
                botao.style.textShadow = '0 0 5px hotpink';
                ativar();
            }
        });

        console.log('✅ Pronto! Clique direito no telefone para ativar/desativar');
        console.log(`ℹ️  Delay aleatório entre ${DELAY_MIN}ms e ${DELAY_MAX}ms`);
    }

    aguardarBotao();
})();