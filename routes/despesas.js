const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verificarAutenticacao } = require('../middleware/auth');

// Todas as rotas exigem autenticação
router.use(verificarAutenticacao);

// Listar despesas do usuário
router.get('/', async (req, res) => {
    try {
        const { mes, ano } = req.query;
        const usuarioId = req.session.usuario.id;

        let query = `
            SELECT d.*, c.nome as categoria_nome, c.cor as categoria_cor,
                   u.nome as usuario_compartilhado_nome
            FROM despesas d
            LEFT JOIN categorias c ON d.categoria_id = c.id
            LEFT JOIN usuarios u ON d.usuario_compartilhado_id = u.id
            WHERE d.usuario_id = ?
        `;
        const params = [usuarioId];

        if (mes && ano) {
            query += ' AND MONTH(d.data_vencimento) = ? AND YEAR(d.data_vencimento) = ?';
            params.push(mes, ano);
        }

        query += ' ORDER BY d.data_vencimento ASC, d.id DESC';

        console.log('Query executada:', query); // Log para debug
        console.log('Parâmetros:', params); // Log para debug

        const [despesas] = await db.query(query, params);

        // Adicionando log para verificar o resultado
        console.log('Despesas retornadas:', despesas);

        res.json(despesas);

    } catch (erro) {
        console.error('Erro ao listar despesas:', erro);
        res.status(500).json({ erro: 'Erro ao listar despesas', detalhe: erro.message });
    }
});

// Criar nova despesa
router.post('/', async (req, res) => {
    try {
        const {
            descricao,
            valor,
            categoria_id,
            tipo,
            data_vencimento,
            total_parcelas,
            dividir,
            usuario_compartilhado_id
        } = req.body;

        const usuarioId = req.session.usuario.id;

        // Validações
        if (!descricao || !valor || !categoria_id || !tipo || !data_vencimento) {
            return res.status(400).json({ erro: 'Dados incompletos' });
        }

        const valorFinal = dividir ? parseFloat(valor) / 2 : parseFloat(valor);
        const dividida = dividir === true || dividir === 'true';
        const usuarioCompartilhado = dividida ? usuario_compartilhado_id : null;

        // Se for despesa fixa, criar para todos os meses do ano
        if (tipo === 'fixa') {
            const dataBase = new Date(data_vencimento);
            const anoAtual = dataBase.getFullYear();
            const diaVencimento = dataBase.getDate();
            const mesInicial = dataBase.getMonth();

            for (let mes = mesInicial; mes < 12; mes++) {
                const dataVenc = new Date(anoAtual, mes, diaVencimento);
                
                // Inserir para o usuário principal
                await db.query(
                    `INSERT INTO despesas (usuario_id, categoria_id, descricao, valor, tipo, 
                     data_vencimento, dividida, usuario_compartilhado_id)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [usuarioId, categoria_id, descricao, valorFinal, tipo, 
                     dataVenc, dividida, usuarioCompartilhado]
                );

                // Se for dividida, inserir para o outro usuário
                if (dividida && usuarioCompartilhado) {
                    await db.query(
                        `INSERT INTO despesas (usuario_id, categoria_id, descricao, valor, tipo, 
                         data_vencimento, dividida, usuario_compartilhado_id)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        [usuarioCompartilhado, categoria_id, descricao, valorFinal, tipo, 
                         dataVenc, dividida, usuarioId]
                    );
                }
            }

            return res.json({ 
                sucesso: true, 
                mensagem: 'Despesa fixa criada para todos os meses do ano' 
            });
        }

        // Se for parcelada, criar múltiplas despesas
        if (tipo === 'parcelada' && total_parcelas > 1) {
            const grupoParcelamento = `${Date.now()}-${usuarioId}`;
            const dataBase = new Date(data_vencimento);

            for (let i = 1; i <= total_parcelas; i++) {
                const dataVenc = new Date(dataBase);
                dataVenc.setMonth(dataVenc.getMonth() + (i - 1));

                // Inserir para o usuário principal
                await db.query(
                    `INSERT INTO despesas (usuario_id, categoria_id, descricao, valor, tipo, 
                     data_vencimento, parcela_atual, total_parcelas, grupo_parcelamento, 
                     dividida, usuario_compartilhado_id)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [usuarioId, categoria_id, `${descricao} (${i}/${total_parcelas})`, 
                     valorFinal, tipo, dataVenc, i, total_parcelas, grupoParcelamento, 
                     dividida, usuarioCompartilhado]
                );

                // Se for dividida, inserir para o outro usuário
                if (dividida && usuarioCompartilhado) {
                    await db.query(
                        `INSERT INTO despesas (usuario_id, categoria_id, descricao, valor, tipo, 
                         data_vencimento, parcela_atual, total_parcelas, grupo_parcelamento, 
                         dividida, usuario_compartilhado_id)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [usuarioCompartilhado, categoria_id, `${descricao} (${i}/${total_parcelas})`, 
                         valorFinal, tipo, dataVenc, i, total_parcelas, grupoParcelamento, 
                         dividida, usuarioId]
                    );
                }
            }

            return res.json({ 
                sucesso: true, 
                mensagem: `Despesa parcelada em ${total_parcelas}x criada com sucesso` 
            });
        }

        // Despesa variável simples
        const [resultado] = await db.query(
            `INSERT INTO despesas (usuario_id, categoria_id, descricao, valor, tipo, 
             data_vencimento, dividida, usuario_compartilhado_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [usuarioId, categoria_id, descricao, valorFinal, tipo, 
             data_vencimento, dividida, usuarioCompartilhado]
        );

        // Se for dividida, inserir para o outro usuário
        if (dividida && usuarioCompartilhado) {
            await db.query(
                `INSERT INTO despesas (usuario_id, categoria_id, descricao, valor, tipo, 
                 data_vencimento, dividida, usuario_compartilhado_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [usuarioCompartilhado, categoria_id, descricao, valorFinal, tipo, 
                 data_vencimento, dividida, usuarioId]
            );
        }

        res.json({ 
            sucesso: true, 
            mensagem: 'Despesa cadastrada com sucesso',
            id: resultado.insertId
        });

    } catch (erro) {
        console.error('Erro ao criar despesa:', erro);
        res.status(500).json({ erro: 'Erro ao cadastrar despesa' });
    }
});

// Marcar despesa como paga/não paga
router.patch('/:id/pagar', async (req, res) => {
    try {
        const { id } = req.params;
        const { paga } = req.body;
        const usuarioId = req.session.usuario.id;

        const dataPagamento = paga ? new Date().toISOString().split('T')[0] : null;

        await db.query(
            'UPDATE despesas SET paga = ?, data_pagamento = ? WHERE id = ? AND usuario_id = ?',
            [paga, dataPagamento, id, usuarioId]
        );

        res.json({ 
            sucesso: true, 
            mensagem: paga ? 'Despesa marcada como paga' : 'Despesa desmarcada' 
        });

    } catch (erro) {
        console.error('Erro ao atualizar despesa:', erro);
        res.status(500).json({ erro: 'Erro ao atualizar despesa' });
    }
});

// Excluir despesa
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.session.usuario.id;

        await db.query(
            'DELETE FROM despesas WHERE id = ? AND usuario_id = ?',
            [id, usuarioId]
        );

        res.json({ 
            sucesso: true, 
            mensagem: 'Despesa excluída com sucesso' 
        });

    } catch (erro) {
        console.error('Erro ao excluir despesa:', erro);
        res.status(500).json({ erro: 'Erro ao excluir despesa' });
    }
});

// Listar categorias
router.get('/categorias', async (req, res) => {
    try {
        const [categorias] = await db.query('SELECT * FROM categorias ORDER BY nome');
        res.json(categorias);
    } catch (erro) {
        console.error('Erro ao listar categorias:', erro);
        res.status(500).json({ erro: 'Erro ao listar categorias' });
    }
});

// Listar usuários (para compartilhar despesas)
router.get('/usuarios', async (req, res) => {
    try {
        const usuarioId = req.session.usuario.id;
        const [usuarios] = await db.query(
            'SELECT id, nome, usuario FROM usuarios WHERE id != ?',
            [usuarioId]
        );
        res.json(usuarios);
    } catch (erro) {
        console.error('Erro ao listar usuários:', erro);
        res.status(500).json({ erro: 'Erro ao listar usuários' });
    }
});

module.exports = router;