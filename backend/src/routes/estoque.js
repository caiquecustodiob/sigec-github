/**
 * SIGEC - Rota: Estoque
 */
const express = require('express');
const router = express.Router();
const supabase = require('../services/supabase');
const { authMiddleware, auditLog } = require('../middleware/auth');

// GET /api/estoque/movimentacoes
router.get('/movimentacoes', authMiddleware, async (req, res) => {
  const { produto_id, data_ini, data_fim } = req.query;
  let q = supabase.from('estoque_movimentacoes')
    .select('*, produtos(nome, codigo), usuarios(nome)')
    .order('data', { ascending: false })
    .limit(200);
  if (produto_id) q = q.eq('produto_id', produto_id);
  if (data_ini)   q = q.gte('data', data_ini);
  if (data_fim)   q = q.lte('data', data_fim + 'T23:59:59');
  const { data, error } = await q;
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// POST /api/estoque/movimentacao
router.post('/movimentacao', authMiddleware, auditLog('MOV_ESTOQUE', 'ESTOQUE'), async (req, res) => {
  const { produto_id, tipo, quantidade, observacao, custo_unitario } = req.body;
  if (!produto_id || !tipo || !quantidade) return res.status(400).json({ error: 'Campos obrigatórios ausentes' });

  const { data: prod } = await supabase.from('produtos').select('estoque_atual').eq('id', produto_id).single();
  if (!prod) return res.status(404).json({ error: 'Produto não encontrado' });

  let novoEstoque = parseFloat(prod.estoque_atual);
  if (tipo === 'ENTRADA' || tipo === 'AJUSTE') novoEstoque += parseFloat(quantidade);
  else if (tipo === 'SAIDA') novoEstoque -= parseFloat(quantidade);

  await supabase.from('produtos').update({ estoque_atual: novoEstoque }).eq('id', produto_id);
  const { data, error } = await supabase.from('estoque_movimentacoes').insert([{
    produto_id, tipo, quantidade, estoque_anterior: prod.estoque_atual,
    estoque_atual: novoEstoque, custo_unitario, observacao, usuario_id: req.user.id
  }]).select();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data[0]);
});

module.exports = router;
