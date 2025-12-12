const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'despesas_domesticas',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Teste de conexão
pool.getConnection()
    .then(connection => {
        console.log('✅ Conectado ao banco de dados MariaDB');
        connection.release();
    })
    .catch(err => {
        console.error('❌ Erro ao conectar ao banco de dados:', err.message);
    });

module.exports = pool;