# SIGEC — Guia de Configuração Completa

## ⚡ Implantação em 5 passos

---

### PASSO 1 — Banco de Dados (Supabase)

1. Acesse https://supabase.com e crie um projeto na região **sa-east-1** (São Paulo)
2. Vá em **SQL Editor** e execute o arquivo `database/schema.sql`
3. Execute o arquivo `database/seed.sql`
4. Acesse **Project Settings → API** e copie:
   - `Project URL`
   - `service_role` secret key

---

### PASSO 2 — Configurar Variáveis de Ambiente

```bash
# No diretório backend/
cp .env.example .env
```

Edite o `.env`:
```env
SUPABASE_URL=https://SEU_ID.supabase.co
SUPABASE_SERVICE_KEY=sua_service_role_key
JWT_SECRET=uma_chave_muito_secreta_min32chars
CORS_ORIGINS=https://seu-app.vercel.app
```

---

### PASSO 3 — Conectar GitHub ao Vercel

1. Acesse https://vercel.com
2. **New Project** → **Import Git Repository** → selecione `caiquecustodiob/sigec`
3. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Other (Static)
4. Clique em **Deploy**

A cada `git push` na branch `main`, o Vercel atualiza automaticamente!

---

### PASSO 4 — Atualizar URL da API no Frontend

Edite `frontend/src/js/api.js`, linha 6:
```js
const API_BASE = 'https://SEU_PROJETO.supabase.co/functions/v1/sigec-api';
```

---

### PASSO 5 — Primeiro Acesso

- URL: https://seu-app.vercel.app
- **Usuário**: `admin`
- **Senha**: `admin123`

> ⚠️ Troque a senha imediatamente após o primeiro login!

---

## 🔄 Fluxo de Atualizações

```bash
# Qualquer alteração no código:
git add .
git commit -m "feat: descrição da mudança"
git push origin main
# Vercel faz o deploy automaticamente!
```

---

## 🔐 GitHub Secrets (para CI/CD automático)

Adicione em **Settings → Secrets → Actions**:

| Secret | Valor |
|--------|-------|
| `VERCEL_TOKEN` | Token da Vercel |
| `VERCEL_ORG_ID` | ID da organização Vercel |
| `VERCEL_PROJECT_ID` | ID do projeto Vercel |
| `SUPABASE_PROJECT_ID` | ID do projeto Supabase |
| `SUPABASE_ACCESS_TOKEN` | Token de acesso Supabase |

---

## 📱 PWA — Instalar como App

O sistema suporta instalação como aplicativo:

- **Android**: Abra no Chrome → Menu → "Adicionar à tela inicial"
- **Desktop**: Ícone de instalação na barra de endereços do Chrome

---

## 🏗️ Estrutura do Banco (Tabelas)

| Tabela | Descrição |
|--------|-----------|
| `usuarios` | Contas de acesso |
| `categorias` | Categorias de produtos |
| `clientes` | Cadastro de clientes |
| `produtos` | Produtos e preços |
| `estoque_movimentacoes` | Entradas e saídas |
| `vendas` | Cabeçalho das vendas |
| `venda_itens` | Itens de cada venda |
| `movimentacoes_financeiras` | Crediário |
| `pagamentos` | Pagamentos recebidos |
| `licencas` | Controle de licença |
| `aceite_termos` | Registro de aceite |
| `audit_logs` | Auditoria de ações |
| `configuracoes` | Parâmetros do sistema |
