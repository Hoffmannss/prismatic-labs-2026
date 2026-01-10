/**
 * Copyright Protection Script
 * Prismatic Labs - 2026
 * All Rights Reserved
 */

// Adiciona aviso de copyright ao rodapé
document.addEventListener('DOMContentLoaded', function() {
    // Localiza o rodapé
    const footerBottom = document.querySelector('.footer-bottom');
    
    if (footerBottom) {
        // Cria elemento de copyright
        const copyrightNotice = document.createElement('div');
        copyrightNotice.className = 'footer-copyright-notice';
        copyrightNotice.style.cssText = '
            text-align: center;
            padding: 15px 0;
            margin-top: 20px;
            border-top: 1px solid rgba(139, 92, 246, 0.2);
            font-size: 11px;
            color: rgba(255, 255, 255, 0.5);
            line-height: 1.6;
        ';
        
        copyrightNotice.innerHTML = `
            <p style="margin: 0; padding: 5px 0;">
                🔒 <strong>Propriedade Intelectual Protegida</strong> - Este website e todo seu conteúdo é propriedade exclusiva da Prismatic Labs.
            </p>
            <p style="margin: 0; padding: 5px 0;">
                ⚠️ Cópia, reprodução ou uso não autorizado está sujeito às penalidades da lei brasileira (Lei 9.610/98).
            </p>
        `;
        
        // Insere o aviso no rodapé
        footerBottom.appendChild(copyrightNotice);
    }
});

// Proteção contra cópia do texto (desabilita clique direito)
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    alert('🔒 Conteúdo protegido por copyright \u00a9 2026 Prismatic Labs');
    return false;
});

// Desabilita Ctrl+U (ver código fonte)
document.addEventListener('keydown', function(e) {
    // Ctrl+U ou Cmd+U
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        alert('🔒 Visualização de código fonte desabilitada. Conteúdo protegido.');
        return false;
    }
    
    // F12 (DevTools)
    if (e.key === 'F12') {
        e.preventDefault();
        return false;
    }
    
    // Ctrl+Shift+I ou Cmd+Option+I (DevTools)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        return false;
    }
    
    // Ctrl+Shift+J ou Cmd+Option+J (Console)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        return false;
    }
    
    // Ctrl+Shift+C ou Cmd+Option+C (Inspector)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        return false;
    }
});

// Adiciona marca d'água nos console logs
console.log('%c🔒 AVISO DE COPYRIGHT', 'color: #8b5cf6; font-size: 20px; font-weight: bold;');
console.log('%c© 2026 Prismatic Labs - All Rights Reserved', 'color: #8b5cf6; font-size: 14px;');
console.log('%c⚠️ Este código é propriedade exclusiva da Prismatic Labs.', 'color: #ef4444; font-size: 12px;');
console.log('%cCópia não autorizada é crime previsto na Lei 9.610/98.', 'color: #ef4444; font-size: 12px;');
