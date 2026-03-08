/**
 * SIGEC - Rota: Relatórios
 */
const express = require('express');
const router = express.Router();
const supabase = require('../services/supabase');
const { authMiddleware } = require('../middleware/auth');

router.get('/vendas', authMiddleware, async (req, res) => {
  const ini = req.query.data_ini || new Date().toISOString().split('T')[0];
  const fim = req.query.data_fim || ini;
  const { data: vendas } = await supabase.from('vendas')
    .select('*, clientes(nome), usuarios(nome)')
    .eq('status', 'CONCLUIDA').gte('data', ini).lte('data', fim + 'T23:59:59')
    .order('data', { ascending: false });
  const totais = {
    quantidade: vendas?.length || 0,
    total:     vendas?.reduce((s,v) => s+parseFloat(v.total), 0) || 0,
    dinheiro:  vendas?.filter(v=>v.forma_pagamento==='DINHEIRO').reduce((s,v)=>s+parseFloat(v.total),0)||0,
    pix:       vendas?.filter(v=>v.forma_pagamento==='PIX').reduce((s,v)=>s+parseFloat(v.total),0)||0,
    cartao:    vendas?.filter(v=>v.forma_pagamento==='CARTAO').reduce((s,v)=>s+parseFloat(v.total),0)||0,
    crediario: vendas?.filter(v=>v.forma_pagamento==='CREDIARIO').reduce((s,v)=>s+parseFloat(v.total),0)||0,
  };
  res.json({ vendas, totais });
});

router.get('/estoque', authMiddleware, async (req, res) => {
  const { data: produtos } = await supabase.from('produtos').select('*, categorias(nome)').eq('status', true).order('nome');
  res.json({ produtos, estoque_baixo: produtos?.filter(p => p.estoque_atual <= p.estoque_minimo) || [] });
});

router.get('/crediario', authMiddleware, async (req, res) => {
  const { data: clientes } = await supabase.from('clientes')
    .select('id, nome, cpf_cnpj, telefone, saldo_devedor, limite_credito')
    .gt('saldo_devedor', 0).eq('status', true).order('saldo_devedor', { ascending: false });
  res.json({ clientes, total_a_receber: clientes?.reduce((s,c)=>s+parseFloat(c.saldo_devedor),0)||0 });
});

router.get('/fluxo-caixa', authMiddleware, async (req, res) => {
  const ini = req.query.data_ini || new Date().toISOString().split('T')[0];
  const fim = req.query.data_fim || ini;
  const { data: vendas } = await supabase.from('vendas').select('total, forma_pagamento, data')
    .eq('status', 'CONCLUIDA').gte('data', ini).lte('data', fim + 'T23:59:59');
  const { data: pagamentos } = await supabase.from('pagamentos').select('valor, forma_pagamento, data')
    .gte('data', ini).lte('data', fim + 'T23:59:59');
  res.json({
    entradas_vendas: vendas?.filter(v => v.forma_pagamento !== 'CREDIARIO').reduce((s,v)=>s+parseFloat(v.total),0)||0,
    entradas_crediario: pagamentos?.reduce((s,p)=>s+parseFloat(p.valor),0)||0,
    total_vendas: vendas?.length || 0,
    total_pagamentos_recebidos: pagamentos?.length || 0,
  });
});

module.exports = router;
