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
    autoOverlay: true
  };

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
    'autoOverlay', 'autoMensagem', 'twoelveConfig'
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
    setUpdateStatus('Validando a branch no GitHub…');

    const btn = $('btn-gerar-instalador');
    btn.disabled = true;

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

    // gera e baixa o instalador
    const bat = gerarInstalador(instalar);
    baixarBlob(new Blob([bat], { type: 'text/plain;charset=utf-8' }), 'instalar-twoelve.cmd');

    setUpdateStatus('✅ Instalador gerado! Dê dois cliques no instalar-twoelve.cmd — ele baixa o ZIP direto na pasta da extensão e instala, depois abre o chrome://extensions.', 'ok');
    btn.disabled = false;
  }

  // ---------- gerador do instalador (.cmd) ----------
  // Baixa o ZIP DIRETO NA PASTA da extensão (onde está o manifest.json),
  // extrai ali mesmo e substitui os arquivos — sem depender de %TEMP%.
  function gerarInstalador(use) {
    const TARGET = 'C:\\Users\\Lucas\\Desktop\\Extensao';
    const ps = (cmd) => 'powershell -NoProfile -ExecutionPolicy Bypass -Command "' + cmd + '"';
    return [
      '@echo off',
      'setlocal EnableExtensions',
      'title TwoElve - Atualizacao automatica',
      '',
      'set "REPO=' + REPO + '"',
      'set "BRANCH=' + use + '"',
      '',
      ':destino',
      'set "TARGET=' + TARGET + '"',
      'if exist "%TARGET%\\manifest.json" goto ok',
      'echo.',
      'echo Informe a pasta da extensao (onde esta o manifest.json):',
      'set /p "TARGET=> "',
      'if not exist "%TARGET%\\manifest.json" (',
      '  echo Nao encontrei manifest.json em "%TARGET%"',
      '  goto destino',
      ')',
      '',
      ':ok',
      'echo.',
      'echo ===========================================',
      'echo  TwoElve - Atualizacao automatica',
      'echo  Repositorio : %REPO%  (branch %BRANCH%)',
      'echo  Pasta       : %TARGET%',
      'echo ===========================================',
      'echo.',
      '',
      'echo [1/3] Baixando o ZIP da extensao direto na pasta...',
      ps("Invoke-WebRequest -Uri 'https://codeload.github.com/%REPO%/zip/refs/heads/%BRANCH%' -OutFile '%TARGET%\\twoelve-atual.zip'"),
      'if errorlevel 1 goto falha',
      '',
      'echo [2/3] Extraindo na pasta da extensao...',
      ps("if(Test-Path '%TARGET%\\twoelve_extraido'){Remove-Item -Recurse -Force '%TARGET%\\twoelve_extraido'}; Expand-Archive -Path '%TARGET%\\twoelve-atual.zip' -DestinationPath '%TARGET%\\twoelve_extraido' -Force"),
      'if errorlevel 1 goto falha',
      '',
      'echo [3/3] Substituindo os arquivos...',
      'for /d %%D in ("%TARGET%\\twoelve_extraido\\*") do xcopy "%%D\\*" "%TARGET%\\" /e /y /q >nul',
      'if errorlevel 1 goto falha',
      '',
      'echo.',
      'echo  Limpando temporarios...',
      'if exist "%TARGET%\\twoelve-atual.zip" del /q "%TARGET%\\twoelve-atual.zip"',
      'if exist "%TARGET%\\twoelve_extraido" rmdir /s /q "%TARGET%\\twoelve_extraido"',
      '',
      'echo.',
      'echo  Concluido! Agora recarregue a extensao:',
      'echo    chrome://extensions',
      'start chrome chrome://extensions 2>nul',
      'timeout /t 8 >nul',
      'exit /b 0',
      '',
      ':falha',
      'echo.',
      'echo  Erro durante a atualizacao. Confira o repositorio e a branch.',
      'pause',
      'exit /b 1',
      ''
    ].join('\r\n');
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
    $('config-overlay').checked = c.autoOverlay !== false;

    atualizarSwatches();
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

      // toggles de automação ficam em chaves próprias (autoMensagem/autoOverlay)
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const resAut = await chrome.storage.local.get(['autoMensagem', 'autoOverlay']);
        configAtual.autoMensagem = resAut.autoMensagem !== false;
        configAtual.autoOverlay = resAut.autoOverlay !== false;
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
    $('btn-gerar-instalador').addEventListener('click', aoAtualizar);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();