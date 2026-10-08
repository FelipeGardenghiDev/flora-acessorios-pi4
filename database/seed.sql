-- ==========================================================
-- PROJETO INTEGRADOR IV (PI4) — FLORA ACESSÓRIOS
-- Script de Carga Inicial (Seeds) para o banco flora_acessorios
-- ==========================================================

USE flora_acessorios;

-- 1. Categorias Iniciais
INSERT IGNORE INTO categorias (id, nome, slug) VALUES
(1, 'Anéis', 'aneis'),
(2, 'Brincos', 'brincos'),
(3, 'Colares', 'colares'),
(4, 'Pulseiras', 'pulseiras'),
(5, 'Braceletes', 'braceletes');

-- 2. Funcionários / Equipe de Vendas
INSERT IGNORE INTO funcionario (id_func, nome, sobrenome, cpf, admissao, desligamento) VALUES
(1, 'Mariana', 'Silva', '123.456.789-01', '2025-01-15', NULL),
(2, 'Lucas', 'Oliveira', '234.567.890-12', '2025-02-01', NULL),
(3, 'Beatriz', 'Santos', '345.678.901-23', '2025-03-10', NULL),
(4, 'Felipe', 'Gardenghi', '456.789.012-34', '2025-01-10', NULL);

-- 3. Catálogo de Produtos
INSERT IGNORE INTO produto (id_prod, categoria, descricao, valor, estoque, estoque_minimo) VALUES
('ANE-001', 'Anéis', 'Anel Solitário Prata 925 com Zircônia', 129.90, 42, 10),
('ANE-002', 'Anéis', 'Anel Falange Regulável Dourado', 79.90, 18, 12),
('ANE-003', 'Anéis', 'Anel Três Fios Folheado a Ouro 18k', 159.00, 8, 10),
('BRI-001', 'Brincos', 'Brinco Argola Cravejada Zircônias', 89.90, 65, 15),
('BRI-002', 'Brincos', 'Brinco Ponto de Luz Prata 925', 49.90, 80, 20),
('BRI-003', 'Brincos', 'Brinco Cascata Pérolas Barrocas', 119.50, 14, 10),
('COL-001', 'Colares', 'Colar Gravatinha com Zircônias', 149.90, 31, 10),
('COL-002', 'Colares', 'Colar Choker Elos Dourados', 189.00, 25, 8),
('PUL-001', 'Pulseiras', 'Pulseira Riviera Cristal Regulável', 139.90, 38, 12),
('BRA-001', 'Braceletes', 'Bracelete Rígido Minimalista Prata', 169.00, 19, 10),
('BRA-002', 'Braceletes', 'Bracelete Folheado Ondulado', 199.90, 6, 8);

-- 4. Usuário Padrão de Demonstração (Senha: Flora2026@)
-- Hash bcrypt de 'Flora2026@'
INSERT IGNORE INTO usuarios (id, nome, email, senha, is_verified) VALUES
(1, 'Administrador Flora', 'admin@flora.com', '$2b$10$W4dieZ6iwgaKsJLSmh5bN.flTCvTHSuzvUHnCqeoKn5P8PhCFQx9a', 1);

-- 5. Histórico Inicial de Vendas (Cab e Itens)
INSERT IGNORE INTO venda_cab (id_venda, id_func, data_venda, valor_total) VALUES
(1, 1, '2026-09-01', 219.80),
(2, 2, '2026-09-05', 189.00),
(3, 3, '2026-09-12', 338.90),
(4, 4, '2026-09-18', 299.80),
(5, 1, '2026-09-25', 129.90),
(6, 2, '2026-10-01', 278.90),
(7, 3, '2026-10-03', 149.90),
(8, 4, '2026-10-06', 418.80);

INSERT IGNORE INTO venda_item (id_item, id_venda, id_prod, quantidade, valor_unit) VALUES
(1, 1, 'ANE-001', 1, 129.90),
(2, 1, 'BRI-001', 1, 89.90),
(3, 2, 'COL-002', 1, 189.00),
(4, 3, 'PUL-001', 1, 139.90),
(5, 3, 'BRA-002', 1, 199.90),
(6, 4, 'COL-001', 2, 149.90),
(7, 5, 'ANE-001', 1, 129.90),
(8, 6, 'BRI-001', 1, 89.90),
(9, 6, 'COL-002', 1, 189.00),
(10, 7, 'COL-001', 1, 149.90),
(11, 8, 'BRA-001', 1, 169.00),
(12, 8, 'ANE-003', 1, 159.00),
(13, 8, 'BRI-001', 1, 89.90);

-- 6. Registros de Demanda (Demand Records dos últimos 30 dias para previsões)
INSERT IGNORE INTO demand_records (product_sku, date, units_sold) VALUES
('ANE-001', '2026-09-10', 4),
('ANE-001', '2026-09-15', 5),
('ANE-001', '2026-09-20', 6),
('ANE-001', '2026-09-25', 5),
('ANE-001', '2026-09-30', 7),
('ANE-001', '2026-10-05', 8),
('BRI-001', '2026-09-10', 8),
('BRI-001', '2026-09-15', 7),
('BRI-001', '2026-09-20', 10),
('BRI-001', '2026-09-25', 9),
('BRI-001', '2026-09-30', 11),
('BRI-001', '2026-10-05', 12),
('COL-001', '2026-09-10', 3),
('COL-001', '2026-09-15', 4),
('COL-001', '2026-09-20', 5),
('COL-001', '2026-09-25', 4),
('COL-001', '2026-09-30', 6),
('COL-001', '2026-10-05', 7),
('PUL-001', '2026-09-10', 2),
('PUL-001', '2026-09-15', 3),
('PUL-001', '2026-09-20', 4),
('PUL-001', '2026-09-25', 5),
('PUL-001', '2026-09-30', 4),
('PUL-001', '2026-10-05', 6),
('BRA-001', '2026-09-10', 1),
('BRA-001', '2026-09-15', 2),
('BRA-001', '2026-09-20', 3),
('BRA-001', '2026-09-25', 2),
('BRA-001', '2026-09-30', 4),
('BRA-001', '2026-10-05', 5);

-- 7. Mensagens Iniciais do Painel Interno
INSERT IGNORE INTO messages (id, user_name, user_email, text, created_at) VALUES
(1, 'Coordenação Flora', 'coordenacao@flora.com', 'Boas-vindas à versão 4.0 do sistema Flora Acessórios! Estoque e dashboard sincronizados.', '2026-09-01 09:00:00'),
(2, 'Mariana Silva', 'mariana@flora.com', 'Aviso: Anel Solitário ANE-001 com alta saída na última semana.', '2026-10-02 14:30:00'),
(3, 'Lucas Oliveira', 'lucas@flora.com', 'Reposição de brincos e colares recebida no estoque central.', '2026-10-06 11:15:00');
