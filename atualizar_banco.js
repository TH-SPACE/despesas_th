const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'despesas_domesticas'
});

console.log('Iniciando atualização do banco de dados...');

// SQL para criar as novas tabelas
const createDespesasFixasTable = `
    CREATE TABLE IF NOT EXISTS despesas_fixas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        categoria_id INT NOT NULL,
        descricao VARCHAR(255) NOT NULL,
        valor DECIMAL(10, 2) NOT NULL,
        dia_vencimento INT NOT NULL COMMENT 'Dia do mês em que a despesa vence (1-31)',
        ativa BOOLEAN DEFAULT TRUE COMMENT 'Indica se a despesa fixa está ativa',
        dividida BOOLEAN DEFAULT FALSE,
        usuario_compartilhado_id INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT,
        FOREIGN KEY (usuario_compartilhado_id) REFERENCES usuarios(id) ON DELETE SET NULL
    )
`;

const createDespesasPagasTempTable = `
    CREATE TABLE IF NOT EXISTS despesas_pagas_temp (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        despesa_fixa_id INT NOT NULL,
        descricao VARCHAR(255) NOT NULL,
        valor DECIMAL(10, 2) NOT NULL,
        data_referencia DATE NOT NULL COMMENT 'Data de referência para o pagamento (ano-mes-dia)',
        data_pagamento DATE NULL,
        tipo ENUM('fixa') NOT NULL DEFAULT 'fixa',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        FOREIGN KEY (despesa_fixa_id) REFERENCES despesas_fixas(id) ON DELETE CASCADE,
        UNIQUE KEY uk_usuario_despesa_referencia (usuario_id, despesa_fixa_id, data_referencia)
    )
`;

const createIndexDespesasFixas = `CREATE INDEX IF NOT EXISTS idx_despesas_fixas_usuario ON despesas_fixas(usuario_id)`;
const createIndexDespesasPagas = `CREATE INDEX IF NOT EXISTS idx_despesas_pagas_usuario_data ON despesas_pagas_temp(usuario_id, data_referencia)`;

connection.query(createDespesasFixasTable, (err, results) => {
    if (err) {
        console.error('Erro ao criar tabela despesas_fixas:', err);
        connection.end();
        return;
    }
    console.log('Tabela despesas_fixas criada ou já existente.');

    connection.query(createDespesasPagasTempTable, (err, results) => {
        if (err) {
            console.error('Erro ao criar tabela despesas_pagas_temp:', err);
            connection.end();
            return;
        }
        console.log('Tabela despesas_pagas_temp criada ou já existente.');

        connection.query(createIndexDespesasFixas, (err, results) => {
            if (err) {
                console.error('Erro ao criar índice para despesas_fixas:', err);
            } else {
                console.log('Índice para despesas_fixas criado ou já existente.');
            }

            connection.query(createIndexDespesasPagas, (err, results) => {
                if (err) {
                    console.error('Erro ao criar índice para despesas_pagas_temp:', err);
                } else {
                    console.log('Índice para despesas_pagas_temp criado ou já existente.');
                }

                // Atualizar a coluna tipo na tabela despesas para excluir 'fixa'
                const updateTipoEnum = `ALTER TABLE despesas MODIFY COLUMN tipo ENUM('variavel', 'parcelada') NOT NULL DEFAULT 'variavel'`;
                
                connection.query(updateTipoEnum, (err, results) => {
                    if (err) {
                        console.error('Erro ao atualizar ENUM na coluna tipo de despesas:', err);
                    } else {
                        console.log('Coluna tipo em despesas atualizada (excluindo \'fixa\').');
                    }
                    
                    console.log('Atualização do banco de dados concluída!');
                    connection.end();
                });
            });
        });
    });
});