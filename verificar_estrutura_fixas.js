const db = require('./config/database');

async function verificarDespesasFixas() {
    try {
        console.log('🔍 Verificando dados na tabela despesas_fixas...');
        
        // Obter informações sobre a estrutura da tabela
        const [estrutura] = await db.query('DESCRIBE despesas_fixas');
        console.log('📋 Estrutura da tabela despesas_fixas:');
        estrutura.forEach(col => {
            console.log(`   ${col.Field}: ${col.Type}, Null: ${col.Null}, Key: ${col.Key}, Default: ${col.Default}`);
        });
        
        // Obter algumas despesas fixas como exemplo
        const [despesasFixas] = await db.query('SELECT * FROM despesas_fixas LIMIT 10');
        console.log(`\n📊 Exemplo de despesas fixas encontradas: ${despesasFixas.length}`);
        
        if (despesasFixas.length > 0) {
            console.log('\n📝 Detalhes das despesas fixas:');
            despesasFixas.forEach(df => {
                console.log(`   ID: ${df.id}, Usuário: ${df.usuario_id}, Categoria: ${df.categoria_id}`);
                console.log(`      Descrição: "${df.descricao}", Valor: R$ ${df.valor}`);
                console.log(`      Dia vencimento: ${df.dia_vencimento}, Ativa: ${df.ativa}`);
                console.log(`      Dividida: ${df.dividida}, Usuário compartilhado: ${df.usuario_compartilhado_id}`);
                console.log('');
            });
        } else {
            console.log('\n⚠️  Nenhuma despesa fixa encontrada na tabela.');
        }
        
        // Verificar também a tabela de pagamentos temporários
        const [pagamentos] = await db.query('SELECT * FROM despesas_pagas_temp LIMIT 5');
        console.log(`\n📊 Exemplo de pagamentos temporários encontrados: ${pagamentos.length}`);
        
        if (pagamentos.length > 0) {
            console.log('\n📝 Detalhes dos pagamentos temporários:');
            pagamentos.forEach(p => {
                console.log(`   ID: ${p.id}, Usuário: ${p.usuario_id}, Despesa fixa: ${p.despesa_fixa_id}`);
                console.log(`      Descrição: "${p.descricao}", Valor: R$ ${p.valor}`);
                console.log(`      Data referência: ${p.data_referencia}, Data pagamento: ${p.data_pagamento}`);
                console.log('');
            });
        }
        
        console.log('✅ Verificação concluída com sucesso!');
    } catch (error) {
        console.error('❌ Erro durante a verificação:', error.message);
    }
}

// Executar a verificação
verificarDespesasFixas()
    .then(() => console.log('\n🏁 Verificação finalizada'))
    .catch(err => console.error('💥 Erro crítico:', err));