/**
 * SIGEC - Rotas: Dashboard
 */
const express = require('express');
const router = express.Router();
const supabase = require('../services/supabase');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, async (req, res) => {
  const hoje = new Date().toISOString().split('T')[0];
  const [v1, v2, v3] = await Promise.all([
    supabase.from('vendas').select('total, forma_pagamento').eq('status', 'CONCLUIDA').gte('data', hoje),
    supabase.from('produtos').select('id, codigo, nome, estoque_atual, estoque_minimo').filter('estoque_atual', 'lte', 'estoque_minimo').eq('status', true).limit(10),
    supabase.from('clientes').select('id, nome, saldo_devedor').gt('saldo_devedor', 0).order('saldo_devedor', { ascending: false }).limit(10)
  ]);
  const tv = v1.data?.reduce((s, x) => s + parseFloat(x.total), 0) || 0;
  const td = v3.data?.reduce((s, x) => s + parseFloat(x.saldo_devedor), 0) || 0;
  res.json({
    vendas_hoje: {
      quantidade: v1.data?.length || 0, total: tv,
      dinheiro:  v1.data?.filter(x => x.forma_pagamento === 'DINHEIRO').reduce((s,x) => s+parseFloat(x.total), 0) || 0,
      pix:       v1.data?.filter(x => x.forma_pagamento === 'PIX').reduce((s,x) => s+parseFloat(x.total), 0) || 0,
      cartao:    v1.data?.filter(x => x.forma_pagamento === 'CARTAO').reduce((s,x) => s+parseFloat(x.total), 0) || 0,
      crediario: v1.data?.filter(x => x.forma_pagamento === 'CREDIARIO').reduce((s,x) => s+parseFloat(x.total), 0) || 0,
    },
    estoque_baixo: v2.data || [],
    clientes_devedores: v3.data || [],
    total_a_receber: td
  });
});

module.exports = router;
