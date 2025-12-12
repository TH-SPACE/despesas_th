-- Atualização do esquema para adicionar suporte a despesas fixas

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

-- Índice para melhorar performance na consulta de despesas fixas por usuário
CREATE INDEX idx_despesas_fixas_usuario ON despesas_fixas(usuario_id);

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

-- Índice para melhorar performance na consulta de pagamentos por usuário e data
CREATE INDEX idx_despesas_pagas_usuario_data ON despesas_pagas_temp(usuario_id, data_referencia);