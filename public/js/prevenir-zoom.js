// Prevenir zoom usando JavaScript
function prevenirZoom() {
    // Prevenir zoom com combinação de Ctrl + '+' ou Ctrl + '-' ou Ctrl + roda do mouse
    document.addEventListener('keydown', function(e) {
        // Verificar se Ctrl ou Cmd (Mac) está pressionado junto com +/-/0
        if ((e.ctrlKey || e.metaKey) && (e.keyCode === 187 || e.keyCode === 189 || e.keyCode === 48)) {
            e.preventDefault();
        }
        
        // Prevenir Ctrl + 0 (resetar zoom)
        if ((e.ctrlKey || e.metaKey) && e.keyCode === 57) { // 57 é o código da tecla 0
            e.preventDefault();
        }
    });

    // Prevenir zoom com roda do mouse segurando Ctrl
    document.addEventListener('wheel', function(e) {
        if (e.ctrlKey) {
            e.preventDefault();
        }
    }, { passive: false });

    // Prevenir toque com zoom (toque com dois dedos ou mais)
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(e) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, false);

    // Prevenir zoom em dispositivos móveis
    document.addEventListener('gesturestart', function(e) {
        e.preventDefault();
    });
    
    document.addEventListener('gesturechange', function(e) {
        e.preventDefault();
    });
    
    document.addEventListener('gestureend', function(e) {
        e.preventDefault();
    });
}

// Executar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', prevenirZoom);
} else {
    prevenirZoom();
}