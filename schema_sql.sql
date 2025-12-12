-- Criação do banco de dados
CREATE DATABASE IF NOT EXISTS despesas_domesticas;
USE despesas_domesticas;

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario VARCHAR(50) UNIQUE NOT NULL,
    nome VARCHAR(100) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de categorias
CREATE TABLE IF NOT EXISTS categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cor VARCHAR(7) DEFAULT '#3498db',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de despesas
CREATE TABLE IF NOT EXISTS despesas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    categoria_id INT NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    tipo ENUM('fixa', 'variavel', 'parcelada') NOT NULL DEFAULT 'variavel',
    data_vencimento DATE NOT NULL,
    paga BOOLEAN DEFAULT FALSE,
    data_pagamento DATE NULL,
    parcela_atual INT DEFAULT NULL,
    total_parcelas INT DEFAULT NULL,
    grupo_parcelamento VARCHAR(50) DEFAULT NULL,
    dividida BOOLEAN DEFAULT FALSE,
    usuario_compartilhado_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT,
    FOREIGN KEY (usuario_compartilhado_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Inserir categorias padrão
INSERT INTO categorias (nome, cor) VALUES
('Alimentação', '#e74c3c'),
('Moradia', '#3498db'),
('Transporte', '#f39c12'),
('Saúde', '#2ecc71'),
('Educação', '#9b59b6'),
('Lazer', '#1abc9c'),
('Vestuário', '#34495e'),
('Outros', '#95a5a6');

-- Índices para melhor performance
CREATE INDEX idx_despesas_usuario ON despesas(usuario_id);
CREATE INDEX idx_despesas_data ON despesas(data_vencimento);
CREATE INDEX idx_despesas_tipo ON despesas(tipo);