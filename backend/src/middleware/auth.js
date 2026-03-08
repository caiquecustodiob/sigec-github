/**
 * SIGEC - Middlewares de Autenticação e Autorização
 */

const jwt = require('jsonwebtoken');
const supabase = require('../services/supabase');

// ─── Verificar Token JWT ───────────────────────────────────
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // Verificar licença ativa (a cada request)
    const { data: licenca } = await supabase
      .from('licencas')
      .select('status, data_expiracao')
      .in('status', ['ATIVA', 'TRIAL'])
      .gte('data_expiracao', new Date().toISOString())
      .limit(1)
      .single();

    if (!licenca) {
      return res.status(403).json({
        error: 'Licença expirada ou inativa. Entre em contato com o suporte.',
        codigo: 'LICENCA_INATIVA'
      });
    }

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
    }
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// ─── Apenas Admin / Gerente ────────────────────────────────
const adminOnly = (req, res, next) => {
  if (!['ADMIN', 'GERENTE'].includes(req.user?.perfil)) {
    return res.status(403).json({ error: 'Acesso negado. Requer perfil ADMIN ou GERENTE.' });
  }
  next();
};

// ─── Apenas Admin ─────────────────────────────────────────
const superAdmin = (req, res, next) => {
  if (req.user?.perfil !== 'ADMIN') {
    return res.status(403).json({ error: 'Acesso negado. Requer perfil ADMIN.' });
  }
  next();
};

// ─── Log de Auditoria ─────────────────────────────────────
const auditLog = (acao, modulo) => async (req, res, next) => {
  const original = res.json.bind(res);
  res.json = async (body) => {
    if (res.statusCode < 400 && req.user) {
      try {
        await supabase.from('audit_logs').insert([{
          usuario_id: req.user.id,
          acao,
          modulo,
          descricao: `${req.method} ${req.path}`,
          dados_apos: req.body || null,
          ip: req.ip || req.headers['x-forwarded-for'],
          user_agent: req.headers['user-agent']
        }]);
      } catch (e) { /* não bloquear por falha de log */ }
    }
    return original(body);
  };
  next();
};

module.exports = { authMiddleware, adminOnly, superAdmin, auditLog };
