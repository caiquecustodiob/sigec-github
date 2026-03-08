/**
 * SIGEC - Rota: Crediário
 */
const express = require('express');
const router = express.Router();
const supabase = require('../services/supabase');
const { authMiddleware, auditLog } = require('../middleware/auth');

router.post('/pagamento', authMiddleware, auditLog('PAGAMENTO_CREDIARIO', 'CREDIARIO'), async (req, res) => {
  const { cliente_id, valor, forma_pagamento, observacao } = req.body;
  if (!cliente_id || !valor) return res.status(400).json({ error: 'Cliente e valor são obrigatórios' });
  const { data: c } = await supabase.from('clientes').select('saldo_devedor').eq('id', cliente_id).single();
  if (!c) return res.status(404).json({ error: 'Cliente não encontrado' });
  const sa = parseFloat(c.saldo_devedor), vp = parseFloat(valor);
  const su = Math.max(0, sa - vp);
  const { data: mov, error } = await supabase.from('movimentacoes_financeiras').insert([{
    cliente_id, tipo: 'PAGAMENTO',
    descricao: `Pagamento - ${forma_pagamento || 'DINHEIRO'}`,
    valor: vp, saldo_anterior: sa, saldo_atual: su,
    usuario_id: req.user.id, observacao
  }]).select().single();
  if (error) return res.status(400).json({ error: error.message });
  await supabase.from('clientes').update({ saldo_devedor: su }).eq('id', cliente_id);
  await supabase.from('pagamentos').insert([{
    cliente_id, valor: vp, forma_pagamento: forma_pagamento || 'DINHEIRO',
    usuario_id: req.user.id, movimentacao_id: mov.id, observacao
  }]);
  res.json({ success: true, saldo_anterior: sa, saldo_atual: su });
});

module.exports = router;
