/**
 * SIGEC - Rota: Vendas
 */
const express = require('express');
const router = express.Router();
const supabase = require('../services/supabase');
const { authMiddleware, adminOnly, auditLog } = require('../middleware/auth');

// POST /api/vendas
router.post('/', authMiddleware, auditLog('NOVA_VENDA', 'VENDAS'), async (req, res) => {
  const { cliente_id, itens, subtotal, desconto, total, forma_pagamento, valor_recebido, troco, observacoes } = req.body;
  if (!itens?.length) return res.status(400).json({ error: 'Venda sem itens' });

  const { data: venda, error: ev } = await supabase.from('vendas').insert([{
    cliente_id, subtotal, desconto, total, forma_pagamento,
    valor_recebido, troco, usuario_id: req.user.id, observacoes
  }]).select().single();
  if (ev) return res.status(400).json({ error: ev.message });

  // Inserir itens
  await supabase.from('venda_itens').insert(itens.map(i => ({
    venda_id: venda.id, produto_id: i.produto_id, quantidade: i.quantidade,
    preco_unitario: i.preco_unitario, desconto: i.desconto || 0, subtotal: i.subtotal
  })));

  // Atualizar estoque
  for (const item of itens) {
    const { data: p } = await supabase.from('produtos').select('estoque_atual').eq('id', item.produto_id).single();
    if (p) {
      const ne = parseFloat(p.estoque_atual) - parseFloat(item.quantidade);
      await supabase.from('produtos').update({ estoque_atual: ne }).eq('id', item.produto_id);
      await supabase.from('estoque_movimentacoes').insert([{
        produto_id: item.produto_id, tipo: 'VENDA', quantidade: item.quantidade,
        estoque_anterior: p.estoque_atual, estoque_atual: ne,
        usuario_id: req.user.id, referencia_id: venda.id,
        observacao: `Venda #${venda.numero_venda}`
      }]);
    }
  }

  // Crediário
  if (forma_pagamento === 'CREDIARIO' && cliente_id) {
    const { data: c } = await supabase.from('clientes').select('saldo_devedor').eq('id', cliente_id).single();
    if (c) {
      const sa = parseFloat(c.saldo_devedor), su = sa + parseFloat(total);
      await supabase.from('movimentacoes_financeiras').insert([{
        cliente_id, tipo: 'COMPRA', descricao: `Venda #${venda.numero_venda}`,
        valor: total, saldo_anterior: sa, saldo_atual: su,
        usuario_id: req.user.id, referencia_venda: venda.id
      }]);
      await supabase.from('clientes').update({ saldo_devedor: su }).eq('id', cliente_id);
    }
  }

  res.status(201).json(venda);
});

// GET /api/vendas
router.get('/', authMiddleware, async (req, res) => {
  const { data_ini, data_fim, cliente_id, status } = req.query;
  let q = supabase.from('vendas')
    .select('*, clientes(nome), usuarios(nome), venda_itens(*, produtos(nome, codigo))')
    .order('data', { ascending: false }).limit(100);
  if (data_ini)   q = q.gte('data', data_ini);
  if (data_fim)   q = q.lte('data', data_fim + 'T23:59:59');
  if (cliente_id) q = q.eq('cliente_id', cliente_id);
  if (status)     q = q.eq('status', status);
  const { data, error } = await q;
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// GET /api/vendas/:id
router.get('/:id', authMiddleware, async (req, res) => {
  const { data, error } = await supabase.from('vendas')
    .select('*, clientes(*), usuarios(nome), venda_itens(*, produtos(nome, codigo, unidade))')
    .eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: 'Venda não encontrada' });
  res.json(data);
});

// PUT /api/vendas/:id/cancelar
router.put('/:id/cancelar', authMiddleware, adminOnly, auditLog('CANCELAR_VENDA', 'VENDAS'), async (req, res) => {
  const { data: venda } = await supabase.from('vendas').select('*, venda_itens(*)').eq('id', req.params.id).single();
  if (!venda) return res.status(404).json({ error: 'Venda não encontrada' });
  if (venda.status === 'CANCELADA') return res.status(400).json({ error: 'Venda já cancelada' });

  for (const item of venda.venda_itens) {
    const { data: p } = await supabase.from('produtos').select('estoque_atual').eq('id', item.produto_id).single();
    if (p) await supabase.from('produtos').update({ estoque_atual: parseFloat(p.estoque_atual) + parseFloat(item.quantidade) }).eq('id', item.produto_id);
  }

  if (venda.forma_pagamento === 'CREDIARIO' && venda.cliente_id) {
    const { data: c } = await supabase.from('clientes').select('saldo_devedor').eq('id', venda.cliente_id).single();
    if (c) {
      const sa = parseFloat(c.saldo_devedor), su = Math.max(0, sa - parseFloat(venda.total));
      await supabase.from('movimentacoes_financeiras').insert([{
        cliente_id: venda.cliente_id, tipo: 'AJUSTE',
        descricao: `Cancelamento Venda #${venda.numero_venda}`,
        valor: -venda.total, saldo_anterior: sa, saldo_atual: su, usuario_id: req.user.id
      }]);
      await supabase.from('clientes').update({ saldo_devedor: su }).eq('id', venda.cliente_id);
    }
  }

  await supabase.from('vendas').update({ status: 'CANCELADA' }).eq('id', req.params.id);
  res.json({ success: true });
});

module.exports = router;
