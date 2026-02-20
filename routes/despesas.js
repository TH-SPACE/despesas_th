const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verificarAutenticacao } = require('../middleware/auth');
const { getDataRealDespesaFixa } = require('../helpers/despesasHelper');

// Todas as rotas exigem autenticação
router.use(verificarAutenticacao);

// Listar despesas do usuário
router.get('/', async (req, res) => {
    try {
        const { mes, ano } = req.query;
        const usuarioId = req.session.usuario.id;

        // Consultar despesas normais (variáveis e parceladas)
        let despesasNormais = db.getDespesasByUsuario(usuarioId, mes, ano);

        // Adicionar informações da categoria
        const categorias = db.getCategorias();
        const usuarios = db.getUsuarios();
        
        despesasNormais = despesasNormais.map(despesa => {
            const categoria = categorias.find(c => c.id === despesa.categoria_id);
            const usuarioCompartilhado = despesa.usuario_compartilhado_id ? 
                usuarios.find(u => u.id === despesa.usuario_compartilhado_id) : null;
            
            return {
                ...despesa,
                categoria_nome: categoria?.nome || null,
                categoria_cor: categoria?.cor || null,
                usuario_compartilhado_nome: usuarioCompartilhado?.nome || null,
                tipo_registro: 'normal'
            };
        });

        // Consultar despesas fixas e calcular para o mês/ano especificado
        let despesasFixas = [];
        if (mes && ano) {
            const despesasFixasList = db.getDespesasFixasByUsuario(usuarioId);
            
            // Obter registros de pagamento para despesas fixas neste mês/ano
            const pagamentos = db.getDespesasPagasTempByUsuarioMes(usuarioId, mes, ano);

            // Criar um mapa para verificar rapidamente se uma despesa fixa foi paga
            const pagamentosMap = {};
            pagamentos.forEach(pagamento => {
                pagamentosMap[pagamento.despesa_fixa_id] = pagamento.data_pagamento;
            });

            // Calcular datas reais para cada despesa fixa no mês/ano especificado
            despesasFixas = despesasFixasList.map(despesa => {
                const dataReferencia = getDataRealDespesaFixa(ano, mes, despesa.dia_vencimento);
                const jaFoiPaga = pagamentosMap[despesa.id] !== undefined;
                
                const categoria = categorias.find(c => c.id === despesa.categoria_id);
                const usuarioCompartilhado = despesa.usuario_compartilhado_id ? 
                    usuarios.find(u => u.id === despesa.usuario_compartilhado_id) : null;

                return {
                    ...despesa,
                    id: `fixa-${despesa.id}`,
                    data_vencimento: dataReferencia,
                    paga: jaFoiPaga,
                    data_pagamento: jaFoiPaga ? pagamentosMap[despesa.id] : null,
                    categoria_nome: categoria?.nome || null,
                    categoria_cor: categoria?.cor || null,
                    usuario_compartilhado_nome: usuarioCompartilhado?.nome || null,
                    tipo_registro: 'fixa',
                    parcela_atual: null,
                    total_parcelas: null,
                    grupo_parcelamento: null,
                    tipo: 'fixa'
                };
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
            const dataVencimentoObj = new Date(data_vencimento);
            const diaVencimento = dataVencimentoObj.getDate();

            const novaDespesaFixa = db.criarDespesaFixa({
                usuario_id: usuarioId,
                categoria_id,
                descricao,
                valor: valorFinal,
                dia_vencimento: diaVencimento,
                dividida,
                usuario_compartilhado_id: usuarioCompartilhado
            });

            // Se for dividida, também registrar para o outro usuário
            if (dividida && usuarioCompartilhado) {
                db.criarDespesaFixa({
                    usuario_id: usuarioCompartilhado,
                    categoria_id,
                    descricao,
                    valor: valorFinal,
                    dia_vencimento: diaVencimento,
                    dividida,
                    usuario_compartilhado_id: usuarioId
                });
            }

            console.log(`📅 Nova despesa fixa criada por: ${usuarioNome} (ID: ${usuarioId}) - Descrição: "${descricao}", Valor: ${valorFinal}, Dia de vencimento: ${diaVencimento}`);

            return res.json({
                sucesso: true,
                mensagem: 'Despesa fixa cadastrada com sucesso',
                id: `fixa-${novaDespesaFixa.id}`
            });
        }

        // Se for parcelada, criar múltiplas despesas normais
        if (tipo === 'parcelada' && total_parcelas > 1) {
            const grupoParcelamento = `${Date.now()}-${usuarioId}`;
            const dataBase = new Date(data_vencimento);

            for (let i = 1; i <= total_parcelas; i++) {
                const dataVenc = new Date(dataBase);
                dataVenc.setMonth(dataVenc.getMonth() + (i - 1));

                db.criarDespesa({
                    usuario_id: usuarioId,
                    categoria_id,
                    descricao: `${descricao} (${i}/${total_parcelas})`,
                    valor: valorFinal,
                    tipo,
                    data_vencimento: dataVenc.toISOString().split('T')[0],
                    parcela_atual: i,
                    total_parcelas,
                    grupo_parcelamento: grupoParcelamento,
                    dividida,
                    usuario_compartilhado_id: usuarioCompartilhado
                });

                // Se for dividida, inserir para o outro usuário
                if (dividida && usuarioCompartilhado) {
                    db.criarDespesa({
                        usuario_id: usuarioCompartilhado,
                        categoria_id,
                        descricao: `${descricao} (${i}/${total_parcelas})`,
                        valor: valorFinal,
                        tipo,
                        data_vencimento: dataVenc.toISOString().split('T')[0],
                        parcela_atual: i,
                        total_parcelas,
                        grupo_parcelamento: grupoParcelamento,
                        dividida,
                        usuario_compartilhado_id: usuarioId
                    });
                }
            }

            console.log(`💳 Nova despesa parcelada criada por: ${usuarioNome} (ID: ${usuarioId}) - Descrição: "${descricao}", Parcelas: ${total_parcelas}, Valor total: ${valorFinal * total_parcelas}`);

            return res.json({
                sucesso: true,
                mensagem: `Despesa parcelada em ${total_parcelas}x criada com sucesso`
            });
        }

        // Despesa variável simples
        const novaDespesa = db.criarDespesa({
            usuario_id: usuarioId,
            categoria_id,
            descricao,
            valor: valorFinal,
            tipo,
            data_vencimento,
            dividida,
            usuario_compartilhado_id: usuarioCompartilhado
        });

        // Se for dividida, inserir para o outro usuário
        if (dividida && usuarioCompartilhado) {
            db.criarDespesa({
                usuario_id: usuarioCompartilhado,
                categoria_id,
                descricao,
                valor: valorFinal,
                tipo,
                data_vencimento,
                dividida,
                usuario_compartilhado_id: usuarioId
            });
        }

        console.log(`📥 Nova despesa variável criada por: ${usuarioNome} (ID: ${usuarioId}) - Descrição: "${descricao}", Valor: ${valorFinal}, Data de vencimento: ${data_vencimento}`);

        res.json({
            sucesso: true,
            mensagem: 'Despesa cadastrada com sucesso',
            id: novaDespesa.id
        });

    } catch (erro) {
        console.error('Erro ao criar despesa:', erro);
        res.status(500).json({ erro: 'Erro ao criar despesa' });
    }
});

// Marcar despesa como paga/não paga
router.patch('/:id/pagar', async (req, res) => {
    try {
        const { id } = req.params;
        const { paga, mes, ano } = req.body;
        const usuarioId = req.session.usuario.id;
        const usuarioNome = req.session.usuario.nome;

        // Verificar se é uma despesa fixa (começa com 'fixa-')
        if (id.toString().startsWith('fixa-')) {
            const idOriginal = parseInt(id.toString().substring(5));

            const despesaFixa = db.getDespesaFixaById(idOriginal);

            if (!despesaFixa || despesaFixa.usuario_id !== usuarioId) {
                return res.status(404).json({ erro: 'Despesa fixa não encontrada' });
            }

            const dataVencimento = getDataRealDespesaFixa(ano, mes, despesaFixa.dia_vencimento);

            if (paga) {
                db.criarDespesaPagaTemp({
                    usuario_id: usuarioId,
                    despesa_fixa_id: idOriginal,
                    descricao: despesaFixa.descricao,
                    valor: despesaFixa.valor,
                    data_referencia: dataVencimento,
                    data_pagamento: new Date().toISOString().split('T')[0],
                    tipo: 'fixa'
                });
            } else {
                db.excluirDespesaPagaTemp(usuarioId, idOriginal, dataVencimento);
            }

            console.log(`📅 Despesa fixa ID: ${idOriginal} para ${dataVencimento} marcada como ${paga ? 'paga' : 'não paga'} por: ${usuarioNome} (ID: ${usuarioId})`);

            res.json({
                sucesso: true,
                mensagem: paga ? `Despesa fixa registrada como paga para ${dataVencimento}` : `Despesa fixa registrada como não paga para ${dataVencimento}`
            });
        } else {
            const despesa = db.getDespesaById(parseInt(id));
            
            if (!despesa || despesa.usuario_id !== usuarioId) {
                return res.status(404).json({ erro: 'Despesa não encontrada' });
            }

            const dataPagamento = paga ? new Date().toISOString().split('T')[0] : null;

            db.atualizarDespesa(parseInt(id), {
                paga,
                data_pagamento: dataPagamento
            });

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
            const idOriginal = parseInt(id.substring(5));

            const despesaFixa = db.getDespesaFixaById(idOriginal);

            if (!despesaFixa || despesaFixa.usuario_id !== usuarioId) {
                return res.status(404).json({ erro: 'Despesa fixa não encontrada' });
            }

            db.excluirDespesaFixa(idOriginal);
            
            // Excluir registros relacionados na tabela de pagamentos temporários
            const pagamentos = db.getDespesasPagasTempByUsuarioMes(usuarioId, 1, 1);
            pagamentos.forEach(pagamento => {
                if (pagamento.despesa_fixa_id === idOriginal) {
                    db.excluirDespesaPagaTemp(usuarioId, idOriginal, pagamento.data_referencia);
                }
            });

            console.log(`🗑️ Despesa fixa excluída por: ${usuarioNome} (ID: ${usuarioId}) - Descrição: "${despesaFixa.descricao}", Valor: ${despesaFixa.valor}`);

            res.json({
                sucesso: true,
                mensagem: 'Despesa fixa excluída com sucesso'
            });
        } else {
            const despesa = db.getDespesaById(parseInt(id));

            if (!despesa || despesa.usuario_id !== usuarioId) {
                return res.status(404).json({ erro: 'Despesa não encontrada' });
            }

            const tipoExclusao = req.query.tipoExclusao || 'excluir';

            if (despesa.grupo_parcelamento && despesa.total_parcelas && despesa.total_parcelas > 1) {
                if (tipoExclusao === 'todas') {
                    const despesasExcluidas = db.excluirDespesasByGrupoParcelamento(despesa.grupo_parcelamento, usuarioId);
                    
                    console.log(`🗑️ Grupo de despesas parceladas excluído por: ${usuarioNome} (ID: ${usuarioId}) - Grupo: ${despesa.grupo_parcelamento}, Descrição: "${despesa.descricao}", Total parcelas: ${despesa.total_parcelas}`);
                    
                    res.json({
                        sucesso: true,
                        mensagem: `Todas as ${despesa.total_parcelas} parcelas excluídas com sucesso`
                    });
                } else {
                    db.excluirDespesa(parseInt(id));

                    console.log(`🗑️ Despesa parcelada (somente esta) excluída por: ${usuarioNome} (ID: ${usuarioId}) - Descrição: "${despesa.descricao}", Parcela: ${despesa.parcela_atual}/${despesa.total_parcelas}`);
                    
                    res.json({
                        sucesso: true,
                        mensagem: 'Parcela excluída com sucesso'
                    });
                }
            } else {
                db.excluirDespesa(parseInt(id));

                console.log(`🗑️ Despesa excluída por: ${usuarioNome} (ID: ${usuarioId}) - Descrição: "${despesa.descricao}", Valor: ${despesa.valor}`);
                
                res.json({
                    sucesso: true,
                    mensagem: 'Despesa excluída com sucesso'
                });
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
        const categorias = db.getCategorias();
        categorias.sort((a, b) => a.nome.localeCompare(b.nome));
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

        if (!nome || nome.trim().length === 0) {
            return res.status(400).json({ erro: 'Nome da categoria é obrigatório' });
        }

        const corFormatada = cor && /^#[0-9A-F]{6}$/i.test(cor) ? cor : '#3498db';

        const novaCategoria = db.criarCategoria({
            nome: nome.trim(),
            cor: corFormatada
        });

        console.log(`🏷️ Nova categoria criada: "${nome}", Cor: ${corFormatada}`);

        res.json({
            sucesso: true,
            mensagem: 'Categoria criada com sucesso',
            id: novaCategoria.id
        });

    } catch (erro) {
        console.error('Erro ao criar categoria:', erro);
        res.status(500).json({ erro: 'Erro ao criar categoria' });
    }
});

// Excluir categoria
router.delete('/categorias/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const categoria = db.getCategoriaById(parseInt(id));

        if (!categoria) {
            return res.status(404).json({ erro: 'Categoria não encontrada' });
        }

        // Verificar se a categoria está sendo usada em alguma despesa
        const despesas = db.getDespesas();
        const despesasFixas = db.getDespesasFixas();
        
        const totalDespesas = despesas.filter(d => d.categoria_id === parseInt(id)).length +
                             despesasFixas.filter(df => df.categoria_id === parseInt(id)).length;

        if (totalDespesas > 0) {
            return res.status(400).json({
                erro: `Não é possível excluir a categoria "${categoria.nome}" porque ela está sendo usada em ${totalDespesas} despesa(s).`
            });
        }

        db.excluirCategoria(parseInt(id));

        console.log(`🗑️ Categoria excluída: "${categoria.nome}" (ID: ${id})`);

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
        const usuarios = db.getUsuarios().filter(u => u.id !== usuarioId);
        
        res.json(usuarios.map(u => ({
            id: u.id,
            nome: u.nome,
            usuario: u.usuario
        })));
    } catch (erro) {
        console.error('Erro ao listar usuários:', erro);
        res.status(500).json({ erro: 'Erro ao listar usuários' });
    }
});

module.exports = router;
