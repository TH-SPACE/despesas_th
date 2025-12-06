const express = require('express');
const path = require('path');
const router = express.Router();
const { verificarAutenticacao, redirecionarSeAutenticado } = require('../middleware/auth');

// Página de login
router.get('/login', redirecionarSeAutenticado, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/login.html'));
});

// Página inicial redireciona para dashboard
router.get('/', (req, res) => {
    if (req.session && req.session.usuarioId) {
        return res.redirect('/dashboard');
    }
    res.redirect('/login');
});

// Dashboard
router.get('/dashboard', verificarAutenticacao, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

// Página de cadastro de despesas
router.get('/nova-despesa', verificarAutenticacao, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/nova-despesa.html'));
});

module.exports = router;