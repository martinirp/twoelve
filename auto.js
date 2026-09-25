// auto.js - Versão com correções de bugs (v2)
// Correções aplicadas:
//   [bug#2] Reset do jaProcessouNovaAba movido para fora do if/else — garante reset em atendimentos encaminhados
//   [bug#3] jaProcessouNovaAba setado imediatamente na entrada da função — elimina race condition em async
//   [bug#5] Fila de abas pendentes + marcação com data-twoelve-processada — garante processamento progressivo
(function() {
    console.log("[TwoElve] 🚀 Iniciando auto.js...");

    let abasAnteriores = new Set();
    let jaProcessouNovaAba = false;
    let observadorAtivo = true;
    const filaDeAbas = []; // [bug#5] fila para múltiplas abas simultâneas

    // ─── AGUARDAR ELEMENTO NO DOM ────────────────────────────────────────────────
    function aguardarElemento(selector, timeout = 5000) {
        return new Promise((resolve) => {
            const inicio = Date.now();
            const checar = () => {
                const el = document.querySelector(selector);
                if (el) return resolve(el);
                if (Date.now() - inicio >= timeout) {
                    console.warn(`[TwoElve] ⏱️ Timeout aguardando: ${selector}`);
                    return resolve(null);
                }
                setTimeout(checar, 150);
            };
            checar();
        });
    }

    // ─── ESCREVER NO CHAT ─────────────────────────────────────────────────────────
    async function escreverNoChat(elemento, valor) {
        if (!elemento) return false;
        try {
            const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
            setter.call(elemento, valor);
            elemento.dispatchEvent(new Event('input', { bubbles: true }));
            elemento.dispatchEvent(new Event('change', { bubbles: true }));
            console.log("[TwoElve] ✅ Mensagem preenchida:", valor);
            return true;
        } catch (error) {
            console.error("[TwoElve] Erro ao escrever:", error);
            return false;
        }
    }

    // ─── ENVIAR MENSAGEM SE HORÁRIO COMERCIAL (09:00–20:40) ──────────────────────
 
const enviarMensagemSeHorarioComercial = () => {
    return new Promise((resolve) => {
        const agora = new Date();
        const horas = agora.getHours();
        const minutos = agora.getMinutes();
        const totalMinutosAgora = horas * 60 + minutos;
        const inicioComercial   = 9  * 60 + 0;   // 09:00 → 540 min
        const fimComercial      = 20 * 60 + 30;  // 20:30 → 1230 min
        const dentroDoHorario = totalMinutosAgora >= inicioComercial && totalMinutosAgora <= fimComercial;
        if (!dentroDoHorario) {
            console.log(`[TwoElve] 🌙 Fora do horário comercial (${horas}:${String(minutos).padStart(2,'0')}) — mensagem escrita mas NÃO enviada.`);
            return resolve(false);
        }
        const delayMs = Math.floor(Math.random() * (8000 - 5000 + 1)) + 5000; // 5-8s
        console.log(`[TwoElve] 🕐 Horário comercial (${horas}:${String(minutos).padStart(2,'0')}) — aguardando ${(delayMs/1000).toFixed(1)}s para enviar...`);
        setTimeout(() => {
            const botaoEnviar = document.querySelector('button[type="submit"][tooltip="Enviar mensagem"]');
            if (botaoEnviar) {
                botaoEnviar.click();
                console.log("[TwoElve] 📤 Mensagem enviada automaticamente!");
                resolve(true);
            } else {
                console.warn("[TwoElve] ⚠️ Botão de enviar não encontrado — mensagem apenas escrita.");
                resolve(false);
            }
        }, delayMs);
    });
};

    // ─── CLICAR NO BOTÃO LISTAGEM ────────────────────────────────────────────────
    const clicarBotaoListagem = () => {
        return new Promise((resolve) => {
            console.log("[TwoElve] 🔍 Procurando botão 'Ir para listagem de solicitações'...");

            const tentativas = [
                () => document.querySelector('button[tooltip="Ir para listagem de solicitações"]'),
                () => {
                    const botoes = document.querySelectorAll('button[tooltip]');
                    return Array.from(botoes).find(b =>
                        b.getAttribute('tooltip').toLowerCase().includes('listagem')
                    ) || null;
                },
                () => {
                    const span = document.querySelector('span[title="Ir para listagem de solicitações"]');
                    return span ? span.querySelector('button') || span : null;
                },
                () => document.querySelector('button[title="Ir para listagem de solicitações"]'),
                () => document.querySelector('button[aria-label="Ir para listagem de solicitações"]'),
            ];

            let botao = null;
            for (let i = 0; i < tentativas.length; i++) {
                botao = tentativas[i]();
                if (botao) {
                    console.log(`[TwoElve] ✅ Botão encontrado (estratégia ${i + 1}):`, botao);
                    break;
                }
            }

            if (botao) {
                botao.click();
                console.log("[TwoElve] ✅ Botão 'Ir para listagem' clicado!");
                setTimeout(resolve, 800);
            } else {
                console.warn("[TwoElve] ⚠️ Botão 'listagem' não encontrado. Verifique o seletor no DevTools.");
                resolve();
            }
        });
    };

    // ─── SELECIONAR ABA ───────────────────────────────────────────────────────────
    const selecionarAba = (abaElement) => {
        return new Promise((resolve) => {
            if (!abaElement) return resolve(false);
            abaElement.click();
            console.log("[TwoElve] 🖱️ Aba selecionada, aguardando DOM carregar...");
            setTimeout(resolve, 800);
        });
    };

    // ─── VERIFICAR TIPO DE ATENDIMENTO ───────────────────────────────────────────
    const verificarTipoAtendimento = () => {
        const campos = document.querySelectorAll('.ql-editor.dx-htmleditor-content');
        const quantidade = campos.length;
        console.log(`[TwoElve] 📝 Campos .ql-editor encontrados: ${quantidade}`);

        if (quantidade === 2) {
            console.log("[TwoElve] ✅ Atendimento NORMAL (2 campos)");
            return "normal";
        } else if (quantidade === 1) {
            console.log("[TwoElve] ⏭️ Atendimento ENCAMINHADO (1 campo)");
            return "encaminhado";
        } else {
            console.log("[TwoElve] ⚠️ Quantidade inesperada de campos:", quantidade);
            return "desconhecido";
        }
    };

    // ─── PREENCHER MENSAGEM ───────────────────────────────────────────────────────
    const preencherMensagem = async () => {
        const textarea = await aguardarElemento('textarea[rows="1"].MuiInputBase-inputMultiline');

        if (!textarea) {
            console.log("[TwoElve] ❌ Textarea não encontrado após espera");
            return false;
        }

        const horas = new Date().getHours();
        let mensagem = "";

        if (horas < 12) {
            mensagem = "Bom dia, como posso ajudar?";
        } else if (horas >= 12 && horas < 18) {
            mensagem = "Boa tarde, como posso ajudar?";
        } else {
            mensagem = "Boa noite, como posso ajudar?";
        }

        const escrito = await escreverNoChat(textarea, mensagem);

        if (escrito) {
            await enviarMensagemSeHorarioComercial();
        }

        return escrito;
    };

    // ─── ID ÚNICO DA ABA ──────────────────────────────────────────────────────────
    const getAbaId = (aba) => {
        try {
            const protocolo = aba.querySelector('.MuiTypography-root.jss33');
            const cliente   = aba.querySelector('.jss32');
            const protocoloTexto = protocolo ? protocolo.textContent.trim() : "";
            const clienteTexto   = cliente   ? cliente.textContent.trim()   : "";
            return `${protocoloTexto}|${clienteTexto}`;
        } catch {
            return Math.random().toString();
        }
    };

    // ─── PROCESSAR ABA DA FILA ────────────────────────────────────────────────────
    const processarAba = async (novaAba) => {
        const protocolo = novaAba.querySelector('.MuiTypography-root.jss31');
        const cliente   = novaAba.querySelector('.jss30');

        console.log("[TwoElve] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("[TwoElve] 🆕 PROCESSANDO ABA!");
        console.log(`[TwoElve]    Protocolo : ${protocolo ? protocolo.textContent.trim() : "N/A"}`);
        console.log(`[TwoElve]    Cliente   : ${cliente   ? cliente.textContent.trim()   : "N/A"}`);
        console.log(`[TwoElve]    Na fila   : ${filaDeAbas.length} restante(s)`);
        console.log("[TwoElve] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        await clicarBotaoListagem();
        await selecionarAba(novaAba);

        console.log("[TwoElve] ⏳ Aguardando conteúdo da nova aba carregar...");
        await aguardarElemento('.ql-editor.dx-htmleditor-content', 4000);
        await new Promise(r => setTimeout(r, 300));

        const tipo = verificarTipoAtendimento();

        if (tipo === "normal") {
            if (window.TwoElveControle && window.TwoElveControle.autoMensagem === false) {
                console.log("[TwoElve] 🔕 Saudação desativada pelo toggle.");
            } else {
                await preencherMensagem();
                console.log("[TwoElve] 🎯 Saudação processada com sucesso!");
            }
        } else {
            console.log("[TwoElve] ⏭️ Atendimento encaminhado — saudação não enviada.");
        }

        // [bug#2] Reset sempre executa — independente do tipo de atendimento
        // [bug#5] Após reset, processa próxima da fila se houver
        setTimeout(() => {
            jaProcessouNovaAba = false;
            console.log("[TwoElve] 🔄 Sistema resetado, aguardando próximo atendimento...");
            if (filaDeAbas.length > 0) {
                console.log(`[TwoElve] 📋 ${filaDeAbas.length} aba(s) na fila — processando próxima...`);
                verificarEProcessarNovasAbas();
            }
        }, 5000);
    };

    // ─── FLUXO PRINCIPAL ──────────────────────────────────────────────────────────
    const verificarEProcessarNovasAbas = async () => {
        if (!observadorAtivo || jaProcessouNovaAba) return;

        // [bug#3] Flag setado imediatamente — elimina race condition em chamadas async paralelas
        jaProcessouNovaAba = true;

        try {
            // [bug#5] Se há abas na fila, processa a próxima diretamente
            if (filaDeAbas.length > 0) {
                const proximaAba = filaDeAbas.shift();
                await processarAba(proximaAba);
                return;
            }

            const abasAtuais = document.querySelectorAll('[role="tab"]');
            if (abasAtuais.length === 0) {
                jaProcessouNovaAba = false;
                return;
            }

            const idsAtuais = new Set();
            abasAtuais.forEach(aba => idsAtuais.add(getAbaId(aba)));

            // Detecta abas novas: não estavam no snapshot E não foram marcadas ainda
            const novasAbas = [];
            abasAtuais.forEach(aba => {
                const id = getAbaId(aba);
                const jaProcessada = aba.getAttribute('data-twoelve-processada') === 'true';
                if (!abasAnteriores.has(id) && !jaProcessada) novasAbas.push(aba);
            });

            // Atualiza snapshot
            abasAnteriores = idsAtuais;

            if (novasAbas.length === 0) {
                jaProcessouNovaAba = false;
                return;
            }

            // [bug#5] Marca todas as novas abas imediatamente e empurra na fila
            novasAbas.forEach(aba => {
                aba.setAttribute('data-twoelve-processada', 'true');
                filaDeAbas.push(aba);
            });

            console.log(`[TwoElve] 📋 ${novasAbas.length} nova(s) aba(s) detectada(s) — adicionadas à fila.`);

            // Processa a primeira da fila
            const proximaAba = filaDeAbas.shift();
            await processarAba(proximaAba);

        } catch (error) {
            console.error("[TwoElve] Erro ao verificar abas:", error);
            jaProcessouNovaAba = false;
        }
    };

    // ─── OBSERVER DE ABAS ─────────────────────────────────────────────────────────
    const observer = new MutationObserver(() => {
        verificarEProcessarNovasAbas();
    });

    // ─── INICIAR MONITORAMENTO ────────────────────────────────────────────────────
    // Snapshot e ativação do observer acontecem JUNTOS dentro do mesmo bloco —
    // sem janela de risco entre os dois.
    const iniciarMonitoramento = () => {
        if (!document.body) {
            console.log("[TwoElve] ⏳ Aguardando DOM carregar...");
            setTimeout(iniciarMonitoramento, 500);
            return;
        }

        console.log("[TwoElve] ⏳ Aguardando página estabilizar (46s)...");

        setTimeout(() => {
            const abasAtuais = document.querySelectorAll('[role="tab"]');
            abasAtuais.forEach(aba => abasAnteriores.add(getAbaId(aba)));
            console.log(`[TwoElve] 📊 Snapshot: ${abasAnteriores.size} aba(s) existente(s) registrada(s).`);

            observer.observe(document.body, { childList: true, subtree: true });
            console.log("[TwoElve] 👀 Monitoramento ativo! Somente NOVAS abas serão processadas.");
        }, 46000);
    };

    // ─── OBSERVER DE OVERLAY ──────────────────────────────────────────────────────
    const observerOverlay = new MutationObserver(() => {
        if (window.TwoElveControle && window.TwoElveControle.autoOverlay === false) return;
        const overlay = document.querySelector('.ui-widget-overlay');
        if (overlay) overlay.remove();
    });

    // ─── START ────────────────────────────────────────────────────────────────────
    iniciarMonitoramento();
    observerOverlay.observe(document.body, { childList: true, subtree: true });

    console.log("[TwoElve] 🚀 Sistema iniciado! Aguardando estabilização da página...");

    window.TwoElve = {
        reset: () => {
            jaProcessouNovaAba = false;
            filaDeAbas.length = 0;
            console.log("[TwoElve] 🔄 Sistema resetado manualmente! Fila limpa.");
        },
        status: () => {
            console.log("[TwoElve] 📊 Status:", {
                processou: jaProcessouNovaAba,
                abasMonitoradas: abasAnteriores.size,
                ativo: observadorAtivo,
                fila: filaDeAbas.length
            });
        }
    };

})();
