/**
 * SIGEC - Servidor Principal
 * API REST com Express + Supabase
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();

// ─── Middlewares de Segurança ─────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // Frontend separado
  crossOriginEmbedderPolicy: false
}));

// CORS
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5500').split(',').map(o => o.trim());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.some(o => origin.startsWith(o))) return cb(null, true);
    cb(new Error('CORS não permitido: ' + origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting global
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || 900000),
  max: parseInt(process.env.RATE_LIMIT_MAX || 100),
  message: { error: 'Muitas requisições. Aguarde e tente novamente.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', globalLimiter);

// Rate limit mais restrito para auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10,
  message: { error: 'Muitas tentativas de login. Aguarde 15 minutos.' }
});
app.use('/api/auth/login', authLimiter);

// Corpo e compressão
app.use(compression());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Logs
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// ─── Health Check ─────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '2.0.0' });
});

// ─── Rotas ────────────────────────────────────────────────
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/dashboard',   require('./routes/dashboard'));
app.use('/api/produtos',    require('./routes/produtos'));
app.use('/api/categorias',  require('./routes/categorias'));
app.use('/api/estoque',     require('./routes/estoque'));
app.use('/api/clientes',    require('./routes/clientes'));
app.use('/api/vendas',      require('./routes/vendas'));
app.use('/api/crediario',   require('./routes/crediario'));
app.use('/api/relatorios',  require('./routes/relatorios'));
app.use('/api/configuracoes', require('./routes/configuracoes'));
app.use('/api/licenca',     require('./routes/licenca'));
app.use('/api/audit',       require('./routes/audit'));

// ─── 404 ──────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// ─── Error Handler ────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  if (err.message?.includes('CORS')) {
    return res.status(403).json({ error: 'Acesso CORS não permitido' });
  }
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// ─── Iniciar ──────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ SIGEC API rodando na porta ${PORT}`);
  console.log(`   Ambiente: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
