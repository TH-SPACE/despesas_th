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
        const usuarioNome = req.session.usuario.nome;

        // Consultar despesas normais (variáveis e parceladas)
        let query = `
            SELECT d.*, c.nome as categoria_nome, c.cor as categoria_cor,
                   u.nome as usuario_compartilhado_nome,
                   'normal' as tipo_registro
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

        const [despesasNormais] = await db.query(query, params);

        // Consultar despesas fixas e calcular para o mês/ano especificado
        let despesasFixas = [];
        if (mes && ano) {
            const queryFixas = `
                SELECT df.*, c.nome as categoria_nome, c.cor as categoria_cor,
                       u.nome as usuario_compartilhado_nome,
                       'fixa' as tipo_registro
                FROM despesas_fixas df
                LEFT JOIN categorias c ON df.categoria_id = c.id
                LEFT JOIN usuarios u ON df.usuario_compartilhado_id = u.id
                WHERE df.usuario_id = ? AND df.ativa = TRUE
            `;

            const [despesasCadastradas] = await db.query(queryFixas, [usuarioId]);

            // Obter registros de pagamento para despesas fixas neste mês/ano
            const [pagamentos] = await db.query(
                'SELECT despesa_fixa_id, data_pagamento FROM despesas_pagas_temp WHERE usuario_id = ? AND MONTH(data_referencia) = ? AND YEAR(data_referencia) = ?',
                [usuarioId, mes, ano]
            );

            // Criar um mapa para verificar rapidamente se uma despesa fixa foi paga
            const pagamentosMap = {};
            pagamentos.forEach(pagamento => {
                pagamentosMap[pagamento.despesa_fixa_id] = pagamento.data_pagamento;
            });

            // Calcular datas reais para cada despesa fixa no mês/ano especificado
            despesasCadastradas.forEach(despesa => {
                // Criar data com base no mês/ano fornecido e no dia de vencimento da despesa
                const anoInt = parseInt(ano);
                const mesInt = parseInt(mes) - 1; // Janeiro é 0 em JavaScript
                let diaVencimento = parseInt(despesa.dia_vencimento);

                // Verificar o último dia do mês para evitar problemas com meses diferentes
                const ultimoDiaMes = new Date(anoInt, mesInt + 1, 0).getDate();
                if (diaVencimento > ultimoDiaMes) {
                    diaVencimento = ultimoDiaMes; // Usar o último dia do mês se o dia for inválido
                }

                const dataCalculada = new Date(anoInt, mesInt, diaVencimento);

                // Verificar se esta instância específica da despesa fixa foi paga
                const dataReferencia = dataCalculada.toISOString().split('T')[0];
                const jaFoiPaga = pagamentosMap[despesa.id] !== undefined;

                // Adicionar propriedades calculadas à despesa
                const despesaComData = {
                    ...despesa,
                    id: `fixa-${despesa.id}`, // Prefixo para identificar como fixa
                    data_vencimento: dataReferencia,
                    paga: jaFoiPaga,
                    data_pagamento: jaFoiPaga ? pagamentosMap[despesa.id] : null,
                    parcela_atual: null,
                    total_parcelas: null,
                    grupo_parcelamento: null,
                    tipo: 'fixa' // Manter o tipo original
                };

                despesasFixas.push(despesaComData);
            });
        }

        // Combinar despesas normais e fixas
        const todasDespesas = [...despesasNormais, ...despesasFixas];

        // Ordenar por data de vencimento
        todasDespesas.sort((a, b) => new Date(a.data_vencimento) - new Date(b.data_vencimento));

        res.json(todasDespesas);

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
        const usuarioNome = req.session.usuario.nome;

        // Validações
        if (!descricao || !valor || !categoria_id || !tipo || (tipo !== 'fixa' && !data_vencimento)) {
            return res.status(400).json({ erro: 'Dados incompletos' });
        }

        const valorFinal = dividir ? parseFloat(valor) / 2 : parseFloat(valor);
        const dividida = dividir === true || dividir === 'true';
        const usuarioCompartilhado = dividida ? usuario_compartilhado_id : null;

        // Se for despesa fixa, registrar na tabela específica
        if (tipo === 'fixa') {
            // Extrair o dia de vencimento da data fornecida
            const dataVencimentoObj = new Date(data_vencimento);
            const diaVencimento = dataVencimentoObj.getDate();

            // Inserir na tabela de despesas fixas
            const [resultadoFixa] = await db.query(
                `INSERT INTO despesas_fixas (usuario_id, categoria_id, descricao, valor,
                 dia_vencimento, dividida, usuario_compartilhado_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [usuarioId, categoria_id, descricao, valorFinal, diaVencimento,
                 dividida, usuarioCompartilhado]
            );

            // Se for dividida, também registrar para o outro usuário
            if (dividida && usuarioCompartilhado) {
                await db.query(
                    `INSERT INTO despesas_fixas (usuario_id, categoria_id, descricao, valor,
                     dia_vencimento, dividida, usuario_compartilhado_id)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [usuarioCompartilhado, categoria_id, descricao, valorFinal, diaVencimento,
                     dividida, usuarioId]
                );
            }

            // Log de criação de despesa fixa
            console.log(`📅 Nova despesa fixa criada por: ${usuarioNome} (ID: ${usuarioId}) - Descrição: "${descricao}", Valor: ${valorFinal}, Dia de vencimento: ${diaVencimento}`);

            return res.json({
                sucesso: true,
                mensagem: 'Despesa fixa cadastrada com sucesso',
                id: `fixa-${resultadoFixa.insertId}`
            });
        }

        // Se for parcelada, criar múltiplas despesas normais
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

            // Log de criação de despesa parcelada
            console.log(`💳 Nova despesa parcelada criada por: ${usuarioNome} (ID: ${usuarioId}) - Descrição: "${descricao}", Parcelas: ${total_parcelas}, Valor total: ${valorFinal * total_parcelas}`);

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

        // Log de criação de despesa variável
        console.log(`📥 Nova despesa variável criada por: ${usuarioNome} (ID: ${usuarioId}) - Descrição: "${descricao}", Valor: ${valorFinal}, Data de vencimento: ${data_vencimento}`);

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

// Função auxiliar para obter a data real da despesa fixa no mês/ano especificado
function getDataRealDespesaFixa(ano, mes, diaVencimento) {
    const anoInt = parseInt(ano);
    const mesInt = parseInt(mes) - 1; // Janeiro é 0 em JavaScript
    let diaVencimentoInt = parseInt(diaVencimento);

    // Verificar o último dia do mês para evitar problemas com meses diferentes
    const ultimoDiaMes = new Date(anoInt, mesInt + 1, 0).getDate();
    if (diaVencimentoInt > ultimoDiaMes) {
        diaVencimentoInt = ultimoDiaMes; // Usar o último dia do mês se o dia for inválido
    }

    const dataCalculada = new Date(anoInt, mesInt, diaVencimentoInt);
    return dataCalculada.toISOString().split('T')[0]; // Retorna no formato YYYY-MM-DD
}

// Marcar despesa como paga/não paga
router.patch('/:id/pagar', async (req, res) => {
    try {
        const { id } = req.params;
        const { paga, mes, ano } = req.body; // Agora aceita mês e ano para despesas fixas
        const usuarioId = req.session.usuario.id;
        const usuarioNome = req.session.usuario.nome;

        // Verificar se é uma despesa fixa (começa com 'fixa-')
        if (id.toString().startsWith('fixa-')) {
            // É uma despesa fixa, precisamos lidar de forma diferente
            const idOriginal = id.toString().substring(5); // Remover o prefixo 'fixa-'

            // Para despesas fixas, vamos registrar o pagamento em uma tabela temporária ou usar um registro histórico
            // Por simplicidade, vamos criar uma tabela auxiliar para rastrear pagamentos de despesas fixas

            // Primeiro, obter detalhes da despesa fixa
            const [despesasFixas] = await db.query(
                'SELECT * FROM despesas_fixas WHERE id = ? AND usuario_id = ? LIMIT 1',
                [idOriginal, usuarioId]
            );

            if (despesasFixas.length === 0) {
                return res.status(404).json({ erro: 'Despesa fixa não encontrada' });
            }

            const despesaFixa = despesasFixas[0];
            const dataVencimento = getDataRealDespesaFixa(ano, mes, despesaFixa.dia_vencimento);

            // Registrar ou atualizar status de pagamento para esta instância da despesa fixa
            if (paga) {
                // Inserir ou atualizar o registro de pagamento
                await db.query(`
                    INSERT INTO despesas_pagas_temp (usuario_id, despesa_fixa_id, descricao, valor, data_referencia, data_pagamento, tipo)
                    VALUES (?, ?, ?, ?, ?, ?, 'fixa')
                    ON DUPLICATE KEY UPDATE data_pagamento = VALUES(data_pagamento)`,
                    [usuarioId, idOriginal, despesaFixa.descricao, despesaFixa.valor, dataVencimento, new Date().toISOString().split('T')[0]]
                );
            } else {
                // Remover o registro de pagamento
                await db.query(
                    'DELETE FROM despesas_pagas_temp WHERE usuario_id = ? AND despesa_fixa_id = ? AND data_referencia = ?',
                    [usuarioId, idOriginal, dataVencimento]
                );
            }

            // Log de ação realizada em despesa fixa
            console.log(`📅 Despesa fixa ID: ${idOriginal} para ${dataVencimento} marcada como ${paga ? 'paga' : 'não paga'} por: ${usuarioNome} (ID: ${usuarioId})`);

            res.json({
                sucesso: true,
                mensagem: paga ? `Despesa fixa registrada como paga para ${dataVencimento}` : `Despesa fixa registrada como não paga para ${dataVencimento}`
            });
        } else {
            // É uma despesa normal
            const dataPagamento = paga ? new Date().toISOString().split('T')[0] : null;

            await db.query(
                'UPDATE despesas SET paga = ?, data_pagamento = ? WHERE id = ? AND usuario_id = ?',
                [paga, dataPagamento, id, usuarioId]
            );

            // Log de ação realizada em despesa normal
            console.log(`💰 Despesa ID: ${id} marcada como ${paga ? 'paga' : 'não paga'} por: ${usuarioNome} (ID: ${usuarioId})`);

            res.json({
                sucesso: true,
                mensagem: paga ? 'Despesa marcada como paga' : 'Despesa desmarcada'
            });
        }

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
        const usuarioNome = req.session.usuario.nome;

        // Verificar se é uma despesa fixa
        if (id && typeof id === 'string' && id.startsWith('fixa-')) {
            const idOriginal = id.substring(5); // Remover o prefixo 'fixa-'

            // Validar se o ID original é um número
            if (!/^\d+$/.test(idOriginal)) {
                return res.status(400).json({ erro: 'ID inválido para despesa fixa' });
            }

            // Obter informações da despesa fixa antes de excluir para log
            const [despesasFixas] = await db.query(
                'SELECT descricao, valor FROM despesas_fixas WHERE id = ? AND usuario_id = ?',
                [parseInt(idOriginal), usuarioId]
            );

            // Excluir a despesa fixa apenas se ela existir
            if (despesasFixas.length > 0) {
                await db.query(
                    'DELETE FROM despesas_fixas WHERE id = ? AND usuario_id = ?',
                    [parseInt(idOriginal), usuarioId]
                );

                // Também exclua quaisquer registros relacionados na tabela de pagamentos temporários
                await db.query(
                    'DELETE FROM despesas_pagas_temp WHERE despesa_fixa_id = ? AND usuario_id = ?',
                    [parseInt(idOriginal), usuarioId]
                );

                // Log de exclusão de despesa fixa
                console.log(`🗑️ Despesa fixa excluída por: ${usuarioNome} (ID: ${usuarioId}) - Descrição: "${despesasFixas[0].descricao}", Valor: ${despesasFixas[0].valor}`);

                res.json({
                    sucesso: true,
                    mensagem: 'Despesa fixa excluída com sucesso'
                });
            } else {
                console.log(`🗑️ Tentativa de exclusão de despesa fixa inexistente por: ${usuarioNome} (ID: ${usuarioId}) - ID: ${idOriginal}`);
                res.status(404).json({ erro: 'Despesa fixa não encontrada' });
            }
        } else {
            // É uma despesa normal - verificar se é parcelada para aplicar exclusão diferenciada
            const tipoExclusao = req.query.tipoExclusao || 'excluir'; // 'excluir', 'somente-esta', 'todas'

            // Obter informações da despesa antes de excluir
            const [despesas] = await db.query(
                'SELECT descricao, valor, grupo_parcelamento, total_parcelas FROM despesas WHERE id = ? AND usuario_id = ?',
                [id, usuarioId]
            );

            if (despesas.length > 0) {
                const despesa = despesas[0];

                if (despesa.grupo_parcelamento && despesa.total_parcelas && despesa.total_parcelas > 1) {
                    // É uma despesa parcelada - aplicar exclusão diferenciada
                    if (tipoExclusao === 'todas') {
                        // Excluir todas as parcelas do mesmo grupo
                        await db.query(
                            'DELETE FROM despesas WHERE grupo_parcelamento = ? AND usuario_id = ?',
                            [despesa.grupo_parcelamento, usuarioId]
                        );

                        console.log(`🗑️ Grupo de despesas parceladas excluído por: ${usuarioNome} (ID: ${usuarioId}) - Grupo: ${despesa.grupo_parcelamento}, Descrição: "${despesa.descricao}", Total parcelas: ${despesa.total_parcelas}`);
                        res.json({
                            sucesso: true,
                            mensagem: `Todas as ${despesa.total_parcelas} parcelas excluídas com sucesso`
                        });
                    } else {
                        // Excluir somente esta parcela (comportamento padrão)
                        await db.query(
                            'DELETE FROM despesas WHERE id = ? AND usuario_id = ?',
                            [id, usuarioId]
                        );

                        // Log de exclusão de despesa normal
                        console.log(`🗑️ Despesa parcelada (somente esta) excluída por: ${usuarioNome} (ID: ${usuarioId}) - Descrição: "${despesa.descricao}", Parcela: ${despesa.parcela_atual}/${despesa.total_parcelas}`);
                        res.json({
                            sucesso: true,
                            mensagem: 'Parcela excluída com sucesso'
                        });
                    }
                } else {
                    // Não é parcelada, exclusão normal
                    await db.query(
                        'DELETE FROM despesas WHERE id = ? AND usuario_id = ?',
                        [id, usuarioId]
                    );

                    // Log de exclusão de despesa normal
                    console.log(`🗑️ Despesa excluída por: ${usuarioNome} (ID: ${usuarioId}) - Descrição: "${despesas[0].descricao}", Valor: ${despesas[0].valor}`);
                    res.json({
                        sucesso: true,
                        mensagem: 'Despesa excluída com sucesso'
                    });
                }
            } else {
                console.log(`🗑️ Tentativa de exclusão de despesa inexistente por: ${usuarioNome} (ID: ${usuarioId}) - ID: ${id}`);
                res.status(404).json({ erro: 'Despesa não encontrada' });
            }
        }

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

// Criar nova categoria
router.post('/categorias', async (req, res) => {
    try {
        const { nome, cor } = req.body;
        const usuarioId = req.session.usuario.id; // Apenas para manter consistência, mas categorias são globais

        // Validação básica
        if (!nome || nome.trim().length === 0) {
            return res.status(400).json({ erro: 'Nome da categoria é obrigatório' });
        }

        // Garantir que a cor tenha o formato correto (padrão hexadecimal)
        const corFormatada = cor && /^#[0-9A-F]{6}$/i.test(cor) ? cor : '#3498db'; // Cor padrão se inválida

        // Inserir nova categoria
        const [resultado] = await db.query(
            'INSERT INTO categorias (nome, cor) VALUES (?, ?)',
            [nome.trim(), corFormatada]
        );

        // Log de criação de categoria
        console.log(`🏷️ Nova categoria criada: "${nome}", Cor: ${corFormatada}`);

        res.json({
            sucesso: true,
            mensagem: 'Categoria criada com sucesso',
            id: resultado.insertId
        });

    } catch (erro) {
        console.error('Erro ao criar categoria:', erro);

        // Verificar se é erro de duplicidade
        if (erro.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ erro: 'Categoria com este nome já existe' });
        }

        res.status(500).json({ erro: 'Erro ao criar categoria' });
    }
});

// Excluir categoria
router.delete('/categorias/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.session.usuario.id; // Apenas para manter consistência, mas categorias são globais

        // Verificar se a categoria existe
        const [categorias] = await db.query(
            'SELECT nome FROM categorias WHERE id = ?',
            [id]
        );

        if (categorias.length === 0) {
            return res.status(404).json({ erro: 'Categoria não encontrada' });
        }

        const categoriaNome = categorias[0].nome;

        // Verificar se a categoria está sendo usada em alguma despesa
        const [despesasComCategoria] = await db.query(
            'SELECT COUNT(*) as count FROM despesas WHERE categoria_id = ?',
            [id]
        );

        const [despesasFixasComCategoria] = await db.query(
            'SELECT COUNT(*) as count FROM despesas_fixas WHERE categoria_id = ?',
            [id]
        );

        const totalDespesas = despesasComCategoria[0].count + despesasFixasComCategoria[0].count;

        if (totalDespesas > 0) {
            return res.status(400).json({
                erro: `Não é possível excluir a categoria "${categoriaNome}" porque ela está sendo usada em ${totalDespesas} despesa(s).`
            });
        }

        // Excluir a categoria
        await db.query(
            'DELETE FROM categorias WHERE id = ?',
            [id]
        );

        // Log de exclusão de categoria
        console.log(`🗑️ Categoria excluída: "${categoriaNome}" (ID: ${id})`);

        res.json({
            sucesso: true,
            mensagem: 'Categoria excluída com sucesso'
        });

    } catch (erro) {
        console.error('Erro ao excluir categoria:', erro);
        res.status(500).json({ erro: 'Erro ao excluir categoria' });
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