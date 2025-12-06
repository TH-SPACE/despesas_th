const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const db = require('../config/database');
const { redirecionarSeAutenticado } = require('../middleware/auth');

// Login (POST)
router.post('/login', redirecionarSeAutenticado, async (req, res) => {
    const { usuario, senha } = req.body;

    try {
        const [usuarios] = await db.query(
            'SELECT * FROM usuarios WHERE usuario = ?',
            [usuario]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({ sucesso: false, mensagem: 'Usuário ou senha inválidos' });
        }

        const usuarioData = usuarios[0];
        const senhaValida = await bcrypt.compare(senha, usuarioData.senha);

        if (!senhaValida) {
            return res.status(401).json({ sucesso: false, mensagem: 'Usuário ou senha inválidos' });
        }

        req.session.usuarioId = usuarioData.id;
        req.session.usuarioNome = usuarioData.nome;
        req.session.usuarioEmail = usuarioData.usuario; // Usando usuario em vez de email

        res.json({ sucesso: true, mensagem: 'Login realizado com sucesso' });
    } catch (erro) {
        console.error('Erro no login:', erro);
        res.status(500).json({ sucesso: false, mensagem: 'Erro no servidor' });
    }
});

// Registro (POST) - Para criar os dois usuários iniciais
router.post('/registro', async (req, res) => {
    const { nome, usuario, senha } = req.body;

    try {
        const senhaHash = await bcrypt.hash(senha, 10);

        await db.query(
            'INSERT INTO usuarios (nome, usuario, senha) VALUES (?, ?, ?)',
            [nome, usuario, senhaHash]
        );

        res.json({ sucesso: true, mensagem: 'Usuário criado com sucesso' });
    } catch (erro) {
        if (erro.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ sucesso: false, mensagem: 'Nome de usuário já cadastrado' });
        }
        console.error('Erro no registro:', erro);
        res.status(500).json({ sucesso: false, mensagem: 'Erro no servidor' });
    }
});

// Logout
router.post('/logout', (req, res) => {
    req.session.destroy((erro) => {
        if (erro) {
            return res.status(500).json({ sucesso: false, mensagem: 'Erro ao fazer logout' });
        }
        res.clearCookie('connect.sid');
        res.json({ sucesso: true, mensagem: 'Logout realizado com sucesso' });
    });
});

module.exports = router;