const db = require('./config/database');

async function verificarDados() {
    try {
        // Verificar se há usuários
        const [usuarios] = await db.query('SELECT * FROM usuarios');
        console.log('Usuários encontrados:', usuarios);
        
        // Verificar se há categorias
        const [categorias] = await db.query('SELECT * FROM categorias');
        console.log('Categorias encontradas:', categorias);
        
        // Verificar se há despesas
        const [despesas] = await db.query('SELECT * FROM despesas');
        console.log('Despesas encontradas:', despesas);
        
        // Verificar se há despesas para um usuário específico (caso tenha usuários)
        if (usuarios.length > 0) {
            const primeiroUsuarioId = usuarios[0].id;
            const [despesasUsuario] = await db.query(
                'SELECT d.*, c.nome as categoria_nome FROM despesas d LEFT JOIN categorias c ON d.categoria_id = c.id WHERE d.usuario_id = ?', 
                [primeiroUsuarioId]
            );
            console.log(`Despesas do primeiro usuário (${usuarios[0].nome}):`, despesasUsuario);
        }
        
    } catch (erro) {
        console.error('Erro ao verificar dados:', erro);
    } finally {
        await db.end(); // Fechar o pool de conexões
    }
}

verificarDados();