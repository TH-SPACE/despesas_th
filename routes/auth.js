const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/database');

// Rota de login
router.post('/login', async (req, res) => {
    try {
        const { usuario, senha } = req.body;

        if (!usuario || !senha) {
            return res.status(400).json({ 
                erro: 'Usuário e senha são obrigatórios' 
            });
        }

        // Buscar usuário no banco
        const [usuarios] = await db.query(
            'SELECT * FROM usuarios WHERE usuario = ?',
            [usuario]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({ 
                erro: 'Usuário ou senha incorretos' 
            });
        }

        const usuarioEncontrado = usuarios[0];

        // Verificar senha
        const senhaValida = await bcrypt.compare(senha, usuarioEncontrado.senha);

        if (!senhaValida) {
            return res.status(401).json({ 
                erro: 'Usuário ou senha incorretos' 
            });
        }

        // Criar sessão
        req.session.usuario = {
            id: usuarioEncontrado.id,
            usuario: usuarioEncontrado.usuario,
            nome: usuarioEncontrado.nome
        };

        res.json({ 
            sucesso: true, 
            mensagem: 'Login realizado com sucesso',
            usuario: req.session.usuario
        });

    } catch (erro) {
        console.error('Erro no login:', erro);
        res.status(500).json({ 
            erro: 'Erro ao realizar login' 
        });
    }
});

// Rota de logout
router.post('/logout', (req, res) => {
    req.session.destroy((erro) => {
        if (erro) {
            return res.status(500).json({ 
                erro: 'Erro ao fazer logout' 
            });
        }
        res.json({ 
            sucesso: true, 
            mensagem: 'Logout realizado com sucesso' 
        });
    });
});

// Rota para verificar sessão
router.get('/verificar-sessao', (req, res) => {
    if (req.session && req.session.usuario) {
        res.json({ 
            autenticado: true, 
            usuario: req.session.usuario 
        });
    } else {
        res.json({ 
            autenticado: false 
        });
    }
});

// Rota para cadastro de novo usuário
router.post('/cadastrar', async (req, res) => {
    try {
        const { usuario, senha } = req.body;

        if (!usuario || !senha) {
            return res.status(400).json({ 
                erro: 'Usuário e senha são obrigatórios' 
            });
        }

        if (senha.length < 6) {
            return res.status(400).json({ 
                erro: 'A senha deve ter no mínimo 6 caracteres' 
            });
        }

        // Verificar se usuário já existe
        const [usuarios] = await db.query(
            'SELECT id FROM usuarios WHERE usuario = ?',
            [usuario]
        );

        if (usuarios.length > 0) {
            return res.status(400).json({ 
                erro: 'Este usuário já está cadastrado' 
            });
        }

        // Hash da senha
        const senhaHash = await bcrypt.hash(senha, 10);

        // Inserir novo usuário
        await db.query(
            'INSERT INTO usuarios (usuario, nome, senha) VALUES (?, ?, ?)',
            [usuario, usuario, senhaHash]
        );

        res.json({ 
            sucesso: true, 
            mensagem: 'Usuário cadastrado com sucesso' 
        });

    } catch (erro) {
        console.error('Erro ao cadastrar:', erro);
        res.status(500).json({ 
            erro: 'Erro ao cadastrar usuário' 
        });
    }
});

module.exports = router;