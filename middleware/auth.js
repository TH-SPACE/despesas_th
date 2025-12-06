function verificarAutenticacao(req, res, next) {
  if (req.session && req.session.usuarioId) {
    return next();
  }
  res.redirect("/login");
}

function redirecionarSeAutenticado(req, res, next) {
  if (req.session && req.session.usuarioId) {
    return res.redirect("/dashboard");
  }
  next();
}

module.exports = {
  verificarAutenticacao,
  redirecionarSeAutenticado,
};
