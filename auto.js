// auto.js - Versão com correções de bugs (v2)
// Correções aplicadas:
//   [bug#2] Reset do jaProcessouNovaAba movido para fora do if/else — garante reset em atendimentos encaminhados
//   [bug#3] jaProcessouNovaAba setado imediatamente na entrada da função — elimina race condition em async
//   [bug#5] Fila de abas pendentes + marcação com data-twoelve-processada — garante processamento progressivo
(function() {
    console.log("[TwoElve] 🚀 Iniciando auto.js...");

    // Saudação automática existe SOMENTE na branch dev (flag "twoelveSaudacao" no manifest)
    const saudacaoDisponivel = () => {
        try { return !!chrome.runtime.getManifest().twoelveSaudacao; } catch (e) { return false; }
    };

    let abasAnteriores = new Set();
    let jaProcessouNovaAba = false;
    let observadorAtivo = true;
    const filaDeAbas = []; // [bug#5] fila para múltiplas abas simultâneas
    let contadorAba = 0;   // numeração das abas de atendimento (badge + atributo)

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

    // ─── AGUARDAR UM DE VÁRIOS CAMPOS ─────────────────────────────────────────────
    const SELETORES_TEXTAREA = [
        'textarea[rows="1"].MuiInputBase-inputMultiline',   // MUI (padrão do ERP)
        'textarea.MuiInputBase-inputMultiline',             // MUI (variações)
        'textarea[role="textbox"]',                         // ARIA
        '.dx-texteditor textarea',                          // DevExtreme
        'textarea:not([readonly]):not([disabled])'          // último recurso
    ];
    function aguardarUmDos(selectores, timeout) {
        return new Promise((resolve) => {
            const limite = timeout || 6000;
            const inicio = Date.now();
            const checar = () => {
                for (const sel of selectores) {
                    const el = document.querySelector(sel);
                    if (el) {
                        console.log(`[TwoElve] ✅ Campo encontrado via "${sel}"`);
                        return resolve(el);
                    }
                }
                if (Date.now() - inicio >= limite) {
                    console.warn(`[TwoElve] ⏱️ Timeout aguardando campo (${selectores.join(', ')})`);
                    return resolve(null);
                }
                setTimeout(checar, 150);
            };
            checar();
        });
    }

    // ─── ENCONTRAR BOTÃO ENVIAR ───────────────────────────────────────────────────
    const encontrarBotaoEnviar = () => {
        const candidatos = [
            'button[type="submit"][tooltip="Enviar mensagem"]',
            'button[type="submit"]',
            'button[aria-label*="enviar" i], button[title*="enviar" i], button[tooltip*="enviar" i]',
            'button[aria-label*="send" i], button[title*="send" i], button[tooltip*="send" i]'
        ];
        for (const sel of candidatos) {
            const el = document.querySelector(sel);
            if (el) return { botao: el, origem: sel };
        }
        // varredura final: qualquer botão cujo texto/atributos contenham "enviar"/"send"
        const alvo = Array.from(document.querySelectorAll('button')).find((b) => {
            const texto = ((b.textContent || '') + ' ' +
                (b.getAttribute('aria-label') || '') + ' ' +
                (b.getAttribute('title') || '') + ' ' +
                (b.getAttribute('tooltip') || '')).toLowerCase();
            return (texto.includes('enviar') || texto.includes('send')) && texto.length < 60;
        });
        return alvo ? { botao: alvo, origem: 'texto contém enviar/send' } : null;
    };

    // ─── CLICAR BOTÃO ENVIAR (com retry se desabilitado) ──────────────────────────
    const clicarBotaoEnviar = (botao, maxRetries) => new Promise((resolve) => {
        let tentativas = 0;
        const limite = maxRetries || 20; // ~4s
        const tentar = () => {
            if (!document.body.contains(botao)) {
                console.warn('[TwoElve] ⚠️ Botão enviar saiu do DOM.');
                return resolve(false);
            }
            if (botao.disabled) {
                tentativas += 1;
                if (tentativas > limite) {
                    console.warn('[TwoElve] ⚠️ Botão enviar segue desabilitado (retries esgotados).');
                    return resolve(false);
                }
                setTimeout(tentar, 200);
                return;
            }
            botao.click();
            resolve(true);
        };
        tentar();
    });

    // ─── ESCREVER NO CHAT ─────────────────────────────────────────────────────────
    async function escreverNoChat(elemento, valor) {
        if (!elemento) return false;
        try {
            const proto = (elemento instanceof HTMLTextAreaElement)
                ? window.HTMLTextAreaElement.prototype
                : window.HTMLInputElement.prototype;
            const setter = Object.getOwnPropertyDescriptor(proto, "value").set;
            setter.call(elemento, valor);
            elemento.dispatchEvent(new Event('input', { bubbles: true }));
            elemento.dispatchEvent(new Event('change', { bubbles: true }));
            elemento.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
            const aplicado = (elemento.value || '') === valor;
            console.log("[TwoElve]", aplicado ? "✅ Mensagem preenchida:" : "⚠️ Mensagem PODE NÃO ter sido aplicada pelo React:", valor);
            return true;
        } catch (error) {
            console.error("[TwoElve] Erro ao escrever:", error);
            return false;
        }
    }

    // ─── ENVIAR MENSAGEM SE HORÁRIO COMERCIAL (09:00–20:30) ──────────────────────
 
const enviarMensagemSeHorarioComercial = (textarea) => {
        return new Promise((resolve) => {
            const agora = new Date();
            const horas = agora.getHours();
            const minutos = agora.getMinutes();
            const totalMinutosAgora = horas * 60 + minutos;
            const inicioComercial   = 9  * 60 + 0;   // 09:00 → 540 min
            const fimComercial      = 20 * 60 + 30;  // 20:30 → 1230 min

            if (!textarea || !(textarea.value || '').trim()) {
                console.warn('[TwoElve] ⚠️ Campo de mensagem vazio — nada a enviar.');
                return resolve(false);
            }

            const dentroDoHorario = totalMinutosAgora >= inicioComercial && totalMinutosAgora <= fimComercial;
            if (!dentroDoHorario) {
                console.log(`[TwoElve] 🌙 Fora do horário comercial (${horas}:${String(minutos).padStart(2,'0')}, válido 09:00–20:30) — mensagem escrita mas NÃO enviada.`);
                return resolve(false);
            }

            const delayMs = Math.floor(Math.random() * (8000 - 5000 + 1)) + 5000; // 5-8s
            console.log(`[TwoElve] 🕐 Horário comercial (${horas}:${String(minutos).padStart(2,'0')}) — aguardando ${(delayMs/1000).toFixed(1)}s para enviar...`);
            setTimeout(async () => {
                const alvo = encontrarBotaoEnviar();
                if (alvo) {
                    console.log(`[TwoElve] 🎯 Botão enviar encontrado — ${alvo.origem}`);
                    const clicado = await clicarBotaoEnviar(alvo.botao);
                    if (clicado) {
                        console.log("[TwoElve] 📤 Mensagem enviada automaticamente!");
                    } else {
                        console.warn("[TwoElve] ⚠️ Não consegui clicar no botão de enviar (desabilitado ou saiu do DOM).");
                    }
                    resolve(clicado);
                } else {
                    console.warn("[TwoElve] ⚠️ Botão de enviar não encontrado — tentando Enter como último recurso.");
                    textarea.dispatchEvent(new KeyboardEvent('keydown', {
                        key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true
                    }));
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
        if (!saudacaoDisponivel()) {
            console.log("[TwoElve] 🔕 Saudação indisponível nesta versão (somente na branch dev).");
            return false;
        }

        const controles = window.TwoElveControle || {};

        const textarea = await aguardarUmDos(SELETORES_TEXTAREA, 7000);

        if (!textarea) {
            console.log("[TwoElve] ❌ Campo de mensagem não encontrado após espera");
            return false;
        }

        // não sobrescreve o que o atendente já digitou
        if ((textarea.value || '').trim()) {
            console.log("[TwoElve] ℹ️ Campo já possui texto — saudação não sobrescreve:", textarea.value);
            return true;
        }

        // mensagem personalizada (config) ou saudação por horário
        const personalizada = (controles.saudacaoMensagem || '').trim();
        const horas = new Date().getHours();
        const mensagem = personalizada ||
            (horas < 12 ? "Bom dia, como posso ajudar?" :
             horas < 18 ? "Boa tarde, como posso ajudar?" :
             "Boa noite, como posso ajudar?");

        const escrito = await escreverNoChat(textarea, mensagem);
        if (!escrito) return false;

        // prévia: a mensagem fica no chat (visível para o atendente) mas NÃO é enviada
        if (controles.saudacaoPrevia === true) {
            console.log("[TwoElve] 👁️ Prévia ativada — mensagem escrita no chat mas NÃO enviada:", mensagem);
            return true;
        }

        await enviarMensagemSeHorarioComercial(textarea);
        return true;
    };

    // ─── ID ÚNICO DA ABA ──────────────────────────────────────────────────────────
    // Identifica a aba por protocolo/cliente usando múltiplos seletores: as classes
    // JSS do site (jss30..jss33) mudam entre versões, o que fazia o ID virar vazio
    // ("|") para todas as abas — fazendo toda aba nova parecer já vista e ser ignorada.
    const getAbaId = (aba) => {
        try {
            const protocolo = aba.querySelector(
                '.MuiTypography-root.jss33, .MuiTypography-root.jss31'
            );
            const cliente = aba.querySelector('.jss32, .jss30');
            const protocoloTexto = protocolo ? protocolo.textContent.trim() : "";
            const clienteTexto   = cliente   ? cliente.textContent.trim()   : "";

            if (protocoloTexto || clienteTexto) {
                return `${protocoloTexto}|${clienteTexto}`;
            }

            // fallback: classes mudaram — usa o texto visível inteiro da aba como ID
            const texto = (aba.textContent || "").replace(/\s+/g, " ").trim();
            return texto || Math.random().toString();
        } catch {
            return Math.random().toString();
        }
    };

    // ─── INJETAR NUMERAÇÃO NA ABA ─────────────────────────────────────────────────
    // Injeta um badge visível com o número sequencial + atributo data-twoelve-numero.
    // Chamada apenas para abas NOVAS detectadas (evita marcar abas de navegação).
    const marcarAbaComNumero = (aba) => {
        if (!aba) return null;
        const existente = aba.getAttribute('data-twoelve-numero');
        if (existente) return existente;

        contadorAba += 1;
        aba.setAttribute('data-twoelve-numero', String(contadorAba));

        const badge = document.createElement('span');
        badge.className = 'twoelve-numero-badge';
        badge.textContent = String(contadorAba);
        badge.title = 'TwoElve - aba #' + contadorAba;
        badge.style.cssText = [
            'display:inline-block',
            'min-width:16px',
            'height:16px',
            'line-height:16px',
            'padding:0 4px',
            'margin-right:6px',
            'border-radius:8px',
            'background:#d9a13f',
            'color:#1a1a1a',
            'font-size:10px',
            'font-weight:700',
            'text-align:center',
            'box-shadow:0 1px 2px rgba(0,0,0,.4)'
        ].join(';');
        aba.prepend(badge);

        console.log(`[TwoElve] 🔢 Nova aba numerada: #${contadorAba}`);
        return String(contadorAba);
    };

    // ─── PROCESSAR ABA DA FILA ────────────────────────────────────────────────────
    const processarAba = async (novaAba) => {
        const protocolo = novaAba.querySelector('.MuiTypography-root.jss31');
        const cliente   = novaAba.querySelector('.jss30');
        const numero    = novaAba.getAttribute('data-twoelve-numero') || '-';

        console.log("[TwoElve] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("[TwoElve] 🆕 PROCESSANDO ABA!");
        console.log(`[TwoElve]    Numeração : #${numero}`);
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
            if (!saudacaoDisponivel()) {
                console.log("[TwoElve] 🔕 Saudação não disponível nesta versão (somente na branch dev).");
            } else if (window.TwoElveControle && window.TwoElveControle.autoMensagem === false) {
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
        // Correção: rescan SEMPRE após o reset — abas que chegaram durante o
        // processamento (com o mutation "engolido" pela flag) são detectadas agora.
        setTimeout(() => {
            jaProcessouNovaAba = false;
            console.log("[TwoElve] 🔄 Sistema resetado — rescaneando abas...");
            verificarEProcessarNovasAbas();
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
                marcarAbaComNumero(aba);
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

            // Rede de segurança: varredura periódica — garante que nenhuma aba nova
            // passe despercebida mesmo se algum mutation for perdido pelo observer.
            setInterval(() => {
                if (!jaProcessouNovaAba) verificarEProcessarNovasAbas();
            }, 10000);
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
                fila: filaDeAbas.length,
                abasNumeradas: contadorAba
            });
        }
    };

})();
