const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/db');
const { verificarAutenticacao } = require('../middleware/auth');

// Todas as rotas exigem autenticação
router.use(verificarAutenticacao);

// Criar novo usuário
router.post('/', async (req, res) => {
    try {
        const { usuario, nome, senha } = req.body;

        // Validações
        if (!nome || !usuario || !senha) {
            return res.status(400).json({ erro: 'Nome, nome de usuário e senha são obrigatórios' });
        }

        if (senha.length < 6) {
            return res.status(400).json({ erro: 'A senha deve ter no mínimo 6 caracteres' });
        }

        // Verificar se nome de usuário já existe
        const usuarioExistente = db.getUsuarioByNome(usuario);
        if (usuarioExistente) {
            return res.status(400).json({ erro: 'Este nome de usuário já está em uso' });
        }

        // Criar hash da senha
        const senhaHash = await bcrypt.hash(senha, 10);

        // Criar usuário
        const novoUsuario = db.criarUsuario({ usuario, nome, senha: senhaHash });

        console.log(`🆕 Novo usuário criado: "${nome}" (ID: ${novoUsuario.id}) por: ${req.session.usuario.nome} (ID: ${req.session.usuario.id})`);

        res.json({
            sucesso: true,
            mensagem: 'Usuário criado com sucesso',
            usuario: {
                id: novoUsuario.id,
                usuario: novoUsuario.usuario,
                nome: novoUsuario.nome
            }
        });
    } catch (erro) {
        console.error('Erro ao criar usuário:', erro);
        res.status(500).json({ erro: 'Erro ao criar usuário' });
    }
});

// Listar todos os usuários
router.get('/', async (req, res) => {
    try {
        const usuarios = db.getUsuarios();
        const usuarioAtualId = req.session.usuario.id;
        
        // Remover senha da resposta e adicionar info se é o usuário atual
        const usuariosSemSenha = usuarios.map(u => ({
            id: u.id,
            usuario: u.usuario,
            nome: u.nome,
            created_at: u.created_at,
            updated_at: u.updated_at || null,
            eh_atual: u.id === usuarioAtualId
        }));
        
        res.json(usuariosSemSenha);
    } catch (erro) {
        console.error('Erro ao listar usuários:', erro);
        res.status(500).json({ erro: 'Erro ao listar usuários' });
    }
});

// Obter detalhes de um usuário específico
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = db.getUsuarioById(parseInt(id));
        
        if (!usuario) {
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        }
        
        // Não retornar senha
        const { senha, ...usuarioSemSenha } = usuario;
        res.json(usuarioSemSenha);
    } catch (erro) {
        console.error('Erro ao obter usuário:', erro);
        res.status(500).json({ erro: 'Erro ao obter usuário' });
    }
});

// Atualizar usuário (nome e usuário)
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { usuario, nome } = req.body;
        const usuarioAtualId = req.session.usuario.id;
        
        // Não permitir excluir ou modificar o próprio usuário atual através desta rota
        if (parseInt(id) === usuarioAtualId) {
            return res.status(403).json({ 
                erro: 'Não é possível modificar seu próprio usuário por esta rota. Use a rota de perfil.' 
            });
        }
        
        const usuarioExistente = db.getUsuarioById(parseInt(id));
        
        if (!usuarioExistente) {
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        }
        
        // Verificar se o novo nome de usuário já existe
        if (usuario && usuario !== usuarioExistente.usuario) {
            const usuarioDuplicado = db.getUsuarioByNome(usuario);
            if (usuarioDuplicado && usuarioDuplicado.id !== parseInt(id)) {
                return res.status(400).json({ erro: 'Este nome de usuário já está em uso' });
            }
        }
        
        const dadosAtualizacao = {};
        if (usuario !== undefined) dadosAtualizacao.usuario = usuario;
        if (nome !== undefined) dadosAtualizacao.nome = nome;
        
        const usuarioAtualizado = db.atualizarUsuario(parseInt(id), dadosAtualizacao);
        
        console.log(`👤 Usuário atualizado por: ${req.session.usuario.nome} (ID: ${usuarioAtualId}) - ID atualizado: ${id}`);
        
        res.json({
            sucesso: true,
            mensagem: 'Usuário atualizado com sucesso',
            usuario: {
                id: usuarioAtualizado.id,
                usuario: usuarioAtualizado.usuario,
                nome: usuarioAtualizado.nome
            }
        });
    } catch (erro) {
        console.error('Erro ao atualizar usuário:', erro);
        res.status(500).json({ erro: 'Erro ao atualizar usuário' });
    }
});

// Alterar senha de um usuário
router.patch('/:id/senha', async (req, res) => {
    try {
        const { id } = req.params;
        const { novaSenha, confirmarSenha } = req.body;
        const usuarioAtualId = req.session.usuario.id;
        
        // Validações
        if (!novaSenha || !confirmarSenha) {
            return res.status(400).json({ erro: 'Nova senha e confirmação são obrigatórias' });
        }
        
        if (novaSenha !== confirmarSenha) {
            return res.status(400).json({ erro: 'As senhas não coincidem' });
        }
        
        if (novaSenha.length < 6) {
            return res.status(400).json({ erro: 'A senha deve ter no mínimo 6 caracteres' });
        }
        
        const usuario = db.getUsuarioById(parseInt(id));
        
        if (!usuario) {
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        }
        
        // Criar hash da nova senha
        const senhaHash = await bcrypt.hash(novaSenha, 10);
        
        // Atualizar senha
        db.atualizarUsuario(parseInt(id), { senha: senhaHash });
        
        console.log(`🔑 Senha alterada para usuário ID: ${id} por: ${req.session.usuario.nome} (ID: ${usuarioAtualId})`);
        
        res.json({
            sucesso: true,
            mensagem: 'Senha alterada com sucesso'
        });
    } catch (erro) {
        console.error('Erro ao alterar senha:', erro);
        res.status(500).json({ erro: 'Erro ao alterar senha' });
    }
});

// Excluir usuário
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioAtualId = req.session.usuario.id;
        const usuarioAtualNome = req.session.usuario.nome;
        
        // Não permitir excluir a si mesmo
        if (parseInt(id) === usuarioAtualId) {
            return res.status(403).json({ 
                erro: 'Não é possível excluir seu próprio usuário' 
            });
        }
        
        const usuario = db.getUsuarioById(parseInt(id));
        
        if (!usuario) {
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        }
        
        // Verificar se o usuário tem despesas cadastradas
        const despesas = db.getDespesas();
        const despesasFixas = db.getDespesasFixas();
        
        const despesasUsuario = despesas.filter(d => d.usuario_id === parseInt(id)).length;
        const despesasFixasUsuario = despesasFixas.filter(df => df.usuario_id === parseInt(id)).length;
        
        if (despesasUsuario > 0 || despesasFixasUsuario > 0) {
            return res.status(400).json({
                erro: `Não é possível excluir o usuário "${usuario.nome}" pois ele possui ${despesasUsuario + despesasFixasUsuario} despesa(s) cadastrada(s). Exclua as despesas primeiro.`
            });
        }
        
        // Excluir usuário
        db.excluirUsuario(parseInt(id));
        
        console.log(`🗑️ Usuário excluído: "${usuario.nome}" (ID: ${id}) por: ${usuarioAtualNome} (ID: ${usuarioAtualId})`);
        
        res.json({
            sucesso: true,
            mensagem: 'Usuário excluído com sucesso'
        });
    } catch (erro) {
        console.error('Erro ao excluir usuário:', erro);
        res.status(500).json({ erro: 'Erro ao excluir usuário' });
    }
});

module.exports = router;
