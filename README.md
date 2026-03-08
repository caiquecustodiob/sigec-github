# SIGEC — Sistema Integrado de Gestão Comercial

> PDV · Estoque · Clientes · Crediário · Financeiro · PWA

---

## 🚀 Deploy Rápido

| Serviço | Status |
|---------|--------|
| Frontend | Vercel (auto-deploy via GitHub) |
| Backend (API) | Supabase Edge Functions |
| Banco de Dados | Supabase PostgreSQL |

---

## 📁 Estrutura do Projeto

```
sigec/
├── frontend/          # Interface web (HTML + CSS + JS puro)
│   ├── public/        # Arquivos estáticos (icons, manifest)
│   └── src/           # Código-fonte (css, js separados)
├── backend/           # API REST (Node.js + Express) — opcional local
│   └── src/
│       ├── middleware/ # Auth, segurança, rate-limit
│       ├── routes/     # Endpoints organizados por domínio
│       └── services/   # Lógica de negócio
├── database/          # Schema SQL e seeds
└── .github/workflows/ # CI/CD automático
```

---

## ⚡ Setup em 3 passos

### 1. Clone e configure o ambiente

```bash
git clone https://github.com/caiquecustodiob/sigec.git
cd sigec

# Backend
cd backend
cp .env.example .env
# Edite .env com suas chaves do Supabase
npm install
npm start
```

### 2. Configure o Supabase

- Acesse [supabase.com](https://supabase.com)
- Execute `database/schema.sql` no SQL Editor
- Execute `database/seed.sql` para dados iniciais

### 3. Configure variáveis de ambiente

```env
SUPABASE_URL=https://SEU_PROJETO.supabase.co
SUPABASE_SERVICE_KEY=sua_service_role_key
JWT_SECRET=sua_chave_secreta_forte
```

---

## 🔐 Acesso Padrão

| Usuário | Senha | Perfil |
|---------|-------|--------|
| admin | admin123 | ADMIN |

> ⚠️ Troque a senha após o primeiro login!

---

## 🧩 Módulos

- **PDV** — Ponto de venda com busca, carrinho, desconto, troco, ESC/POS
- **Produtos** — CRUD completo com categorias e controle de estoque
- **Clientes** — Cadastro com histórico financeiro
- **Crediário** — Compras a prazo, pagamentos parciais
- **Estoque** — Movimentações ENTRADA/SAÍDA/AJUSTE
- **Relatórios** — Vendas, estoque, fluxo de caixa, devedores
- **Auditoria** — Logs de todas as ações importantes
- **Licenças** — Controle de trial (21 dias) e ativação
- **PWA** — Instalável em Android e Desktop

---

## 📄 Licença

Software proprietário. Uso permitido apenas mediante licença ativa.
© 2024 SIGEC — Todos os direitos reservados.
