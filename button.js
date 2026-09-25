// ==============================================
// BUTTON.JS - Padrão de Botões TwoElve v6.0
// ==============================================

(function() {
    const oldStyle = document.getElementById('twoelve-button-styles');
    if (oldStyle) oldStyle.remove();
    
    const style = document.createElement('style');
    style.id = 'twoelve-button-styles';
    style.textContent = `
        .twoelve-modal-container button {
            all: unset;
        }
        
        .twoelve-modal-container .twoelve-button,
        .twoelve-modal-container button:not(.twoelve-modal-close) {
            display: inline-block;
            padding: 12px 16px;
            font-size: 0.9em;
            font-weight: 600;
            background: var(--modal-custom-btn-bg, #ffffff);
            color: var(--modal-custom-btn-text, #1f2937);
            border: 2px solid var(--modal-custom-btn-border, #000000);
            border-radius: 0px;
            cursor: pointer;
            text-align: center;
            transition: all 0.08s linear;
            font-family: var(--modal-custom-font-family, 'Inter', sans-serif);
            box-shadow: 3px 3px 0px var(--modal-custom-btn-border, #000000);
            margin: 0;
            line-height: normal;
        }
        
        .twoelve-modal-container .twoelve-button:hover,
        .twoelve-modal-container button:not(.twoelve-modal-close):hover {
            background: repeating-linear-gradient(
                45deg,
                var(--modal-custom-btn-bg, #e5e7eb),
                var(--modal-custom-btn-bg, #e5e7eb) 2px,
                var(--modal-custom-btn-bg, #d1d5db) 2px,
                var(--modal-custom-btn-bg, #d1d5db) 4px
            );
            border-color: var(--modal-custom-border, #10b981);
            transform: translate(-2px, -2px);
            box-shadow: 5px 5px 0px var(--modal-custom-btn-border, #10b981);
        }
        
        .twoelve-modal-container .twoelve-button:active,
        .twoelve-modal-container button:not(.twoelve-modal-close):active {
            transform: translate(1px, 1px);
            box-shadow: 1px 1px 0px var(--modal-custom-btn-border, #000000);
        }
        
        .twoelve-buttons-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 12px;
            padding: 4px;
        }
        
        .twoelve-buttons-grid button {
            display: inline-block;
            padding: 12px 16px;
            font-size: 0.9em;
            font-weight: 600;
            background: var(--modal-custom-btn-bg, #ffffff);
            color: var(--modal-custom-btn-text, #1f2937);
            border: 2px solid var(--modal-custom-btn-border, #000000);
            border-radius: 0px;
            cursor: pointer;
            text-align: center;
            transition: all 0.08s linear;
            font-family: var(--modal-custom-font-family, 'Inter', sans-serif);
            box-shadow: 3px 3px 0px var(--modal-custom-btn-border, #000000);
        }
        
        .twoelve-buttons-grid button:hover {
            background: repeating-linear-gradient(
                45deg,
                var(--modal-custom-btn-bg, #e5e7eb),
                var(--modal-custom-btn-bg, #e5e7eb) 2px,
                var(--modal-custom-btn-bg, #d1d5db) 2px,
                var(--modal-custom-btn-bg, #d1d5db) 4px
            );
            border-color: var(--modal-custom-border, #10b981);
            transform: translate(-2px, -2px);
            box-shadow: 5px 5px 0px var(--modal-custom-btn-border, #10b981);
        }
        
        .twoelve-buttons-grid button:active {
            transform: translate(1px, 1px);
            box-shadow: 1px 1px 0px var(--modal-custom-btn-border, #000000);
        }
        
        .twoelve-button-primary {
            background: #10b981 !important;
            color: white !important;
        }
        
        .twoelve-button-primary:hover {
            background: #059669 !important;
            border-color: #000000 !important;
        }
        
        .twoelve-button-danger {
            background: #ef4444 !important;
            color: white !important;
        }
        
        .twoelve-button-danger:hover {
            background: #dc2626 !important;
            border-color: #000000 !important;
        }
        
        .twoelve-modal-close {
            display: inline-block !important;
            padding: 6px 14px !important;
            background: #ffffff !important;
            color: #1a1a1a !important;
            border: 2px solid #000000 !important;
            border-radius: 0px !important;
            box-shadow: 3px 3px 0px #000000 !important;
            font-size: 16px !important;
            font-weight: bold !important;
        }
        
        .twoelve-modal-close:hover {
            transform: translate(-2px, -2px) !important;
            box-shadow: 5px 5px 0px #000000 !important;
            background: #ffffff !important;
        }
    `;
    
    document.head.appendChild(style);
    
    console.log('✅ Button.js carregado');
})();