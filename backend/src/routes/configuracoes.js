/**
 * SIGEC - Rota: Configurações
 */
const express = require('express');
const router = express.Router();
const supabase = require('../services/supabase');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.get('/', authMiddleware, async (req, res) => {
  const { data } = await supabase.from('configuracoes').select('*');
  const cfg = {};
  data?.forEach(c => cfg[c.chave] = c.valor);
  res.json(cfg);
});

router.put('/', authMiddleware, adminOnly, async (req, res) => {
  for (const [chave, valor] of Object.entries(req.body)) {
    await supabase.from('configuracoes').upsert({ chave, valor, updated_at: new Date() }, { onConflict: 'chave' });
  }
  res.json({ success: true });
});

module.exports = router;
