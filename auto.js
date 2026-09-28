// auto.js - Versão com correções de bugs (v2)
// Correções aplicadas:
//   [bug#2] Reset do jaProcessouNovaAba movido para fora do if/else — garante reset em atendimentos encaminhados
//   [bug#3] jaProcessouNovaAba setado imediatamente na entrada da função — elimina race condition em async
//   [bug#5] Fila de abas pendentes + marcação com data-twoelve-processada — garante processamento progressivo
//   [v6.1.21] Identificação por NÓ da aba (entra na hora, sem esperar mensagem);
//             baseline curto pós-refresh (abas já abertas são avaliadas de novo);
//             saudação só depois de OBSERVAR O CHAT (.omni-chat-header + [data-message-id]):
//             se a saudação já estiver na conversa OU já houver atendente humano
//             (encaminhada/em andamento) → não envia.
(function() {
    console.log("[TwoElve] 🚀 Iniciando auto.js...");

    // Saudação automática existe SOMENTE na branch dev (flag "twoelveSaudacao" no manifest)
    const saudacaoDisponivel = () => {
        try { return !!chrome.runtime.getManifest().twoelveSaudacao; } catch (e) { return false; }
    };

    let jaProcessouNovaAba = false;
    let observadorAtivo = true;
    const filaDeAbas = []; // [bug#5] fila para múltiplas abas simultâneas
    let contadorAba = 0;   // numeração das abas de atendimento (badge + atributo)
    const abasConhecidas = new WeakSet(); // [v6.1.21] abas já vistas (por elemento do DOM)
    const pendentes = new Map();          // [v6.1.21] abas aguardando marcadores de atendimento

    // Conjunto de atendimentos JÁ processados nesta sessão (por protocolo|cliente ou
    // texto da aba). Evita numerar 2x e reenviar saudação quando o ERP recria a aba
    // ou o título muda (ex.: cliente responde) — o ID antigo "sumia" e a aba
    // parecia nova de novo.
    const chavesProcessadas = new Set();

    // Só considera aba de atendimento: tem protocolo/cliente (classes jss) OU
    // texto contendo número (protocolo). Ignora abas fantasma vazias do MUI e
    // abas internas de outros componentes (ex.: "Informações", "Histórico").
    const ehAbaDeAtendimento = (aba) => {
        if (!aba) return false;
        if (aba.querySelector('.MuiTypography-root.jss33, .MuiTypography-root.jss31, .jss32, .jss30')) return true;
        return /\d/.test(aba.textContent || '');
    };

    // Chave estável para rastrear o MESMO atendimento mesmo se o elemento for
    // recriado pelo React: protocolo|cliente quando existir, senão o texto da aba.
    const getChaveEstavel = (aba) => {
        const protocolo = aba.querySelector('.MuiTypography-root.jss33, .MuiTypography-root.jss31');
        const cliente   = aba.querySelector('.jss32, .jss30');
        const p = protocolo ? protocolo.textContent.trim() : '';
        const c = cliente   ? cliente.textContent.trim()   : '';
        if (p) return 'p|' + p + '|' + c;
        const texto = (aba.textContent || '').replace(/\s+/g, ' ').trim();
        return texto ? 't|' + texto : null;
    };

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

    // Elemento visível de verdade (outras extensões injetam DOM; só o que aparece
    // na tela pode ser o campo/aba do ERP)
    const ehVisivel = (el) => {
        if (!el) return false;
        try {
            const r = el.getBoundingClientRect();
            return r.width > 0 && r.height > 0;
        } catch (e) {
            return false;
        }
    };

    // ─── ENCONTRAR CAMPO DE MENSAGEM (prioriza a área do chat do ERP) ─────────────
    // 1) textarea DENTRO do container do botão "Enviar mensagem" (mesma área de chat).
    // 2) seletores MUI/DevExtreme específicos do ERP, visíveis.
    // Nunca devolve textarea invisível ou de outra extensão (chat flutuante etc.).
    const encontrarCampoMensagem = () => {
        const botaoEnviar = encontrarBotaoEnviar();
        if (botaoEnviar) {
            let no = botaoEnviar.botao;
            for (let i = 0; no && i < 6; i++) {
                no = no.parentElement;
                if (!no) break;
                for (const sel of SELETORES_TEXTAREA) {
                    for (const c of Array.from(no.querySelectorAll(sel))) {
                        if (ehVisivel(c) && !c.readOnly && !c.disabled) return c;
                    }
                }
            }
        }
        for (const sel of SELETORES_TEXTAREA) {
            const el = document.querySelector(sel);
            if (el && ehVisivel(el) && !el.readOnly && !el.disabled) return el;
        }
        return null;
    };

    function aguardarCampoMensagem(timeout) {
        return new Promise((resolve) => {
            const limite = timeout || 6000;
            const inicio = Date.now();
            const checar = () => {
                const el = encontrarCampoMensagem();
                if (el) {
                    console.log("[TwoElve] ✅ Campo de mensagem encontrado:", el);
                    return resolve(el);
                }
                if (Date.now() - inicio >= limite) {
                    console.warn("[TwoElve] ⏱️ Timeout aguardando campo de mensagem");
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
            'button[type="submit"][title="Enviar mensagem"]',
            'button[type="submit"].MuiIconButton-root',
            'button[type="submit"]',
            'button[aria-label*="enviar" i], button[title*="enviar" i], button[tooltip*="enviar" i]',
            'button[aria-label*="send" i], button[title*="send" i], button[tooltip*="send" i]'
        ];
        for (const sel of candidatos) {
            const el = document.querySelector(sel);
            if (el) return { botao: el, origem: sel };
        }
        // varredura por texto/atributos contendo "enviar"/"send"
        const alvo = Array.from(document.querySelectorAll('button')).find((b) => {
            const texto = ((b.textContent || '') + ' ' +
                (b.getAttribute('aria-label') || '') + ' ' +
                (b.getAttribute('title') || '') + ' ' +
                (b.getAttribute('tooltip') || '')).toLowerCase();
            return (texto.includes('enviar') || texto.includes('send')) && texto.length < 60;
        });
        if (alvo) return { botao: alvo, origem: 'texto contém enviar/send' };
        // último recurso: ícone do Material "send" (setinha ↗) dentro de um botão
        const icone = Array.from(document.querySelectorAll('button svg path')).find((p) => {
            const d = (p.getAttribute('d') || '').replace(/\s+/g, '');
            return d.includes('2.01') && d.includes('M2.01');
        });
        if (icone) {
            const botao = icone.closest('button');
            if (botao) return { botao, origem: 'ícone material send (svg)' };
        }
        return null;
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
            // sequência completa de clique (foco + pointer/mouse) para botões MUI/React
            try { botao.focus(); } catch (e) {}
            botao.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerType: 'mouse' }));
            botao.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
            botao.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
            botao.click();
            resolve(true);
        };
        tentar();
    });

    // ─── ESCREVER NO CHAT ─────────────────────────────────────────────────────────
    async function escreverNoChat(elemento, valor) {
        if (!elemento) return false;
        try {
            // foca o campo como se o atendente estivesse digitando (habilita o botão enviar)
            try { elemento.focus(); } catch (e) {}
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

            // captura o botão JÁ (antes do delay) — se o React recriar o nó na espera,
            // re-busca no momento do clique para nunca cair em "botão saiu do DOM"
            const alvo = encontrarBotaoEnviar();
            const delayMs = Math.floor(Math.random() * (3000 - 2000 + 1)) + 2000; // 2–3s (antes do rescan de 5s)
            console.log(`[TwoElve] 🕐 Horário comercial (${horas}:${String(minutos).padStart(2,'0')}) — aguardando ${(delayMs/1000).toFixed(1)}s para enviar...`);

            const tentarEnter = () => {
                console.warn("[TwoElve] ⚠️ Botão de enviar indisponível — tentando Enter como último recurso.");
                textarea.dispatchEvent(new KeyboardEvent('keydown', {
                    key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true
                }));
            };

            setTimeout(async () => {
                // re-busca um nó FRESCO do botão (o React pode ter recriado o elemento)
                const fresco = encontrarBotaoEnviar();
                const alvoFinal = (fresco && document.body.contains(fresco.botao)) ? fresco : (
                    (alvo && document.body.contains(alvo.botao)) ? alvo : null
                );

                if (!alvoFinal) {
                    tentarEnter();
                    return resolve(false);
                }

                console.log(`[TwoElve] 🎯 Botão enviar encontrado — ${alvoFinal.origem}`);
                const clicado = await clicarBotaoEnviar(alvoFinal.botao);
                if (clicado) {
                    // confere se a mensagem saiu do campo (indica envio de fato)
                    setTimeout(() => {
                        const campoAtual = encontrarCampoMensagem();
                        const restou = campoAtual && (campoAtual.value || '').trim();
                        if (restou) {
                            console.warn("[TwoElve] ⚠️ Clique no enviar executado, mas ainda há texto no campo — confira se a mensagem saiu.");
                        } else {
                            console.log("[TwoElve] 📤 Mensagem enviada automaticamente!");
                        }
                    }, 1500);
                } else {
                    tentarEnter();
                }
                resolve(clicado);
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

    // ─── OBSERVAR O CHAT (saudação já enviada? / já atendido por humano?) ────────
    // Lê a conversa do Omni (.omni-chat-header + mensagens [data-message-id]) para
    // decidir se a saudação PODE ser enviada. Evita enviar 2x e evita saudação em
    // conversa encaminhada/em andamento (atendente humano já escreveu antes).
    const TERMOS_SAUDACAO = ['bom dia', 'boa tarde', 'boa noite'];
    const COR_ATENDENTE = 'rgb(98,100,108)';  // cor do nome no lado atendente/bot
    const COR_CLIENTE = 'rgb(238,238,238)';   // cor do nome no lado do cliente
    const normalizarCor = (v) => String(v || '').replace(/\s+/g, '');

    const encontrarChatAtual = () => {
        const campo = Array.from(document.querySelectorAll('textarea')).find(t =>
            /digite sua mensagem/i.test(t.placeholder || '') && ehVisivel(t));
        if (!campo) return null;
        let no = campo;
        for (let i = 0; i < 12 && no; i++) {
            no = no.parentElement;
            if (no && no.querySelector('[data-message-id]') && no.querySelector('.omni-chat-header')) return no;
        }
        return null;
    };

    const lerMensagensDoChat = (chat) => {
        if (!chat) return [];
        return Array.from(chat.querySelectorAll('[data-message-id]')).map((m) => {
            const autorEl = m.querySelector('p.MuiTypography-root[style*="font-weight: 600"]');
            const nome = autorEl ? (autorEl.textContent || '').replace(/:$/, '').trim() : '';
            const cor = autorEl ? normalizarCor(autorEl.style.color) : '';
            const corpo = m.querySelector('.mention-content') || m.querySelector('.jss7939') || m;
            return {
                nome,
                ehBot: /elo\s*bot/i.test(nome) || nome === '',
                ehAtendente: cor === COR_ATENDENTE,
                ehCliente: cor === COR_CLIENTE,
                texto: (corpo.textContent || '').replace(/\s+/g, ' ').trim(),
                quando: (m.getAttribute('title') || '').trim()
            };
        });
    };

    const saudacaoJaEnviada = (msgs) =>
        msgs.some(m => TERMOS_SAUDACAO.some(s => (m.texto || '').toLowerCase().includes(s)));

    const conversaJaAtendida = (msgs) =>
        msgs.some(m => m.ehAtendente && !m.ehBot);

    // Verificação completa antes de saudar: aguarda o chat abrir e só libera se a
    // conversa ainda não foi atendida por humano e a saudação ainda não está lá.
    const verificarChatAntesDeSaudar = async (timeout) => {
        const limite = timeout || 7000;
        const inicio = Date.now();
        let chat = encontrarChatAtual();
        while (!chat && Date.now() - inicio < limite) {
            await new Promise(r => setTimeout(r, 300));
            chat = encontrarChatAtual();
        }
        if (!chat) {
            console.warn("[TwoElve] ⚠️ Chat não encontrado — saudação NÃO enviada (só envia com conversa aberta).");
            return { ok: false, motivo: 'chat não encontrado' };
        }
        const msgs = lerMensagensDoChat(chat);
        if (saudacaoJaEnviada(msgs)) {
            console.log("[TwoElve] ✅ Saudação JÁ está na conversa — não vou enviar de novo.");
            return { ok: false, motivo: 'saudação já enviada' };
        }
        if (conversaJaAtendida(msgs)) {
            console.log("[TwoElve] ⏭️ Conversa já foi atendida por atendente humano (encaminhada/em andamento) — sem saudação.");
            return { ok: false, motivo: 'conversa já atendida' };
        }
        console.log(`[TwoElve] 💬 Chat verificado: ${msgs.length} mensagem(ns), sem saudação e sem atendente humano — ok para saudar.`);
        return { ok: true };
    };

    // ─── PREENCHER MENSAGEM ───────────────────────────────────────────────────────
    const preencherMensagem = async () => {
        if (!saudacaoDisponivel()) {
            console.log("[TwoElve] 🔕 Saudação indisponível nesta versão (somente na branch dev).");
            return false;
        }

        const controles = window.TwoElveControle || {};

        const textarea = await aguardarCampoMensagem(7000);

        if (!textarea) {
            console.log("[TwoElve] ❌ Campo de mensagem não encontrado após espera");
            return false;
        }

        // não sobrescreve o que o atendente já digitou
        if ((textarea.value || '').trim()) {
            console.log("[TwoElve] ℹ️ Campo já possui texto — saudação não sobrescreve:", textarea.value);
            return true;
        }

        // saudação por horário SEMPRE, com a mensagem personalizada junto (se houver)
        const horas = new Date().getHours();
        const saudacaoHorario = horas < 12 ? "Bom dia" : horas < 18 ? "Boa tarde" : "Boa noite";
        const personalizada = (controles.saudacaoMensagem || '').trim();
        const mensagem = personalizada
            ? saudacaoHorario + ", " + personalizada
            : saudacaoHorario + ", como posso ajudar?";

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

    // ─── INJETAR NUMERAÇÃO NA ABA ─────────────────────────────────────────────────
    // Injeta um badge visível com o número sequencial + atributo data-twoelve-numero.
    // Chamada apenas para abas NOVAS detectadas (evita marcar abas de navegação).
    const marcarAbaComNumero = (aba) => {
        if (!aba || !ehAbaDeAtendimento(aba)) return null;
        const existente = aba.getAttribute('data-twoelve-numero');
        if (existente) return existente;

        // mesma conversa já processada (aba recriada) → não conta nem numera de novo
        const chave = getChaveEstavel(aba);
        if (chave && chavesProcessadas.has(chave)) return null;

        contadorAba += 1;
        aba.setAttribute('data-twoelve-numero', String(contadorAba));
        if (chave) chavesProcessadas.add(chave);

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

        // registra a conversa como tratada ANTES de processar — se o protocolo
        // carregar durante o fluxo, a chave nova já fica marcada (sem reenvio)
        const chaveAtual = getChaveEstavel(novaAba);
        if (chaveAtual) chavesProcessadas.add(chaveAtual);

        await clicarBotaoListagem();
        await selecionarAba(novaAba);

        console.log("[TwoElve] ⏳ Aguardando conteúdo da nova aba carregar...");
        await aguardarElemento('.ql-editor.dx-htmleditor-content', 4000);
        await new Promise(r => setTimeout(r, 300));

        const tipo = verificarTipoAtendimento();

        if (!saudacaoDisponivel()) {
            console.log("[TwoElve] 🔕 Saudação não disponível nesta versão (somente na branch dev).");
        } else if (window.TwoElveControle && window.TwoElveControle.autoMensagem === false) {
            console.log("[TwoElve] 🔕 Saudação desativada pelo toggle.");
        } else if (tipo === "encaminhado") {
            console.log("[TwoElve] ⏭️ Atendimento encaminhado (1 campo) — saudação não enviada.");
        } else if (tipo === "normal" || tipo === "desconhecido") {
            // [v6.1.21] Observa o CHAT antes de saudar: não envia se a saudação já
            // estiver na conversa ou se ela já foi atendida por outro atendente
            // (também cobre a tela Omni, onde não há campos .ql-editor).
            const verificado = await verificarChatAntesDeSaudar(7000);
            if (!verificado.ok) {
                console.log(`[TwoElve] 🚫 Saudação pulada: ${verificado.motivo}`);
            } else {
                await preencherMensagem();
                console.log("[TwoElve] 🎯 Saudação processada com sucesso!");
            }
        } else {
            console.log("[TwoElve] ⚠️ Tipo de atendimento inesperado — sem saudação.");
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
    // Detecção por NÓ (elemento do DOM), não por texto: a aba é reconhecida assim
    // que o elemento aparece, sem esperar protocolo/mensagem. Abas que ainda não
    // têm marcadores de atendimento entram numa janela de retry (pendentes) e são
    // descartadas se continuarem vazias (fantasmas do MUI / abas internas).
    const avaliarNovaAba = (aba) => {
        if (!aba || abasConhecidas.has(aba)) return;
        abasConhecidas.add(aba);
        if (!ehVisivel(aba)) return;
        if (ehAbaDeAtendimento(aba)) {
            const numero = marcarAbaComNumero(aba);
            aba.setAttribute('data-twoelve-processada', 'true');
            filaDeAbas.push(aba);
            console.log(`[TwoElve] 🔢 Nova aba de atendimento identificada na hora (#${numero || '-'}).`);
        } else {
            // acabou de aparecer sem protocolo/cliente — dá uma janela para carregar
            pendentes.set(aba, { tentativas: 0 });
            agendarRetryDeAba(aba);
        }
    };

    const agendarRetryDeAba = (aba) => {
        const info = pendentes.get(aba);
        if (!info || info.tentativas >= 25) { // ~20s sem virar atendimento → descarta (fantasma)
            if (info) pendentes.delete(aba);
            return;
        }
        info.tentativas += 1;
        setTimeout(() => {
            if (!document.body.contains(aba)) { pendentes.delete(aba); return; }
            if (ehAbaDeAtendimento(aba)) {
                pendentes.delete(aba);
                const numero = marcarAbaComNumero(aba);
                aba.setAttribute('data-twoelve-processada', 'true');
                filaDeAbas.push(aba);
                console.log(`[TwoElve] 🔢 Aba reconhecida assim que o conteúdo carregou (#${numero || '-'}).`);
                verificarEProcessarNovasAbas();
            } else {
                agendarRetryDeAba(aba);
            }
        }, 800);
    };

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

            const abasAtuais = Array.from(document.querySelectorAll('[role="tab"]')).filter(ehVisivel);
            if (abasAtuais.length === 0) {
                jaProcessouNovaAba = false;
                return;
            }

            abasAtuais.forEach(avaliarNovaAba);

            if (filaDeAbas.length > 0) {
                const proximaAba = filaDeAbas.shift();
                await processarAba(proximaAba);
            } else {
                jaProcessouNovaAba = false;
            }
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
    // Baseline CURTO + avaliação das abas já abertas: após F5 o número/saudação
    // funcionam de novo (a saudação é protegida pelo check do chat no processarAba).
    const iniciarMonitoramento = () => {
        if (!document.body) {
            console.log("[TwoElve] ⏳ Aguardando DOM carregar...");
            setTimeout(iniciarMonitoramento, 500);
            return;
        }

        console.log("[TwoElve] ⏳ Aguardando estabilização rápida (4s)...");

        setTimeout(() => {
            const abasIniciais = Array.from(document.querySelectorAll('[role="tab"]')).filter(ehVisivel);
            abasIniciais.forEach(avaliarNovaAba);
            console.log(`[TwoElve] 📊 Baseline: ${abasIniciais.length} aba(s) existente(s) avaliada(s).`);

            observer.observe(document.body, { childList: true, subtree: true });
            console.log("[TwoElve] 👀 Monitoramento ativo! Novas abas = identificadas na hora.");

            if (filaDeAbas.length > 0) verificarEProcessarNovasAbas();

            // Rede de segurança: varredura periódica — garante que nenhuma aba nova
            // passe despercebida mesmo se algum mutation for perdido pelo observer.
            setInterval(() => {
                if (!jaProcessouNovaAba) verificarEProcessarNovasAbas();
            }, 5000);
        }, 4000);
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
            pendentes.clear();
            console.log("[TwoElve] 🔄 Sistema resetado manualmente! Fila limpa.");
        },
        status: () => {
            console.log("[TwoElve] 📊 Status:", {
                processou: jaProcessouNovaAba,
                abasAguardandoMarcadores: pendentes.size,
                ativo: observadorAtivo,
                fila: filaDeAbas.length,
                abasNumeradas: contadorAba,
                conversasProcessadas: chavesProcessadas.size
            });
        }
    };

})();
