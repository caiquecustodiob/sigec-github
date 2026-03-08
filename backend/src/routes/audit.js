/**
 * SIGEC - Rota: Auditoria
 */
const express = require('express');
const router = express.Router();
const supabase = require('../services/supabase');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.get('/', authMiddleware, adminOnly, async (req, res) => {
  const { acao, usuario_id, data_ini, data_fim } = req.query;
  let q = supabase.from('audit_logs')
    .select('*, usuarios(nome, usuario)')
    .order('created_at', { ascending: false })
    .limit(200);
  if (acao)        q = q.eq('acao', acao);
  if (usuario_id)  q = q.eq('usuario_id', usuario_id);
  if (data_ini)    q = q.gte('created_at', data_ini);
  if (data_fim)    q = q.lte('created_at', data_fim + 'T23:59:59');
  const { data, error } = await q;
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

module.exports = router;
