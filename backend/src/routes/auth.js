/**
 * SIGEC - Rotas de Autenticação
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../services/supabase');
const { authMiddleware, adminOnly, auditLog } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { usuario, senha } = req.body;

  if (!usuario || !senha) {
    return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
  }

  // Sanitização básica
  if (typeof usuario !== 'string' || usuario.length > 50) {
    return res.status(400).json({ error: 'Dados inválidos' });
  }

  const { data: user, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('usuario', usuario.trim())
    .eq('status', true)
    .single();

  if (error || !user) {
    return res.status(401).json({ error: 'Usuário não encontrado' });
  }

  // Verificar se tem aceite dos termos
  const { data: aceite } = await supabase
    .from('aceite_termos')
    .select('id, aceito')
    .eq('usuario_id', user.id)
    .eq('aceito', true)
    .limit(1)
    .single();

  // Verificar senha via pgcrypto
  const { data: senhaOk } = await supabase
    .rpc('check_password', { plain: senha, hashed: user.senha_hash });

  if (!senhaOk) {
    // Logar tentativa falha
    await supabase.from('audit_logs').insert([{
      usuario_id: user.id,
      acao: 'LOGIN_FALHA',
      modulo: 'AUTH',
      descricao: `Tentativa de login falhou para ${usuario}`,
      ip: req.ip
    }]);
    return res.status(401).json({ error: 'Senha incorreta' });
  }

  // Atualizar último acesso
  await supabase.from('usuarios').update({ ultimo_acesso: new Date() }).eq('id', user.id);

  // Gerar token JWT
  const token = jwt.sign(
    { id: user.id, nome: user.nome, usuario: user.usuario, perfil: user.perfil },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '12h' }
  );

  // Logar login bem-sucedido
  await supabase.from('audit_logs').insert([{
    usuario_id: user.id,
    acao: 'LOGIN',
    modulo: 'AUTH',
    descricao: `Login realizado - perfil: ${user.perfil}`,
    ip: req.ip,
    user_agent: req.headers['user-agent']
  }]);

  res.json({
    token,
    user: { id: user.id, nome: user.nome, usuario: user.usuario, perfil: user.perfil },
    requer_aceite_termos: !aceite
  });
});

// POST /api/auth/aceitar-termos
router.post('/aceitar-termos', authMiddleware, async (req, res) => {
  const { aceito } = req.body;
  const { data: cfg } = await supabase
    .from('configuracoes').select('valor').eq('chave', 'versao_termos').single();

  await supabase.from('aceite_termos').insert([{
    usuario_id: req.user.id,
    versao: cfg?.valor || '1.0',
    ip: req.ip,
    user_agent: req.headers['user-agent'],
    aceito: !!aceito
  }]);

  if (!aceito) {
    return res.json({ message: 'Termos recusados. Acesso negado.', recusado: true });
  }
  res.json({ message: 'Termos aceitos com sucesso.' });
});

// POST /api/auth/criar-usuario
router.post('/criar-usuario', authMiddleware, adminOnly, async (req, res) => {
  const { nome, usuario, senha, perfil } = req.body;
  if (!nome || !usuario || !senha || !perfil) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }
  if (!['ADMIN', 'GERENTE', 'CAIXA'].includes(perfil)) {
    return res.status(400).json({ error: 'Perfil inválido' });
  }
  const senha_hash = await bcrypt.hash(senha, 12);
  const { data, error } = await supabase
    .from('usuarios').insert([{ nome, usuario, senha_hash, perfil }]).select();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Usuário criado!', usuario: { id: data[0].id, nome, usuario, perfil } });
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  const { data } = await supabase
    .from('usuarios').select('id, nome, usuario, perfil, ultimo_acesso').eq('id', req.user.id).single();
  res.json(data);
});

module.exports = router;
