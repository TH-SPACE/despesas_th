// Middleware para verificar se o usuário está autenticado
function verificarAutenticacao(req, res, next) {
    if (req.session && req.session.usuario) {
        return next();
    }
    
    // Se for requisição AJAX, retorna JSON
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(401).json({ 
            erro: 'Não autenticado',
            redirect: '/login.html'
        });
    }
    
    // Se for requisição normal, redireciona
    return res.redirect('/login.html');
}

// Middleware para redirecionar usuários autenticados da página de login
function redirecionarSeAutenticado(req, res, next) {
    if (req.session && req.session.usuario) {
        return res.redirect('/dashboard.html');
    }
    next();
}

module.exports = {
    verificarAutenticacao,
    redirecionarSeAutenticado
};