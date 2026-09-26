// ==============================================
// CONFIG-PAGE.JS - Página de Configurações TwoElve
// Abre em nova aba (config.html). Contém todas as
// configurações da extensão, cada uma em seu card.
// ==============================================

(() => {
  'use strict';

  // ---------- constantes (iguais ao config.js) ----------
  const DEFAULTS = {
    fonte: { familia: 'Inter', tamanho: '14px' },
    cores: {
      fundo: '#ffffff',
      borda: '#000000',
      texto: '#1a1a1a',
      botaoFundo: '#ffffff',
      botaoTexto: '#1a1a1a',
      botaoBorda: '#000000'
    },
    opacidade: 1,
    usarEmotes: true,
    autoMensagem: true,
    autoOverlay: true,
    temaPagina: 'claro',
    saudacaoMensagem: '',
    saudacaoPrevia: false,
    toolbarLayout: 'superior',
    larguraAba: 64
  };

  // saudação automática existe SOMENTE na branch dev (flag "twoelveSaudacao" no manifest)
  const USA_SAUDACAO = (() => {
    try { return !!chrome.runtime.getManifest().twoelveSaudacao; } catch (e) { return false; }
  })();

  const PRESET_THEMES = {
    'Library': {
      fundo: '#f4f1ea', borda: '#4a3c31', texto: '#2b221a',
      botaoFundo: '#ebdcb9', botaoBorda: '#4a3c31', botaoTexto: '#2b221a'
    },
    'Mint': {
      fundo: '#f1fbf7', borda: '#114b3e', texto: '#0a2e26',
      botaoFundo: '#d2f5e8', botaoBorda: '#114b3e', botaoTexto: '#0a2e26'
    }
  };

  const FONTES = [
    'Inter', 'Arial', 'Helvetica', 'Verdana', 'Tahoma', 'Trebuchet MS',
    'Roboto', 'Open Sans', 'Lato', 'Poppins', 'Montserrat', 'Oswald',
    'Raleway', 'Nunito', 'Ubuntu', 'Cabin', 'Merriweather', 'Playfair Display',
    'Source Code Pro', 'Courier New', 'Georgia', 'Times New Roman'
  ];

  const TAMANHOS_FONTE = [];
  for (let i = 10; i <= 72; i++) TAMANHOS_FONTE.push(i + 'px');

  const REPO = 'martinirp/twoelve';

  const CAMPOS_COR = ['fundo', 'borda', 'texto', 'botaoFundo', 'botaoBorda', 'botaoTexto'];
  const NOMES_COR = {
    fundo: 'Cor de Fundo',
    borda: 'Cor das Bordas',
    texto: 'Cor do Texto',
    botaoFundo: 'Botão — Fundo',
    botaoBorda: 'Botão — Borda',
    botaoTexto: 'Botão — Texto'
  };
  const PALETA = [
    '#000000', '#1a1a1a', '#333333', '#555555', '#777777', '#999999', '#bbbbbb', '#dddddd', '#ffffff',
    '#1f2937', '#10b981', '#059669', '#3b82f6', '#2563eb', '#ef4444', '#dc2626', '#f59e0b', '#8b5cf6',
    '#f4f1ea', '#4a3c31', '#2b221a', '#ebdcb9', '#f1fbf7', '#114b3e', '#0a2e26', '#d2f5e8',
    '#dbeafe', '#e0f2fe', '#fef9c3', '#fee2e2', '#fce7f3', '#e5e7eb', '#0f766e', '#b45309'
  ];

  const EXPORT_KEYS = [
    'customButtons', 'customVisits', 'whitePanelMessages',
    'forwardButtons', 'customTheme', 'controleAbas',
    'autoOverlay', 'autoMensagem', 'saudacaoMensagem', 'saudacaoPrevia',
    'twoelveConfig'
  ];

  const $ = (id) => document.getElementById(id);
  const statusPage = $('status-msg');
  const statusUpdate = $('update-status');

  let configAtual = { ...DEFAULTS };

  // ---------- helpers ----------
  function setStatus(msg, tipo = '') {
    statusPage.hidden = false;
    statusPage.textContent = msg;
    statusPage.className = 'status' + (tipo ? ' ' + tipo : '');
  }

  function baixarBlob(blob, nome) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  // ==============================================
  // ATUALIZAÇÃO VIA GITHUB
  // ==============================================
  function setUpdateStatus(msg, tipo = '') {
    statusUpdate.hidden = false;
    statusUpdate.textContent = msg;
    statusUpdate.className = 'status mt-3' + (tipo ? ' ' + tipo : '');
  }

  function getSelecao() {
    const b = $('config-branch').value; // 'main' | 'dev'
    return { instalar: b === 'dev' ? 'dev' : 'main', selecao: b === 'dev' ? 'dev' : 'main' };
  }

  async function salvarSelecao(selecao) {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({
          twoelveUpdateBranches: { use: 'main', dev: 'dev', selecionada: selecao }
        });
      }
    } catch (e) {}
  }

  async function branchExiste(branch) {
    try {
      const r = await fetch('https://api.github.com/repos/' + REPO + '/branches/' + encodeURIComponent(branch));
      return r.ok;
    } catch (e) {
      return null; // erro de rede
    }
  }

  async function verificarVersao() {
    const { instalar } = getSelecao();

    setUpdateStatus('🔍 Consultando o GitHub…');
    const existe = await branchExiste(instalar);
    if (existe === null) {
      setUpdateStatus('Falha ao acessar o GitHub (sem conexão?).', 'erro');
      return;
    }
    if (!existe) {
      setUpdateStatus('Branch “' + instalar + '” não encontrada. O repositório pode estar vazio.', 'erro');
      return;
    }

    let versaoGit = null;
    try {
      const r = await fetch('https://raw.githubusercontent.com/' + REPO + '/' + encodeURIComponent(instalar) + '/manifest.json');
      if (r.ok) versaoGit = (await r.json()).version;
    } catch (e) {}

    const versaoLocal = (() => {
      try { return chrome.runtime.getManifest().version || '?'; } catch (e) { return '?'; }
    })();
    if (!versaoGit) {
      setUpdateStatus('Branch “' + instalar + '” OK. Não consegui ler a versão no manifest.json do repositório.', 'ok');
      return;
    }
    if (versaoGit === versaoLocal) {
      setUpdateStatus('✅ Você está atualizado — local v' + versaoLocal + ' = repositório v' + versaoGit + '.', 'ok');
    } else {
      setUpdateStatus('🚀 Nova versão disponível: repositório v' + versaoGit + ' → local v' + versaoLocal + '.');
    }
  }

  async function aoAtualizar() {
    const { instalar } = getSelecao();
    const btn = $('btn-instalar');
    btn.disabled = true;

    setUpdateStatus('Validando a branch no GitHub…');

    const u = await branchExiste(instalar);
    if (u === null) {
      setUpdateStatus('Falha de rede ao acessar o GitHub.', 'erro');
      btn.disabled = false;
      return;
    }
    if (!u) {
      setUpdateStatus('Branch “' + instalar + '” não encontrada. Envie o código para o GitHub antes de atualizar.', 'erro');
      btn.disabled = false;
      return;
    }

    // 1) baixa o ZIP no navegador
    setUpdateStatus('⬇️ Baixando o ZIP da branch “' + instalar + '” do GitHub…');
    let zip = null;
    try {
      const resp = await fetch('https://codeload.github.com/' + REPO + '/zip/refs/heads/' + encodeURIComponent(instalar));
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      zip = new Uint8Array(await resp.arrayBuffer());
    } catch (e) {
      setUpdateStatus('Falha ao baixar o ZIP do GitHub (sem conexão?).', 'erro');
      btn.disabled = false;
      return;
    }

    // 2) usuário escolhe a pasta onde a extensão está instalada
    if (typeof window.showDirectoryPicker !== 'function') {
      setUpdateStatus('Este navegador é antigo e não suporta escolher pasta (File System Access API). Atualize o Chrome (86+) e tente de novo.', 'erro');
      btn.disabled = false;
      return;
    }

    let dirHandle = null;
    try {
      dirHandle = await window.showDirectoryPicker({
        id: 'twoelve-instalar',
        mode: 'readwrite',
        startIn: 'desktop'
      });
    } catch (e) {
      btn.disabled = false;
      if (e && e.name === 'AbortError') {
        setUpdateStatus('Instalação cancelada — nenhuma pasta foi selecionada.', 'aviso');
      } else {
        setUpdateStatus('Não consegui abrir a escolha de pasta: ' + (e.message || e), 'erro');
      }
      return;
    }

    // confere se é mesmo a pasta da extensão (tem o manifest.json)
    let manifestHandle = null;
    try { manifestHandle = await dirHandle.getFileHandle('manifest.json'); } catch (e) {}
    if (!manifestHandle) {
      setUpdateStatus('A pasta escolhida não é da extensão (faltou o manifest.json). Nada foi alterado.', 'erro');
      btn.disabled = false;
      return;
    }

    // 3) extrai o ZIP dentro da pasta escolhida
    setUpdateStatus('📂 Extraindo os arquivos na pasta da extensão…');
    const arquivos = lerZip(zip, instalar);
    if (!arquivos) {
      setUpdateStatus('Não consegui ler o ZIP baixado.', 'erro');
      btn.disabled = false;
      return;
    }
    if (arquivos.length === 0) {
      setUpdateStatus('O ZIP não tinha arquivos para instalar. Confira a branch no GitHub.', 'erro');
      btn.disabled = false;
      return;
    }

    let okGrava = 0;
    try {
      for (let i = 0; i < arquivos.length; i++) {
        const a = arquivos[i];
        const bytes = a.metodo === 8 ? await inflarRaw(a.dados) : a.dados;
        await gravarArquivoZip(dirHandle, a.rel, bytes);
        okGrava++;
        setUpdateStatus('📂 Extraindo na pasta da extensão… (' + okGrava + '/' + arquivos.length + ') ' + a.rel);
      }
    } catch (e) {
      setUpdateStatus('Erro ao gravar os arquivos na pasta: ' + (e.message || e), 'erro');
      btn.disabled = false;
      return;
    }

    // 4) confirma a versão que ficou gravada no manifest.json
    let versaoNova = '?';
    try {
      const m = await (await manifestHandle.getFile()).json();
      versaoNova = m.version || '?';
    } catch (e) {}

    setUpdateStatus('✅ Instalado! v' + versaoNova + ' gravada na pasta da extensão (' + okGrava + ' arquivo(s)). Agora recarregue a extensão em chrome://extensions.', 'ok');
    btn.disabled = false;

    try { chrome.tabs.create({ url: 'chrome://extensions' }); } catch (e) {}
  }

  // ---------- leitor de ZIP (puro JS, sem bibliotecas) ----------
  // Lê o ZIP que o GitHub gera no codeload (pasta raiz "<repositorio>-<branch>/")
  // e devolve a lista de arquivos: { rel, metodo, dados } prontos para gravar.
  function lerZip(uf8, branch) {
    const view = new DataView(uf8.buffer, uf8.byteOffset, uf8.byteLength);
    const u8 = (o, tam) => uf8.subarray(o, o + tam);
    const u16 = (o) => view.getUint16(o, true);
    const u32 = (o) => view.getUint32(o, true);

    // 1) acha o fim do ZIP: End of Central Directory (PK\x05\x06), de trás pra frente
    const EOCD = 0x06054b50;
    let fim = -1;
    const inicio = Math.max(0, uf8.length - 65557);
    for (let i = uf8.length - 22; i >= inicio; i--) {
      if (u32(i) === EOCD) { fim = i; break; }
    }
    if (fim < 0) return null;

    const qtd   = u16(fim + 10);
    const tamCD = u32(fim + 12);
    const offCD = u32(fim + 16);
    if (qtd === 0 || offCD + tamCD > uf8.length) return null;

    const raiz = REPO.split('/')[1] + '-' + branch + '/';
    const arquivos = [];
    let off = offCD;

    // 2) percorre o diretório central (PK\x01\x02)
    for (let n = 0; n < qtd; n++) {
      if (u32(off) !== 0x02014b50) break;
      const metodo    = u16(off + 10);
      const tamComp   = u32(off + 20);
      const nomeLen   = u16(off + 28);
      const extraLen  = u16(off + 30);
      const comentLen = u16(off + 32);
      const offLocal  = u32(off + 42);

      let nome = '';
      try { nome = new TextDecoder('utf-8').decode(u8(off + 46, nomeLen)); } catch (e) {}

      const prox = off + 46 + nomeLen + extraLen + comentLen;
      if (!nome.endsWith('/') && (metodo === 0 || metodo === 8)) {
        let rel = nome;
        if (rel.startsWith(raiz)) rel = rel.slice(raiz.length);
        if (rel && !rel.split('/').includes('..') && u32(offLocal) === 0x04034b50) {
          const nomeLocLen  = u16(offLocal + 26);
          const extraLocLen = u16(offLocal + 28);
          const dadosIni = offLocal + 30 + nomeLocLen + extraLocLen;
          if (dadosIni + tamComp <= uf8.length) {
            arquivos.push({ rel, metodo, dados: u8(dadosIni, tamComp) });
          }
        }
      }
      off = prox;
    }

    return arquivos;
  }

  // infla um bloco "deflate-raw" (método 8 do ZIP) com o DecompressionStream nativo
  async function inflarRaw(bytes) {
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  // grava um arquivo em subpastas, criando as pastas que faltarem
  async function gravarArquivoZip(dirHandle, rel, bytes) {
    const partes = rel.split('/');
    const nomeArquivo = partes.pop();
    let pasta = dirHandle;
    for (const p of partes) {
      pasta = await pasta.getDirectoryHandle(p, { create: true });
    }
    const arq = await pasta.getFileHandle(nomeArquivo, { create: true });
    const writable = await arq.createWritable();
    await writable.write(bytes);
    await writable.close();
  }

  // ==============================================
  // CARREGAR / SALVAR CONFIGURAÇÃO
  // ==============================================
  function preencherForm() {
    const c = configAtual;

    $('config-tema').value = (c.tema === undefined || !c.tema) ? 'padrao' : c.tema;
    $('config-fonte').value = c.fonte.familia || 'Inter';
    $('config-tamanho').value = c.fonte.tamanho || '14px';
    $('config-opacidade').value = c.opacidade ?? 1;
    $('opacidade-valor').textContent = Math.round((c.opacidade ?? 1) * 100) + '%';
    $('config-emotes').checked = c.usarEmotes !== false;
    $('config-saudacao').checked = c.autoMensagem !== false;
    $('config-saudacao-mensagem').value = c.saudacaoMensagem || '';
    $('config-saudacao-previa').checked = c.saudacaoPrevia === true;
    $('config-overlay').checked = c.autoOverlay !== false;

    aplicarTemaPagina(c.temaPagina || 'claro', false);

    // layout da toolbar (Superior/Lateral)
    const layoutRadio = document.querySelector('input[name="twoelve-toolbar-layout"][value="' + (c.toolbarLayout === 'lateral' ? 'lateral' : 'superior') + '"]');
    if (layoutRadio) layoutRadio.checked = true;

    // largura da aba no modo Lateral
    const largura = c.larguraAba ?? 64;
    $('config-largura-aba').value = largura;
    $('largura-aba-valor').textContent = largura + 'px';

    atualizarSwatches();
  }

  // ---------- tema da própria página (claro/escuro) ----------
  function aplicarTemaPagina(tema, salvar) {
    const escuro = tema === 'escuro';
    document.body.classList.toggle('tema-escuro', escuro);
    document.querySelectorAll('#config-tema-pagina button').forEach((btn) => {
      btn.classList.toggle('ativa', btn.dataset.tema === tema);
    });
    if (salvar !== false && tema !== (configAtual.temaPagina || 'claro')) {
      salvarConfiguracoes({ temaPagina: tema });
    }
  }

  // ---------- swatches e diálogo de cor ----------
  function atualizarSwatches() {
    CAMPOS_COR.forEach((k) => {
      const cor = configAtual.cores[k] || DEFAULTS.cores[k] || '#ffffff';
      const btn = document.querySelector('[data-alvo="' + k + '"]');
      const lab = document.querySelector('[data-hex="' + k + '"]');
      if (btn) btn.style.background = cor;
      if (lab) lab.textContent = cor.toUpperCase();
    });
  }

  function hexParaRgb(hex) {
    const h = String(hex || '').replace('#', '');
    if (!/^[0-9a-f]{6}$/i.test(h)) return [0, 0, 0];
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function rgbParaHex(r, g, b) {
    const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
    const p = (v) => clamp(v).toString(16).padStart(2, '0');
    return '#' + p(r) + p(g) + p(b);
  }

  let alvoCor = 'fundo';
  let corDialog = '#ffffff';

  function atualizarDialogCor() {
    $('preview-cor').style.background = corDialog;
    $('hex-cor').value = corDialog.toUpperCase();
    const [r, g, b] = hexParaRgb(corDialog);
    $('range-r').value = r;
    $('range-g').value = g;
    $('range-b').value = b;
    $('valor-r').textContent = r;
    $('valor-g').textContent = g;
    $('valor-b').textContent = b;
    document.querySelectorAll('.paleta-cor .sw').forEach((s) => {
      s.classList.toggle('ativa', s.dataset.cor.toLowerCase() === corDialog.toLowerCase());
    });
  }

  function abrirDialogCor(k) {
    alvoCor = k;
    corDialog = (configAtual.cores[k] || DEFAULTS.cores[k] || '#ffffff').toLowerCase();
    $('modal-cor-titulo').textContent = '🎨 ' + (NOMES_COR[k] || 'Cor');
    atualizarDialogCor();
    bootstrap.Modal.getOrCreateInstance($('modal-cor')).show();
  }

  function aplicarCorDialog() {
    const k = alvoCor;
    const novaCores = { ...configAtual.cores, [k]: corDialog };
    salvarConfiguracoes({ cores: novaCores });
    configAtual.cores = novaCores;
    atualizarSwatches();
    bootstrap.Modal.getInstance($('modal-cor')).hide();
  }

  async function carregarConfiguracoes() {
    try {
      const res = (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local)
        ? await chrome.storage.local.get(['twoelveConfig'])
        : {};
      configAtual = { ...DEFAULTS, ...(res.twoelveConfig || {}) };
      configAtual.cores = { ...DEFAULTS.cores, ...(configAtual.cores || {}) };
      configAtual.fonte = { ...DEFAULTS.fonte, ...(configAtual.fonte || {}) };

      // toggles de automação ficam em chaves próprias
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const resAut = await chrome.storage.local.get(['autoMensagem', 'autoOverlay', 'saudacaoMensagem', 'saudacaoPrevia']);
        configAtual.autoMensagem = resAut.autoMensagem !== false;
        configAtual.autoOverlay = resAut.autoOverlay !== false;
        configAtual.saudacaoMensagem = resAut.saudacaoMensagem || '';
        configAtual.saudacaoPrevia = resAut.saudacaoPrevia === true;
      }

      // versão sem saudação (main): esconde os controles de saudação da página
      if (!USA_SAUDACAO) {
        document.querySelectorAll('[data-saudacao]').forEach((el) => { el.style.display = 'none'; });
      }
    } catch (e) {
      console.error('Erro ao carregar configurações:', e);
    }
    preencherForm();
  }

  async function salvarConfiguracoes(patch) {
    configAtual = { ...configAtual, ...patch };
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({ twoelveConfig: configAtual });
        // avisa as abas do ERP para reaplicarem o estilo na hora
        if (chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({ action: 'twoelve-config-changed' }, () => {});
        }
      }
    } catch (e) {
      console.error('Erro ao salvar:', e);
    }
  }

  // toggles de automação → chaves próprias no storage (autoMensagem/autoOverlay)
  async function salvarToggleAutomatizacao(patch) {
    configAtual = { ...configAtual, ...patch };
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set(patch);
        // avisa as abas do ERP para atualizarem os controles na hora
        if (chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({ action: 'twoelve-config-changed' }, () => {});
        }
      }
    } catch (e) {
      console.error('Erro ao salvar automação:', e);
    }
  }

  // ==============================================
  // EVENTOS DO FORMULÁRIO (ao vivo, salva a cada mudança)
  // ==============================================
  function configurarEventos() {
    $('config-tema').addEventListener('change', (e) => {
      aplicarTema(e.target.value);
    });

    $('config-fonte').addEventListener('change', (e) => {
      salvarConfiguracoes({ fonte: { ...configAtual.fonte, familia: e.target.value } });
    });

    $('config-tamanho').addEventListener('change', (e) => {
      salvarConfiguracoes({ fonte: { ...configAtual.fonte, tamanho: e.target.value } });
    });

    $('config-opacidade').addEventListener('input', (e) => {
      const valor = parseFloat(e.target.value);
      $('opacidade-valor').textContent = Math.round(valor * 100) + '%';
      salvarConfiguracoes({ opacidade: valor });
    });

    $('config-emotes').addEventListener('change', (e) => {
      salvarConfiguracoes({ usarEmotes: e.target.checked });
    });

    $('config-saudacao').addEventListener('change', (e) => {
      salvarToggleAutomatizacao({ autoMensagem: e.target.checked });
    });

    $('config-overlay').addEventListener('change', (e) => {
      salvarToggleAutomatizacao({ autoOverlay: e.target.checked });
    });

    $('config-saudacao-mensagem').addEventListener('change', (e) => {
      salvarToggleAutomatizacao({ saudacaoMensagem: e.target.value.trim() });
    });

    $('config-saudacao-previa').addEventListener('change', (e) => {
      salvarToggleAutomatizacao({ saudacaoPrevia: e.target.checked });
    });

    // tema da própria página (claro/escuro)
    document.querySelectorAll('#config-tema-pagina button').forEach((btn) => {
      btn.addEventListener('click', () => aplicarTemaPagina(btn.dataset.tema));
    });

    // layout da toolbar (Superior/Lateral — um desmarca o outro)
    document.querySelectorAll('input[name="twoelve-toolbar-layout"]').forEach((radio) => {
      radio.addEventListener('change', () => {
        if (radio.checked) salvarConfiguracoes({ toolbarLayout: radio.value });
      });
    });

    // largura da aba lateral
    $('config-largura-aba').addEventListener('input', (e) => {
      const valor = parseInt(e.target.value, 10) || 64;
      $('largura-aba-valor').textContent = valor + 'px';
      salvarConfiguracoes({ larguraAba: valor });
    });

    // swatches de cor → abrem o diálogo centralizado
    document.querySelectorAll('.swatch-cor').forEach((sw) => {
      sw.addEventListener('click', () => abrirDialogCor(sw.dataset.alvo));
    });

    // ---------- importar / exportar ----------
    $('btn-exportar').addEventListener('click', exportarDados);
    $('btn-importar').addEventListener('click', () => $('file-import').click());
    $('file-import').addEventListener('change', importarDados);
  }

  function aplicarTema(val) {
    if (val === 'personalizado') return;
    if (val === 'padrao') {
      salvarConfiguracoes({ cores: { ...DEFAULTS.cores }, tema: 'padrao' });
      preencherForm();
      return;
    }
    const theme = PRESET_THEMES[val];
    if (theme) {
      const novasCores = { ...configAtual.cores, ...theme };
      salvarConfiguracoes({ cores: novasCores, tema: val });
      preencherForm();
    }
  }

  // ==============================================
  // EXPORTAR / IMPORTAR
  // ==============================================
  async function exportarDados() {
    try {
      const result = await chrome.storage.local.get(EXPORT_KEYS);
      const exportData = { exportadoEm: new Date().toISOString(), versao: '1.0', dados: result };
      baixarBlob(
        new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' }),
        'twoelve_backup_' + new Date().toISOString().slice(0, 19).replace(/:/g, '-') + '.json'
      );
      setStatus('✅ Exportado com sucesso!', 'ok');
    } catch (e) {
      setStatus('❌ Erro ao exportar: ' + e.message, 'erro');
    }
  }

  async function importarDados(event) {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;

    try {
      const text = await file.text();
      const importData = JSON.parse(text);
      if (!importData.dados || typeof importData.dados !== 'object') {
        throw new Error('Arquivo inválido');
      }
      await chrome.storage.local.set(importData.dados);
      await carregarConfiguracoes();
      setStatus('✅ Importado! As abas do ERP reaplicam na hora.', 'ok');
    } catch (e) {
      setStatus('❌ Erro ao importar: ' + e.message, 'erro');
    }
  }

  // ==============================================
  // DIÁLOGO DE COR (centralizado)
  // ==============================================
  function configurarDialogCor() {
    // monta a paleta
    const paleta = $('paleta-cor');
    PALETA.forEach((hex) => {
      const sw = document.createElement('button');
      sw.type = 'button';
      sw.className = 'sw';
      sw.dataset.cor = hex;
      sw.style.background = hex;
      sw.title = hex;
      sw.addEventListener('click', () => {
        corDialog = hex;
        aplicarCorDialog();
      });
      paleta.appendChild(sw);
    });

    // HEX digitado
    $('hex-cor').addEventListener('input', (e) => {
      const v = e.target.value.replace('#', '');
      if (/^[0-9a-f]{6}$/i.test(v)) {
        corDialog = '#' + v.toLowerCase();
        atualizarDialogCor();
        $('hex-cor').value = corDialog.toUpperCase();
      }
    });

    // sliders RGB
    const montarSlider = (id, canal) => {
      $(id).addEventListener('input', (e) => {
        const [r, g, b] = hexParaRgb(corDialog);
        const n = parseInt(e.target.value, 10);
        const nova = canal === 'r' ? [n, g, b] : canal === 'g' ? [r, n, b] : [r, g, n];
        corDialog = rgbParaHex(nova[0], nova[1], nova[2]);
        atualizarDialogCor();
      });
    };
    montarSlider('range-r', 'r');
    montarSlider('range-g', 'g');
    montarSlider('range-b', 'b');

    // botão Aplicar
    $('btn-aplicar-cor').addEventListener('click', aplicarCorDialog);
  }

  // ==============================================
  // INIT
  // ==============================================
  async function init() {
    // preenche selects de fonte e tamanho
    FONTES.forEach((f) => {
      const opt = document.createElement('option');
      opt.value = f;
      opt.textContent = f;
      $('config-fonte').appendChild(opt);
    });
    TAMANHOS_FONTE.forEach((t) => {
      const opt = document.createElement('option');
      opt.value = t;
      opt.textContent = t;
      $('config-tamanho').appendChild(opt);
    });

    $('versao-local').textContent = 'v' + (() => {
      try { return chrome.runtime.getManifest().version || '?'; } catch (e) { return '?'; }
    })();

    await carregarConfiguracoes();
    configurarEventos();
    configurarDialogCor();

    // branch salva para o modal de atualização (default: main)
    try {
      const res = await chrome.storage.local.get(['twoelveUpdateBranches']);
      const sel = res.twoelveUpdateBranches && res.twoelveUpdateBranches.selecionada;
      $('config-branch').value = sel === 'dev' ? 'dev' : 'main';
    } catch (e) {}

    $('config-branch').addEventListener('change', () => salvarSelecao($('config-branch').value));
    $('btn-verificar').addEventListener('click', verificarVersao);
    $('btn-instalar').addEventListener('click', aoAtualizar);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();