-- ============================================================
-- SIGEC - Schema Completo v2.0
-- Supabase / PostgreSQL
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABELA: usuarios
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome          VARCHAR(100) NOT NULL,
  usuario       VARCHAR(50)  UNIQUE NOT NULL,
  senha_hash    TEXT NOT NULL,
  perfil        VARCHAR(20)  NOT NULL CHECK (perfil IN ('ADMIN','GERENTE','CAIXA')),
  status        BOOLEAN      DEFAULT TRUE,
  data_cadastro TIMESTAMPTZ  DEFAULT NOW(),
  ultimo_acesso TIMESTAMPTZ,
  created_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ============================================================
-- TABELA: categorias
-- ============================================================
CREATE TABLE IF NOT EXISTS categorias (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome      VARCHAR(100) NOT NULL,
  descricao TEXT,
  status    BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: clientes
-- ============================================================
CREATE TABLE IF NOT EXISTS clientes (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome           VARCHAR(150) NOT NULL,
  cpf_cnpj       VARCHAR(20)  UNIQUE,
  telefone       VARCHAR(20),
  email          VARCHAR(100),
  endereco       TEXT,
  cidade         VARCHAR(100),
  uf             CHAR(2),
  cep            VARCHAR(10),
  limite_credito NUMERIC(12,2) DEFAULT 0,
  saldo_devedor  NUMERIC(12,2) DEFAULT 0,
  status         BOOLEAN DEFAULT TRUE,
  data_cadastro  TIMESTAMPTZ DEFAULT NOW(),
  observacoes    TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: produtos
-- ============================================================
CREATE TABLE IF NOT EXISTS produtos (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo         VARCHAR(50) UNIQUE NOT NULL,
  nome           VARCHAR(200) NOT NULL,
  categoria_id   UUID REFERENCES categorias(id),
  preco_custo    NUMERIC(12,2) DEFAULT 0,
  preco_venda    NUMERIC(12,2) NOT NULL,
  estoque_atual  NUMERIC(12,3) DEFAULT 0,
  estoque_minimo NUMERIC(12,3) DEFAULT 0,
  codigo_barras  VARCHAR(50),
  unidade        VARCHAR(10) DEFAULT 'UN',
  status         BOOLEAN DEFAULT TRUE,
  data_cadastro  TIMESTAMPTZ DEFAULT NOW(),
  observacoes    TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: estoque_movimentacoes
-- ============================================================
CREATE TABLE IF NOT EXISTS estoque_movimentacoes (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  produto_id       UUID NOT NULL REFERENCES produtos(id),
  tipo             VARCHAR(20) NOT NULL CHECK (tipo IN ('ENTRADA','SAIDA','VENDA','AJUSTE')),
  quantidade       NUMERIC(12,3) NOT NULL,
  estoque_anterior NUMERIC(12,3),
  estoque_atual    NUMERIC(12,3),
  custo_unitario   NUMERIC(12,2),
  data             TIMESTAMPTZ DEFAULT NOW(),
  usuario_id       UUID REFERENCES usuarios(id),
  observacao       TEXT,
  referencia_id    UUID,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: vendas
-- ============================================================
CREATE TABLE IF NOT EXISTS vendas (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_venda    SERIAL,
  cliente_id      UUID REFERENCES clientes(id),
  usuario_id      UUID NOT NULL REFERENCES usuarios(id),
  subtotal        NUMERIC(12,2) NOT NULL DEFAULT 0,
  desconto        NUMERIC(12,2) DEFAULT 0,
  total           NUMERIC(12,2) NOT NULL DEFAULT 0,
  forma_pagamento VARCHAR(20) NOT NULL CHECK (forma_pagamento IN ('DINHEIRO','PIX','CARTAO','CREDIARIO','MISTO')),
  valor_recebido  NUMERIC(12,2) DEFAULT 0,
  troco           NUMERIC(12,2) DEFAULT 0,
  status          VARCHAR(20) DEFAULT 'CONCLUIDA' CHECK (status IN ('CONCLUIDA','CANCELADA','PENDENTE')),
  data            TIMESTAMPTZ DEFAULT NOW(),
  observacoes     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: venda_itens
-- ============================================================
CREATE TABLE IF NOT EXISTS venda_itens (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venda_id       UUID NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
  produto_id     UUID NOT NULL REFERENCES produtos(id),
  quantidade     NUMERIC(12,3) NOT NULL,
  preco_unitario NUMERIC(12,2) NOT NULL,
  desconto       NUMERIC(12,2) DEFAULT 0,
  subtotal       NUMERIC(12,2) NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: movimentacoes_financeiras
-- ============================================================
CREATE TABLE IF NOT EXISTS movimentacoes_financeiras (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id       UUID NOT NULL REFERENCES clientes(id),
  tipo             VARCHAR(20) NOT NULL CHECK (tipo IN ('COMPRA','PAGAMENTO','AJUSTE')),
  descricao        TEXT,
  valor            NUMERIC(12,2) NOT NULL,
  saldo_anterior   NUMERIC(12,2) NOT NULL,
  saldo_atual      NUMERIC(12,2) NOT NULL,
  data             TIMESTAMPTZ DEFAULT NOW(),
  usuario_id       UUID REFERENCES usuarios(id),
  referencia_venda UUID REFERENCES vendas(id),
  observacao       TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: pagamentos
-- ============================================================
CREATE TABLE IF NOT EXISTS pagamentos (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id       UUID NOT NULL REFERENCES clientes(id),
  valor            NUMERIC(12,2) NOT NULL,
  forma_pagamento  VARCHAR(20) DEFAULT 'DINHEIRO',
  data             TIMESTAMPTZ DEFAULT NOW(),
  usuario_id       UUID REFERENCES usuarios(id),
  movimentacao_id  UUID REFERENCES movimentacoes_financeiras(id),
  observacao       TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: licencas (proteção do desenvolvedor)
-- ============================================================
CREATE TABLE IF NOT EXISTS licencas (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa         VARCHAR(200) NOT NULL,
  responsavel     VARCHAR(150),
  email           VARCHAR(100),
  chave_licenca   VARCHAR(100) UNIQUE NOT NULL,
  data_ativacao   TIMESTAMPTZ DEFAULT NOW(),
  data_expiracao  TIMESTAMPTZ NOT NULL,
  status          VARCHAR(20) DEFAULT 'ATIVA' CHECK (status IN ('ATIVA','EXPIRADA','SUSPENSA','TRIAL')),
  tipo            VARCHAR(20) DEFAULT 'TRIAL' CHECK (tipo IN ('TRIAL','MENSAL','ANUAL','VITALICIA')),
  observacoes     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: aceite_termos
-- ============================================================
CREATE TABLE IF NOT EXISTS aceite_termos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id  UUID REFERENCES usuarios(id),
  versao      VARCHAR(20) DEFAULT '1.0',
  ip          VARCHAR(50),
  user_agent  TEXT,
  aceito      BOOLEAN NOT NULL,
  data_aceite TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: audit_logs (auditoria)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id  UUID REFERENCES usuarios(id),
  acao        VARCHAR(50) NOT NULL,
  modulo      VARCHAR(50),
  descricao   TEXT,
  dados_antes JSONB,
  dados_apos  JSONB,
  ip          VARCHAR(50),
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: configuracoes
-- ============================================================
CREATE TABLE IF NOT EXISTS configuracoes (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chave     VARCHAR(100) UNIQUE NOT NULL,
  valor     TEXT,
  descricao TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_produtos_codigo       ON produtos(codigo);
CREATE INDEX IF NOT EXISTS idx_produtos_barras       ON produtos(codigo_barras);
CREATE INDEX IF NOT EXISTS idx_vendas_data           ON vendas(data);
CREATE INDEX IF NOT EXISTS idx_vendas_cliente        ON vendas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_vendas_usuario        ON vendas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_mov_fin_cliente       ON movimentacoes_financeiras(cliente_id);
CREATE INDEX IF NOT EXISTS idx_estoque_mov_produto   ON estoque_movimentacoes(produto_id);
CREATE INDEX IF NOT EXISTS idx_estoque_mov_data      ON estoque_movimentacoes(data);
CREATE INDEX IF NOT EXISTS idx_audit_logs_usuario    ON audit_logs(usuario_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created    ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_acao       ON audit_logs(acao);

-- ============================================================
-- FUNÇÕES
-- ============================================================

-- Verificar senha bcrypt
CREATE OR REPLACE FUNCTION check_password(plain TEXT, hashed TEXT)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT hashed = crypt(plain, hashed);
$$;

-- Gerar hash bcrypt
CREATE OR REPLACE FUNCTION hash_password(plain TEXT)
RETURNS TEXT LANGUAGE sql SECURITY DEFINER AS $$
  SELECT crypt(plain, gen_salt('bf', 10));
$$;
