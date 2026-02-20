const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

// Garante que o diretório data existe
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Funções auxiliares para ler e escrever arquivos JSON
function lerArquivo(nomeArquivo) {
    const caminho = path.join(DATA_DIR, `${nomeArquivo}.json`);
    if (!fs.existsSync(caminho)) {
        return [];
    }
    const conteudo = fs.readFileSync(caminho, 'utf-8');
    return JSON.parse(conteudo);
}

function escreverArquivo(nomeArquivo, dados) {
    const caminho = path.join(DATA_DIR, `${nomeArquivo}.json`);
    fs.writeFileSync(caminho, JSON.stringify(dados, null, 2), 'utf-8');
}

function gerarId(dados) {
    if (dados.length === 0) return 1;
    return Math.max(...dados.map(d => d.id)) + 1;
}

// ==================== USUÁRIOS ====================
function getUsuarios() {
    return lerArquivo('usuarios');
}

function getUsuarioById(id) {
    const usuarios = getUsuarios();
    return usuarios.find(u => u.id === id);
}

function getUsuarioByNome(usuario) {
    const usuarios = getUsuarios();
    return usuarios.find(u => u.usuario === usuario);
}

function criarUsuario(usuarioData) {
    const usuarios = getUsuarios();
    const novoUsuario = {
        id: gerarId(usuarios),
        usuario: usuarioData.usuario,
        nome: usuarioData.nome,
        senha: usuarioData.senha,
        created_at: new Date().toISOString()
    };
    usuarios.push(novoUsuario);
    escreverArquivo('usuarios', usuarios);
    return novoUsuario;
}

function atualizarUsuario(id, dadosAtualizacao) {
    const usuarios = getUsuarios();
    const index = usuarios.findIndex(u => u.id === id);
    if (index === -1) return null;
    
    // Preservar dados sensíveis e atualizar apenas os permitidos
    const usuarioAtualizado = {
        ...usuarios[index],
        nome: dadosAtualizacao.nome !== undefined ? dadosAtualizacao.nome : usuarios[index].nome,
        usuario: dadosAtualizacao.usuario !== undefined ? dadosAtualizacao.usuario : usuarios[index].usuario,
        senha: dadosAtualizacao.senha !== undefined ? dadosAtualizacao.senha : usuarios[index].senha,
        updated_at: new Date().toISOString()
    };
    
    usuarios[index] = usuarioAtualizado;
    escreverArquivo('usuarios', usuarios);
    return usuarioAtualizado;
}

function excluirUsuario(id) {
    const usuarios = getUsuarios();
    const usuario = usuarios.find(u => u.id === id);
    if (!usuario) return null;
    
    const novosUsuarios = usuarios.filter(u => u.id !== id);
    escreverArquivo('usuarios', novosUsuarios);
    return usuario;
}

// ==================== CATEGORIAS ====================
function getCategorias() {
    return lerArquivo('categorias');
}

function getCategoriaById(id) {
    const categorias = getCategorias();
    return categorias.find(c => c.id === id);
}

function criarCategoria(categoriaData) {
    const categorias = getCategorias();
    const novaCategoria = {
        id: gerarId(categorias),
        nome: categoriaData.nome,
        cor: categoriaData.cor || '#3498db',
        created_at: new Date().toISOString()
    };
    categorias.push(novaCategoria);
    escreverArquivo('categorias', categorias);
    return novaCategoria;
}

function excluirCategoria(id) {
    const categorias = getCategorias();
    const categoria = categorias.find(c => c.id === id);
    if (!categoria) return null;
    const novasCategorias = categorias.filter(c => c.id !== id);
    escreverArquivo('categorias', novasCategorias);
    return categoria;
}

// ==================== DESPESAS ====================
function getDespesas() {
    return lerArquivo('despesas');
}

function getDespesasByUsuario(usuarioId, mes, ano) {
    let despesas = getDespesas().filter(d => d.usuario_id === usuarioId);
    
    if (mes && ano) {
        despesas = despesas.filter(d => {
            const dataVenc = new Date(d.data_vencimento);
            return dataVenc.getMonth() + 1 === parseInt(mes) && 
                   dataVenc.getFullYear() === parseInt(ano);
        });
    }
    
    return despesas;
}

function getDespesaById(id) {
    const despesas = getDespesas();
    return despesas.find(d => d.id === id);
}

function criarDespesa(despesaData) {
    const despesas = getDespesas();
    const novaDespesa = {
        id: gerarId(despesas),
        usuario_id: despesaData.usuario_id,
        categoria_id: despesaData.categoria_id,
        descricao: despesaData.descricao,
        valor: despesaData.valor,
        tipo: despesaData.tipo || 'variavel',
        data_vencimento: despesaData.data_vencimento,
        paga: despesaData.paga || false,
        data_pagamento: despesaData.data_pagamento || null,
        parcela_atual: despesaData.parcela_atual || null,
        total_parcelas: despesaData.total_parcelas || null,
        grupo_parcelamento: despesaData.grupo_parcelamento || null,
        dividida: despesaData.dividida || false,
        usuario_compartilhado_id: despesaData.usuario_compartilhado_id || null,
        created_at: new Date().toISOString()
    };
    despesas.push(novaDespesa);
    escreverArquivo('despesas', despesas);
    return novaDespesa;
}

function atualizarDespesa(id, dadosAtualizacao) {
    const despesas = getDespesas();
    const index = despesas.findIndex(d => d.id === id);
    if (index === -1) return null;
    
    despesas[index] = { ...despesas[index], ...dadosAtualizacao };
    escreverArquivo('despesas', despesas);
    return despesas[index];
}

function excluirDespesa(id) {
    const despesas = getDespesas();
    const despesa = despesas.find(d => d.id === id);
    if (!despesa) return null;
    
    const novasDespesas = despesas.filter(d => d.id !== id);
    escreverArquivo('despesas', novasDespesas);
    return despesa;
}

function excluirDespesasByGrupoParcelamento(grupoParcelamento, usuarioId) {
    const despesas = getDespesas();
    const despesasGrupo = despesas.filter(d => 
        d.grupo_parcelamento === grupoParcelamento && d.usuario_id === usuarioId
    );
    const novasDespesas = despesas.filter(d => 
        d.grupo_parcelamento !== grupoParcelamento || d.usuario_id !== usuarioId
    );
    escreverArquivo('despesas', novasDespesas);
    return despesasGrupo;
}

// ==================== DESPESAS FIXAS ====================
function getDespesasFixas() {
    return lerArquivo('despesas_fixas');
}

function getDespesasFixasByUsuario(usuarioId) {
    const despesasFixas = getDespesasFixas();
    return despesasFixas.filter(df => df.usuario_id === usuarioId && df.ativa !== false);
}

function getDespesaFixaById(id) {
    const despesasFixas = getDespesasFixas();
    return despesasFixas.find(df => df.id === id);
}

function criarDespesaFixa(despesaData) {
    const despesasFixas = getDespesasFixas();
    const novaDespesaFixa = {
        id: gerarId(despesasFixas),
        usuario_id: despesaData.usuario_id,
        categoria_id: despesaData.categoria_id,
        descricao: despesaData.descricao,
        valor: despesaData.valor,
        dia_vencimento: despesaData.dia_vencimento,
        ativa: despesaData.ativa !== undefined ? despesaData.ativa : true,
        dividida: despesaData.dividida || false,
        usuario_compartilhado_id: despesaData.usuario_compartilhado_id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    despesasFixas.push(novaDespesaFixa);
    escreverArquivo('despesas_fixas', despesasFixas);
    return novaDespesaFixa;
}

function atualizarDespesaFixa(id, dadosAtualizacao) {
    const despesasFixas = getDespesasFixas();
    const index = despesasFixas.findIndex(df => df.id === id);
    if (index === -1) return null;
    
    despesasFixas[index] = { 
        ...despesasFixas[index], 
        ...dadosAtualizacao,
        updated_at: new Date().toISOString()
    };
    escreverArquivo('despesas_fixas', despesasFixas);
    return despesasFixas[index];
}

function excluirDespesaFixa(id) {
    const despesasFixas = getDespesasFixas();
    const despesaFixa = despesasFixas.find(df => df.id === id);
    if (!despesaFixa) return null;
    
    const novasDespesasFixas = despesasFixas.filter(df => df.id !== id);
    escreverArquivo('despesas_fixas', novasDespesasFixas);
    return despesaFixa;
}

// ==================== DESPESAS PAGAS TEMP ====================
function getDespesasPagasTemp() {
    return lerArquivo('despesas_pagas_temp');
}

function getDespesasPagasTempByUsuarioMes(usuarioId, mes, ano) {
    const despesasPagas = getDespesasPagasTemp();
    return despesasPagas.filter(dp => {
        const dataRef = new Date(dp.data_referencia);
        return dp.usuario_id === usuarioId &&
               dataRef.getMonth() + 1 === parseInt(mes) && 
               dataRef.getFullYear() === parseInt(ano);
    });
}

function getDespesaPagaTempByUsuarioDespesaReferencia(usuarioId, despesaFixaId, dataReferencia) {
    const despesasPagas = getDespesasPagasTemp();
    return despesasPagas.find(dp => 
        dp.usuario_id === usuarioId && 
        dp.despesa_fixa_id === despesaFixaId && 
        dp.data_referencia === dataReferencia
    );
}

function criarDespesaPagaTemp(despesaData) {
    const despesasPagas = getDespesasPagasTemp();
    
    // Verificar se já existe registro para esta combinação
    const index = despesasPagas.findIndex(dp => 
        dp.usuario_id === despesaData.usuario_id && 
        dp.despesa_fixa_id === despesaData.despesa_fixa_id && 
        dp.data_referencia === despesaData.data_referencia
    );
    
    if (index !== -1) {
        // Atualizar existente
        despesasPagas[index] = { ...despesasPagas[index], ...despesaData };
    } else {
        // Criar novo
        const novaDespesaPaga = {
            id: gerarId(despesasPagas),
            usuario_id: despesaData.usuario_id,
            despesa_fixa_id: despesaData.despesa_fixa_id,
            descricao: despesaData.descricao,
            valor: despesaData.valor,
            data_referencia: despesaData.data_referencia,
            data_pagamento: despesaData.data_pagamento || null,
            tipo: despesaData.tipo || 'fixa',
            created_at: new Date().toISOString()
        };
        despesasPagas.push(novaDespesaPaga);
    }
    
    escreverArquivo('despesas_pagas_temp', despesasPagas);
    return despesaData;
}

function excluirDespesaPagaTemp(usuarioId, despesaFixaId, dataReferencia) {
    const despesasPagas = getDespesasPagasTemp();
    const despesaPaga = despesasPagas.find(dp => 
        dp.usuario_id === usuarioId && 
        dp.despesa_fixa_id === despesaFixaId && 
        dp.data_referencia === dataReferencia
    );
    
    const novasDespesasPagas = despesasPagas.filter(dp => 
        !(dp.usuario_id === usuarioId && 
          dp.despesa_fixa_id === despesaFixaId && 
          dp.data_referencia === dataReferencia)
    );
    escreverArquivo('despesas_pagas_temp', novasDespesasPagas);
    return despesaPaga;
}

// ==================== EXPORTS ====================
module.exports = {
    // Usuários
    getUsuarios,
    getUsuarioById,
    getUsuarioByNome,
    criarUsuario,
    atualizarUsuario,
    excluirUsuario,

    // Categorias
    getCategorias,
    getCategoriaById,
    criarCategoria,
    excluirCategoria,

    // Despesas
    getDespesas,
    getDespesasByUsuario,
    getDespesaById,
    criarDespesa,
    atualizarDespesa,
    excluirDespesa,
    excluirDespesasByGrupoParcelamento,

    // Despesas Fixas
    getDespesasFixas,
    getDespesasFixasByUsuario,
    getDespesaFixaById,
    criarDespesaFixa,
    atualizarDespesaFixa,
    excluirDespesaFixa,

    // Despesas Pagas Temp
    getDespesasPagasTemp,
    getDespesasPagasTempByUsuarioMes,
    getDespesaPagaTempByUsuarioDespesaReferencia,
    criarDespesaPagaTemp,
    excluirDespesaPagaTemp
};
