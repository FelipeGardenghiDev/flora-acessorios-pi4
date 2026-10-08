-- ==========================================================
-- PROJETO INTEGRADOR IV (PI4) — FLORA ACESSÓRIOS
-- Script DDL para criação do banco de dados MySQL
-- Banco padrão: flora_acessorios
-- ==========================================================

CREATE DATABASE IF NOT EXISTS flora_acessorios
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE flora_acessorios;

-- 1. Tabela de Usuários do Sistema (Autenticação e Perfil)
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(191) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    is_verified TINYINT(1) NOT NULL DEFAULT 0,
    token_verificacao VARCHAR(255) NULL,
    token_reset VARCHAR(255) NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Tabela de Funcionários / Vendedores
CREATE TABLE IF NOT EXISTS funcionario (
    id_func INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    sobrenome VARCHAR(100) NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    admissao DATE NOT NULL,
    desligamento DATE NULL
);

-- 3. Tabela de Categorias de Acessórios
CREATE TABLE IF NOT EXISTS categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabela de Produtos / Catálogo de Acessórios
CREATE TABLE IF NOT EXISTS produto (
    id_prod VARCHAR(50) PRIMARY KEY,
    categoria VARCHAR(100) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    estoque INT NOT NULL DEFAULT 50,
    estoque_minimo INT NOT NULL DEFAULT 10,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 5. Cabeçalho de Vendas
CREATE TABLE IF NOT EXISTS venda_cab (
    id_venda INT AUTO_INCREMENT PRIMARY KEY,
    id_func INT NOT NULL,
    data_venda DATE NOT NULL,
    valor_total DECIMAL(10, 2) NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_venda_funcionario FOREIGN KEY (id_func) 
        REFERENCES funcionario(id_func) ON DELETE CASCADE
);

-- 6. Itens das Vendas
CREATE TABLE IF NOT EXISTS venda_item (
    id_item INT AUTO_INCREMENT PRIMARY KEY,
    id_venda INT NOT NULL,
    id_prod VARCHAR(50) NOT NULL,
    quantidade INT NOT NULL DEFAULT 1,
    valor_unit DECIMAL(10, 2) NOT NULL,
    CONSTRAINT fk_item_venda FOREIGN KEY (id_venda) 
        REFERENCES venda_cab(id_venda) ON DELETE CASCADE,
    CONSTRAINT fk_item_produto FOREIGN KEY (id_prod) 
        REFERENCES produto(id_prod) ON DELETE CASCADE
);

-- 7. Histórico de Demanda (usado pelo modelo preditivo e dashboards)
CREATE TABLE IF NOT EXISTS demand_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_sku VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    units_sold INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_demand_produto FOREIGN KEY (product_sku) 
        REFERENCES produto(id_prod) ON DELETE CASCADE
);

-- 8. Mensagens e Avisos Internos da Equipe
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_name VARCHAR(150) NOT NULL,
    user_email VARCHAR(191) NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Acessórios Favoritados
CREATE TABLE IF NOT EXISTS favourites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_email VARCHAR(191) NOT NULL,
    product_sku VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_user_favourite UNIQUE (user_email, product_sku),
    CONSTRAINT fk_favourite_produto FOREIGN KEY (product_sku) 
        REFERENCES produto(id_prod) ON DELETE CASCADE
);
