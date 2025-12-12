const express = require('express');
const router = express.Router();
const { verificarAutenticacao } = require('../middleware/auth');

// Rota protegida do dashboard
router.get('/dashboard', verificarAutenticacao, (req, res) => {
    res.json({ 
        usuario: req.session.usuario 
    });
});

module.exports = router;