// ==============================================
// MODAL BASE - CORRIGIDO (X funcionando e drag isolado)
// ==============================================

(function() {
    if (!document.getElementById('modal-base-styles')) {
        const style = document.createElement('style');
        style.id = 'modal-base-styles';
        style.textContent = `
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            .twoelve-modal-container {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: var(--modal-custom-bg, #ffffff);
                border: 2px solid var(--modal-custom-border, #000000);
                box-shadow: 8px 8px 0px var(--modal-custom-border, #000000);
                min-width: 320px;
                max-width: 95vw;
                width: auto;
                height: auto;
                display: flex;
                flex-direction: column;
                z-index: 10000;
                font-size: var(--modal-custom-font-size, 14px);
                font-family: var(--modal-custom-font-family, 'Inter', sans-serif);
                color: var(--modal-custom-text, #1a1a1a);
                opacity: var(--modal-custom-opacity, 1);
                overflow: hidden;
            }

            .twoelve-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 16px;
                background: var(--modal-custom-bg, #ffffff);
                border-bottom: 2px solid var(--modal-custom-border, #000000);
            }
            
            .twoelve-modal-title {
                font-size: 1.2em;
                font-weight: 700;
                color: var(--modal-custom-text, #1f2937);
                margin: 0;
                user-select: none;
                cursor: move;
                flex: 1;
            }

            .twoelve-modal-close {
                background: var(--modal-custom-btn-bg, #ffffff);
                border: 2px solid var(--modal-custom-btn-border, #000000);
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                color: var(--modal-custom-btn-text, #1a1a1a);
                padding: 6px 14px;
                transition: all 0.08s linear;
                box-shadow: 3px 3px 0px var(--modal-custom-btn-border, #000000);
                margin-left: 12px;
                position: relative;
                z-index: 10001;
            }

            .twoelve-modal-close:hover {
                transform: translate(-2px, -2px);
                box-shadow: 5px 5px 0px var(--modal-custom-border, #000000);
            }

            .twoelve-modal-close:active {
                transform: translate(1px, 1px);
                box-shadow: 1px 1px 0px var(--modal-custom-btn-border, #000000);
            }

            /* Hide native scrollbars but keep scrolling capability when needed */
            .twoelve-modal-body {
                padding: 20px;
                flex: 1;
                overflow-y: auto;
                max-height: 90vh;
                min-height: 180px;
                background: var(--modal-custom-bg, #ffffff);
                color: var(--modal-custom-text, #1a1a1a);
                font-size: 1em;
                -ms-overflow-style: none; /* IE/Edge */
                scrollbar-width: none; /* Firefox */
                width: 100%;
                box-sizing: border-box;
            }

            /* Apply hiding to all scrollbar thumbs within modals (covers nested scrollable elements) */
            .twoelve-modal-container, .twoelve-modal-container * {
                -ms-overflow-style: none; /* IE/Edge */
                scrollbar-width: none; /* Firefox */
            }

            .twoelve-modal-container *::-webkit-scrollbar {
                width: 0px;
                height: 0px;
            }

            .twoelve-modal-content {
                width: 100%;
                height: 100%;
                box-sizing: border-box;
            }

            /* Garante que TUDO dentro do body ocupa 100% da largura disponível */
            .twoelve-modal-body > *,
            .twoelve-modal-content > * {
                width: 100%;
                box-sizing: border-box;
                max-width: 100%;
            }

            /* GRID RESPONSIVO DE INPUTS
               Inputs ficam lado a lado automaticamente conforme o modal alarga.
               Mínimo de 180px por input — abaixo disso empilha em coluna. */
            .twoelve-modal-body form,
            .twoelve-modal-body .twoelve-form {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
                gap: 12px;
                width: 100%;
                box-sizing: border-box;
            }

            /* Elementos que devem sempre ocupar a linha inteira */
            .twoelve-modal-body form textarea,
            .twoelve-modal-body .twoelve-form textarea,
            .twoelve-modal-body form .twoelve-full,
            .twoelve-modal-body .twoelve-form .twoelve-full,
            .twoelve-modal-body form button,
            .twoelve-modal-body .twoelve-form button,
            .twoelve-modal-body form label,
            .twoelve-modal-body .twoelve-form label {
                grid-column: 1 / -1;
            }

            /* Wrapper de campo (label + input juntos ocupam uma célula) */
            .twoelve-field {
                display: flex;
                flex-direction: column;
                gap: 4px;
                box-sizing: border-box;
            }

            .twoelve-field label {
                font-size: 12px;
                font-weight: 600;
                color: var(--modal-custom-text, #1a1a1a);
                grid-column: unset;
            }

            .twoelve-field input,
            .twoelve-field select,
            .twoelve-field textarea {
                width: 100%;
            }

            /* ESTILO PADRÃO PARA INPUTS - FUNDO #cccccc */
            .twoelve-modal-body input,
            .twoelve-modal-body textarea,
            .twoelve-modal-body select {
                width: 100%;
                padding: 10px 12px;
                border: 2px solid #000000;
                background: #cccccc;
                font-family: inherit;
                font-size: 13px;
                box-sizing: border-box;
            }

            .twoelve-modal-body textarea {
                resize: vertical;
                min-height: 80px;
            }

            .twoelve-modal-body input:focus,
            .twoelve-modal-body textarea:focus,
            .twoelve-modal-body select:focus {
                outline: none;
                border-color: #10b981;
            }

            /* RESIZE HANDLE */
            .twoelve-modal-resize-handle {
                position: absolute;
                right: -4px;
                top: 0;
                width: 8px;
                height: 100%;
                cursor: ew-resize;
                z-index: 10002;
                background: transparent;
            }

            .twoelve-modal-resize-handle::after {
                content: '';
                position: absolute;
                right: 3px;
                top: 50%;
                transform: translateY(-50%);
                width: 2px;
                height: 32px;
                background: var(--modal-custom-border, #000000);
                opacity: 0.25;
                border-radius: 2px;
                transition: opacity 0.15s;
            }

            .twoelve-modal-resize-handle:hover::after {
                opacity: 0.6;
            }

            /* MINIMIZE BUTTON - herda tudo de .twoelve-modal-close */
            .twoelve-modal-minimize {
                margin-left: 8px;
                position: relative;
                z-index: 10001;
            }

            /* MINIMIZED STATE */
            .twoelve-modal-container.twoelve-minimized {
                position: fixed !important;
                bottom: 16px !important;
                right: 16px !important;
                left: auto !important;
                top: auto !important;
                transform: none !important;
                width: auto !important;
                min-width: unset !important;
                height: auto !important;
                box-shadow: 4px 4px 0px var(--modal-custom-border, #000000);
                animation: twoelve-minimize-in 0.18s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .twoelve-modal-container.twoelve-minimized .twoelve-modal-body {
                display: none;
            }

            .twoelve-modal-container.twoelve-minimized .twoelve-modal-resize-handle {
                display: none;
            }

            .twoelve-modal-container.twoelve-minimized .twoelve-modal-title {
                cursor: pointer;
                font-size: 1em;
            }

            @keyframes twoelve-minimize-in {
                from { transform: scale(1); opacity: 0.7; }
                to   { transform: scale(1); opacity: 1; }
            }

            /* ===== MODO LATERAL: modais viram painéis fixos encostados na lateral ===== */
            body.twoelve-lateral .twoelve-modal-container {
                top: 0;
                right: 96px;
                bottom: 0;
                left: auto;
                transform: none;
                width: 340px;
                min-width: 280px;
                max-width: calc(100vw - 108px);
                min-height: 100vh;
                max-height: 100vh;
                height: auto;
                border: 0;
                border-left: 2px solid var(--modal-custom-border, #000000);
                box-shadow: -6px 6px 0px var(--modal-custom-border, #000000);
                animation: twoelve-panel-in 0.22s cubic-bezier(0.4, 0, 0.2, 1);
            }
            body.twoelve-lateral .twoelve-modal-body {
                min-height: 0;
                max-height: none;
            }
            body.twoelve-lateral .twoelve-modal-resize-handle {
                display: none;
            }
            body.twoelve-lateral .twoelve-modal-minimize {
                display: none;
            }
            @keyframes twoelve-panel-in {
                from { transform: translateX(100%); }
                to   { transform: none; }
            }
        `;
        document.head.appendChild(style);
    }

    class TwoelveModalBase {
        constructor(titulo = '') {
            this.container = null;
            this.contentArea = null;
            this.titleElement = null;
            this.closeBtn = null;
            this.minimizeBtn = null;
            this.onFechar = null;
            this._mousemoveHandler = null;
            this._mouseupHandler = null;
            this._isDragging = false;
            this._isResizing = false;
            this._isMinimized = false;
            this._savedPos = null; // posição antes de minimizar
            this.titulo = titulo;
            this._storageKey = null; // definido ao abrir com título
        }

        setTitulo(titulo) {
            this.titulo = titulo;
            if (this.titleElement) {
                this.titleElement.innerHTML = titulo;
            }
            return this;
        }

        abrir() {
            if (this.container) {
                this.fechar();
                return this;
            }

            // Esconde a toolbar (no modo lateral as abas ficam visíveis)
            const lateral = document.body.classList.contains('twoelve-lateral');
            if (!lateral) {
                const toolbar = document.querySelector('.twoelve-sidebar');
                if (toolbar) toolbar.style.display = 'none';
            }

            this.container = document.createElement('div');
            this.container.className = 'twoelve-modal-container';

            const header = document.createElement('div');
            header.className = 'twoelve-modal-header';
            
            this.titleElement = document.createElement('div');
            this.titleElement.className = 'twoelve-modal-title';
            this.titleElement.innerHTML = this.titulo || 'TwoElve';
            
            this.closeBtn = document.createElement('button');
            this.closeBtn.className = 'twoelve-modal-close';
            this.closeBtn.textContent = '✕';
            
            this.closeBtn.onclick = (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.fechar();
            };
            
            this.closeBtn.onmousedown = (e) => {
                e.stopPropagation();
                e.preventDefault();
            };

            this.minimizeBtn = document.createElement('button');
            this.minimizeBtn.className = 'twoelve-modal-close twoelve-modal-minimize';
            this.minimizeBtn.textContent = '—';
            this.minimizeBtn.title = 'Minimizar';

            this.minimizeBtn.onclick = (e) => {
                e.stopPropagation();
                e.preventDefault();
                this._toggleMinimize();
            };

            this.minimizeBtn.onmousedown = (e) => {
                e.stopPropagation();
                e.preventDefault();
            };
            
            header.appendChild(this.titleElement);
            header.appendChild(this.minimizeBtn);
            header.appendChild(this.closeBtn);

            const body = document.createElement('div');
            body.className = 'twoelve-modal-body';
            
            this.contentArea = document.createElement('div');
            this.contentArea.className = 'twoelve-modal-content';
            body.appendChild(this.contentArea);

            this.container.appendChild(header);
            this.container.appendChild(body);
            document.body.appendChild(this.container);

            // Resize handle (lado direito) — desativado no modo lateral
            const resizeHandle = document.createElement('div');
            resizeHandle.className = 'twoelve-modal-resize-handle';
            this.container.appendChild(resizeHandle);
            if (!lateral) this._makeResizable(resizeHandle);

            // Restaurar largura salva (chrome.storage.local — persiste entre sessões)
            this._storageKey = 'twoelve-modal-width-' + (this.titulo || 'default').replace(/\s+/g, '_');
            if (!lateral) {
                chrome.storage.local.get([this._storageKey]).then((res) => {
                    const savedWidth = res && res[this._storageKey];
                    if (savedWidth && this.container) {
                        this.container.style.width = savedWidth + 'px';
                    }
                }).catch(() => {});
            }

            if (!lateral) this._makeDraggable(this.titleElement);
            
            window._ultimoModalAberto = this;
            
            return this;
        }

        fechar() {
            if (this.container) {
                this._removeDragEvents();
                this._removeResizeEvents();
                this.container.remove();
                this.container = null;
                this.contentArea = null;
                this.closeBtn = null;
                this.minimizeBtn = null;
                this._isMinimized = false;
                
                if (this.onFechar) {
                    this.onFechar();
                }
                
                if (window._ultimoModalAberto === this) {
                    window._ultimoModalAberto = null;
                }
            }

            // Mostra a toolbar novamente
            const toolbar = document.querySelector('.twoelve-sidebar');
            if (toolbar) toolbar.style.display = 'flex';
            
            return this;
        }

        setConteudo(html) {
            if (this.contentArea) {
                this.contentArea.innerHTML = html;
            }
            return this;
        }

        setConteudoElemento(elemento) {
            if (this.contentArea && elemento) {
                this.contentArea.innerHTML = '';
                this.contentArea.appendChild(elemento);
            }
            return this;
        }

        setFecharCallback(callback) {
            this.onFechar = callback;
            return this;
        }

        _toggleMinimize() {
            if (!this.container) return;
            this._isMinimized = !this._isMinimized;

            if (this._isMinimized) {
                // Salva posição/tamanho atual
                this._savedPos = {
                    left: this.container.style.left,
                    top: this.container.style.top,
                    width: this.container.style.width,
                    transform: this.container.style.transform,
                };
                this.container.classList.add('twoelve-minimized');
                this.minimizeBtn.textContent = '▲';
                this.minimizeBtn.title = 'Restaurar';
                // Ao clicar no título minimizado, restaura
                this.titleElement.addEventListener('click', this._restoreFromMinimize = () => {
                    if (this._isMinimized) this._toggleMinimize();
                });
            } else {
                this.container.classList.remove('twoelve-minimized');
                // Restaura posição
                if (this._savedPos) {
                    this.container.style.left = this._savedPos.left;
                    this.container.style.top = this._savedPos.top;
                    this.container.style.width = this._savedPos.width;
                    this.container.style.transform = this._savedPos.transform;
                    this._savedPos = null;
                }
                this.minimizeBtn.textContent = '—';
                this.minimizeBtn.title = 'Minimizar';
                if (this._restoreFromMinimize) {
                    this.titleElement.removeEventListener('click', this._restoreFromMinimize);
                    this._restoreFromMinimize = null;
                }
            }
        }

        _makeResizable(handle) {
            let startX = 0;
            let startWidth = 0;

            const onMouseDown = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this._isResizing = true;
                startX = e.clientX;
                startWidth = this.container.getBoundingClientRect().width;

                // Fixa posição para evitar salto durante resize
                const rect = this.container.getBoundingClientRect();
                this.container.style.left = rect.left + 'px';
                this.container.style.top = rect.top + 'px';
                this.container.style.transform = 'none';
            };

            const onMouseMove = (e) => {
                if (!this._isResizing) return;
                const delta = e.clientX - startX;
                const newWidth = Math.max(280, startWidth + delta);
                this.container.style.width = newWidth + 'px';
            };

            const onMouseUp = () => {
                if (!this._isResizing) return;
                this._isResizing = false;
                // Salva largura no chrome.storage.local (persiste entre sessões)
                if (this._storageKey) {
                    const w = Math.round(this.container.getBoundingClientRect().width);
                    try { chrome.storage.local.set({ [this._storageKey]: w }); } catch (e) {}
                }
            };

            this._resizeMouseDown = onMouseDown;
            this._resizeMouseMove = onMouseMove;
            this._resizeMouseUp = onMouseUp;

            handle.addEventListener('mousedown', this._resizeMouseDown);
            window.addEventListener('mousemove', this._resizeMouseMove);
            window.addEventListener('mouseup', this._resizeMouseUp);
        }

        _removeResizeEvents() {
            if (this._resizeMouseMove) window.removeEventListener('mousemove', this._resizeMouseMove);
            if (this._resizeMouseUp) window.removeEventListener('mouseup', this._resizeMouseUp);
        }

        _makeDraggable(dragElement) {
            if (!dragElement) return;
            
            let startX = 0, startY = 0;
            let startLeft = 0, startTop = 0;
            
            const onMouseDown = (e) => {
                if (e.target === this.closeBtn) return;
                if (e.target === this.minimizeBtn) return;
                if (e.target.closest('.twoelve-modal-close')) return;
                if (e.target.closest('.twoelve-modal-minimize')) return;
                if (this._isMinimized) return; // não arrasta minimizado
                
                this._isDragging = true;
                
                const rect = this.container.getBoundingClientRect();
                startLeft = rect.left;
                startTop = rect.top;
                startX = e.clientX;
                startY = e.clientY;
                
                this.container.style.position = 'fixed';
                this.container.style.left = startLeft + 'px';
                this.container.style.top = startTop + 'px';
                this.container.style.transform = 'none';
                
                e.preventDefault();
            };
            
            const onMouseMove = (e) => {
                if (!this._isDragging) return;
                
                let newLeft = startLeft + (e.clientX - startX);
                let newTop = startTop + (e.clientY - startY);
                
                this.container.style.left = newLeft + 'px';
                this.container.style.top = newTop + 'px';
            };
            
            const onMouseUp = () => {
                this._isDragging = false;
            };
            
            this._mousedownHandler = onMouseDown;
            this._mousemoveHandler = onMouseMove;
            this._mouseupHandler = onMouseUp;
            
            dragElement.addEventListener('mousedown', this._mousedownHandler);
            window.addEventListener('mousemove', this._mousemoveHandler);
            window.addEventListener('mouseup', this._mouseupHandler);
        }
        
        _removeDragEvents() {
            if (this.titleElement && this._mousedownHandler) {
                this.titleElement.removeEventListener('mousedown', this._mousedownHandler);
            }
            
            if (this._mousemoveHandler) {
                window.removeEventListener('mousemove', this._mousemoveHandler);
            }
            
            if (this._mouseupHandler) {
                window.removeEventListener('mouseup', this._mouseupHandler);
            }
        }
    }

    window.TwoelveModalBase = TwoelveModalBase;

    console.log('✅ Modal Base carregado!');
})();