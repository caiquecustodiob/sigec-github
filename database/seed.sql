-- ============================================================
-- SIGEC - Dados Iniciais (Seed)
-- Execute APÓS o schema.sql
-- ============================================================

-- Categorias padrão
INSERT INTO categorias (nome, descricao) VALUES 
  ('Geral',       'Produtos gerais'),
  ('Alimentos',   'Produtos alimentícios'),
  ('Bebidas',     'Bebidas em geral'),
  ('Higiene',     'Produtos de higiene pessoal'),
  ('Limpeza',     'Produtos de limpeza'),
  ('Eletrônicos', 'Equipamentos eletrônicos')
ON CONFLICT DO NOTHING;

-- Configurações padrão
INSERT INTO configuracoes (chave, valor, descricao) VALUES
  ('empresa_nome',        'SIGEC Comércio',             'Nome da empresa'),
  ('empresa_cnpj',        '00.000.000/0001-00',          'CNPJ da empresa'),
  ('empresa_endereco',    'Rua Principal, 100 - Centro', 'Endereço'),
  ('empresa_telefone',    '(00) 0000-0000',              'Telefone'),
  ('empresa_cidade',      'Natal - RN',                  'Cidade/UF'),
  ('estoque_minimo_alert','5',                           'Qtd mínima para alerta'),
  ('impressora_colunas',  '48',                          'Colunas impressora térmica'),
  ('versao_termos',       '1.0',                         'Versão atual dos termos de uso'),
  ('trial_dias',          '21',                          'Dias de período de teste')
ON CONFLICT (chave) DO NOTHING;

-- Usuário admin padrão (senha: admin123)
INSERT INTO usuarios (nome, usuario, senha_hash, perfil)
VALUES ('Administrador', 'admin', crypt('admin123', gen_salt('bf', 10)), 'ADMIN')
ON CONFLICT (usuario) DO NOTHING;

-- Licença TRIAL padrão (21 dias)
INSERT INTO licencas (empresa, chave_licenca, data_ativacao, data_expiracao, status, tipo)
VALUES (
  'Empresa Demonstração',
  'TRIAL-' || upper(substring(md5(random()::text), 1, 8)) || '-' || upper(substring(md5(random()::text), 1, 4)),
  NOW(),
  NOW() + INTERVAL '21 days',
  'TRIAL',
  'TRIAL'
) ON CONFLICT DO NOTHING;

-- Produtos de exemplo
INSERT INTO produtos (codigo, nome, categoria_id, preco_custo, preco_venda, estoque_atual, estoque_minimo, unidade)
SELECT 'P001','Água Mineral 500ml', id, 0.80, 2.50, 100, 20, 'UN' FROM categorias WHERE nome='Bebidas' LIMIT 1
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO produtos (codigo, nome, categoria_id, preco_custo, preco_venda, estoque_atual, estoque_minimo, unidade)
SELECT 'P002','Refrigerante Lata 350ml', id, 2.50, 5.00, 60, 12, 'UN' FROM categorias WHERE nome='Bebidas' LIMIT 1
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO produtos (codigo, nome, categoria_id, preco_custo, preco_venda, estoque_atual, estoque_minimo, unidade)
SELECT 'P003','Arroz Tipo 1 5kg', id, 18.00, 28.90, 30, 10, 'UN' FROM categorias WHERE nome='Alimentos' LIMIT 1
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO produtos (codigo, nome, categoria_id, preco_custo, preco_venda, estoque_atual, estoque_minimo, unidade)
SELECT 'P004','Feijão Carioca 1kg', id, 7.50, 12.90, 25, 8, 'UN' FROM categorias WHERE nome='Alimentos' LIMIT 1
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO produtos (codigo, nome, categoria_id, preco_custo, preco_venda, estoque_atual, estoque_minimo, unidade)
SELECT 'P005','Sabonete Líquido 250ml', id, 4.00, 8.90, 4, 5, 'UN' FROM categorias WHERE nome='Higiene' LIMIT 1
ON CONFLICT (codigo) DO NOTHING;

-- Cliente de exemplo
INSERT INTO clientes (nome, cpf_cnpj, telefone, limite_credito, saldo_devedor)
VALUES ('Cliente Teste', '000.000.000-00', '(84) 99999-0000', 500.00, 0.00)
ON CONFLICT DO NOTHING;

-- Termos (versão 1.0 registrada)
-- Aceite será registrado quando o usuário aceitar na interface
