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

-- Tabela de despesas (para despesas variáveis e parceladas)
CREATE TABLE IF NOT EXISTS despesas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    categoria_id INT NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    tipo ENUM('variavel', 'parcelada') NOT NULL DEFAULT 'variavel',
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

-- Tabela para despesas fixas
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
);

-- Tabela para rastrear pagamentos de despesas fixas (para armazenar o histórico de pagamentos)
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
CREATE INDEX idx_despesas_fixas_usuario ON despesas_fixas(usuario_id);
CREATE INDEX idx_despesas_pagas_usuario_data ON despesas_pagas_temp(usuario_id, data_referencia);