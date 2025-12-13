-- --------------------------------------------------------
-- Servidor:                     127.0.0.1
-- Versão do servidor:           12.0.2-MariaDB - mariadb.org binary distribution
-- OS do Servidor:               Win64
-- HeidiSQL Versão:              12.11.0.7065
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Copiando estrutura do banco de dados para despesas_domesticas
CREATE DATABASE IF NOT EXISTS `despesas_domesticas` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci */;
USE `despesas_domesticas`;

-- Copiando estrutura para tabela despesas_domesticas.categorias
CREATE TABLE IF NOT EXISTS `categorias` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `cor` varchar(7) DEFAULT '#3498db',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Copiando dados para a tabela despesas_domesticas.categorias: ~8 rows (aproximadamente)
DELETE FROM `categorias`;
INSERT INTO `categorias` (`id`, `nome`, `cor`, `created_at`) VALUES
	(1, 'Alimentação', '#e74c3c', '2025-12-12 18:51:35'),
	(2, 'Moradia', '#3498db', '2025-12-12 18:51:35'),
	(3, 'Transporte', '#f39c12', '2025-12-12 18:51:35'),
	(4, 'Saúde', '#2ecc71', '2025-12-12 18:51:35'),
	(6, 'Lazer', '#1abc9c', '2025-12-12 18:51:35'),
	(7, 'Vestuário', '#34495e', '2025-12-12 18:51:35'),
	(8, 'Outros', '#95a5a6', '2025-12-12 18:51:35'),
	(9, 'MERCADO PAGO', '#0dc1fd', '2025-12-13 00:26:21');

-- Copiando estrutura para tabela despesas_domesticas.despesas
CREATE TABLE IF NOT EXISTS `despesas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `categoria_id` int(11) NOT NULL,
  `descricao` varchar(255) NOT NULL,
  `valor` decimal(10,2) NOT NULL,
  `tipo` enum('variavel','parcelada') NOT NULL DEFAULT 'variavel',
  `data_vencimento` date NOT NULL,
  `paga` tinyint(1) DEFAULT 0,
  `data_pagamento` date DEFAULT NULL,
  `parcela_atual` int(11) DEFAULT NULL,
  `total_parcelas` int(11) DEFAULT NULL,
  `grupo_parcelamento` varchar(50) DEFAULT NULL,
  `dividida` tinyint(1) DEFAULT 0,
  `usuario_compartilhado_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `categoria_id` (`categoria_id`),
  KEY `usuario_compartilhado_id` (`usuario_compartilhado_id`),
  KEY `idx_despesas_usuario` (`usuario_id`),
  KEY `idx_despesas_data` (`data_vencimento`),
  KEY `idx_despesas_tipo` (`tipo`),
  CONSTRAINT `despesas_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `despesas_ibfk_2` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`),
  CONSTRAINT `despesas_ibfk_3` FOREIGN KEY (`usuario_compartilhado_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Copiando dados para a tabela despesas_domesticas.despesas: ~4 rows (aproximadamente)
DELETE FROM `despesas`;
INSERT INTO `despesas` (`id`, `usuario_id`, `categoria_id`, `descricao`, `valor`, `tipo`, `data_vencimento`, `paga`, `data_pagamento`, `parcela_atual`, `total_parcelas`, `grupo_parcelamento`, `dividida`, `usuario_compartilhado_id`, `created_at`) VALUES
	(3, 1, 6, 'PARCELA (1/3)', 150.00, 'parcelada', '2025-12-11', 0, NULL, 1, 3, '1765565852330-1', 0, NULL, '2025-12-12 18:57:32'),
	(4, 1, 6, 'PARCELA (2/3)', 150.00, 'parcelada', '2026-01-11', 0, NULL, 2, 3, '1765565852330-1', 0, NULL, '2025-12-12 18:57:32'),
	(5, 1, 6, 'PARCELA (3/3)', 150.00, 'parcelada', '2026-02-11', 0, NULL, 3, 3, '1765565852330-1', 0, NULL, '2025-12-12 18:57:32'),
	(18, 1, 6, 'TS', 112.00, 'variavel', '2025-12-12', 0, NULL, NULL, NULL, NULL, 0, NULL, '2025-12-12 19:24:52');

-- Copiando estrutura para tabela despesas_domesticas.despesas_fixas
CREATE TABLE IF NOT EXISTS `despesas_fixas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `categoria_id` int(11) NOT NULL,
  `descricao` varchar(255) NOT NULL,
  `valor` decimal(10,2) NOT NULL,
  `dia_vencimento` int(11) NOT NULL COMMENT 'Dia do mês em que a despesa vence (1-31)',
  `ativa` tinyint(1) DEFAULT 1 COMMENT 'Indica se a despesa fixa está ativa',
  `dividida` tinyint(1) DEFAULT 0,
  `usuario_compartilhado_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `categoria_id` (`categoria_id`),
  KEY `usuario_compartilhado_id` (`usuario_compartilhado_id`),
  KEY `idx_despesas_fixas_usuario` (`usuario_id`),
  CONSTRAINT `despesas_fixas_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `despesas_fixas_ibfk_2` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`),
  CONSTRAINT `despesas_fixas_ibfk_3` FOREIGN KEY (`usuario_compartilhado_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Copiando dados para a tabela despesas_domesticas.despesas_fixas: ~1 rows (aproximadamente)
DELETE FROM `despesas_fixas`;
INSERT INTO `despesas_fixas` (`id`, `usuario_id`, `categoria_id`, `descricao`, `valor`, `dia_vencimento`, `ativa`, `dividida`, `usuario_compartilhado_id`, `created_at`, `updated_at`) VALUES
	(3, 1, 2, 'condominio', 250.00, 12, 1, 0, NULL, '2025-12-13 00:06:42', '2025-12-13 00:06:42');

-- Copiando estrutura para tabela despesas_domesticas.despesas_pagas_temp
CREATE TABLE IF NOT EXISTS `despesas_pagas_temp` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `despesa_fixa_id` int(11) NOT NULL,
  `descricao` varchar(255) NOT NULL,
  `valor` decimal(10,2) NOT NULL,
  `data_referencia` date NOT NULL COMMENT 'Data de referência para o pagamento (ano-mes-dia)',
  `data_pagamento` date DEFAULT NULL,
  `tipo` enum('fixa') NOT NULL DEFAULT 'fixa',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_usuario_despesa_referencia` (`usuario_id`,`despesa_fixa_id`,`data_referencia`),
  KEY `despesa_fixa_id` (`despesa_fixa_id`),
  KEY `idx_despesas_pagas_usuario_data` (`usuario_id`,`data_referencia`),
  CONSTRAINT `despesas_pagas_temp_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `despesas_pagas_temp_ibfk_2` FOREIGN KEY (`despesa_fixa_id`) REFERENCES `despesas_fixas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Copiando dados para a tabela despesas_domesticas.despesas_pagas_temp: ~0 rows (aproximadamente)
DELETE FROM `despesas_pagas_temp`;

-- Copiando estrutura para tabela despesas_domesticas.usuarios
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario` varchar(50) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `senha` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario` (`usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Copiando dados para a tabela despesas_domesticas.usuarios: ~2 rows (aproximadamente)
DELETE FROM `usuarios`;
INSERT INTO `usuarios` (`id`, `usuario`, `nome`, `senha`, `created_at`) VALUES
	(1, 'thiago', 'Thiago Alves', '$2b$10$g9wKixF8yX0MJ5Ay36Jj4OWIL.tkzGrvpPbKh0jLAx/WkEi/3Inxy', '2025-12-12 18:55:29'),
	(2, 'vanessa', 'Vanessa Moreira', '$2b$10$eTRxnguWeXxauewA2BR3W.QI8j6TF08S2SPvid3jkHGeM/RC5wDf6', '2025-12-12 18:55:29');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
