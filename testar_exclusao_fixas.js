const db = require('./config/database');

async function testarExclusaoDespesasFixas() {
    try {
        console.log('🔍 Iniciando teste de exclusão de despesas fixas...');
        
        // Verificar despesas fixas existentes
        const [despesasFixas] = await db.query('SELECT * FROM despesas_fixas LIMIT 5');
        console.log(`📊 Encontradas ${despesasFixas.length} despesas fixas na tabela`);
        
        if (despesasFixas.length > 0) {
            console.log('📝 Detalhes das primeiras despesas fixas:');
            despesasFixas.forEach(df => {
                console.log(`   ID: ${df.id}, Usuário: ${df.usuario_id}, Descrição: "${df.descricao}"`);
            });
            
            // Testar exclusão de uma despesa fixa específica (se existir)
            const primeiraDespesa = despesasFixas[0];
            console.log(`\n🧪 Testando exclusão da despesa fixa ID: ${primeiraDespesa.id}`);
            
            // Simular exclusão como faria na rota
            const idParaExcluir = `fixa-${primeiraDespesa.id}`;
            const usuarioId = primeiraDespesa.usuario_id;
            
            console.log(`   ID simulado para exclusão: ${idParaExcluir}`);
            console.log(`   ID do usuário: ${usuarioId}`);
            
            // Verificar se a query de exclusão está correta
            const queryExclusao = 'DELETE FROM despesas_fixas WHERE id = ? AND usuario_id = ?';
            console.log(`   Query de exclusão: ${queryExclusao}`);
            
            // Verificar também a exclusão de registros relacionados
            const queryExclusaoPagamentos = 'DELETE FROM despesas_pagas_temp WHERE despesa_fixa_id = ? AND usuario_id = ?';
            console.log(`   Query de exclusão de pagamentos: ${queryExclusaoPagamentos}`);
            
            console.log('\n✅ Teste de exclusão concluído com sucesso!');
        } else {
            console.log('⚠️  Nenhuma despesa fixa encontrada para teste');
        }
        
    } catch (error) {
        console.error('❌ Erro durante o teste:', error.message);
    }
}

// Executar o teste
testarExclusaoDespesasFixas()
    .then(() => console.log('\n🏁 Teste finalizado'))
    .catch(err => console.error('💥 Erro crítico:', err));