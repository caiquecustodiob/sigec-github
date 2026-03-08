/**
 * SIGEC - Rotas: Produtos
 */
const express = require('express');
const router = express.Router();
const supabase = require('../services/supabase');
const { authMiddleware, adminOnly, auditLog } = require('../middleware/auth');

// GET /api/produtos?search=&categoria_id=
router.get('/', authMiddleware, async (req, res) => {
  const { search, categoria_id, status } = req.query;
  let query = supabase.from('produtos').select('*, categorias(nome)')
    .eq('status', status !== 'false');
  if (search) query = query.or(`nome.ilike.%${search}%,codigo.ilike.%${search}%,codigo_barras.ilike.%${search}%`);
  if (categoria_id) query = query.eq('categoria_id', categoria_id);
  const { data, error } = await query.order('nome');
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// GET /api/produtos/buscar?q= (PDV)
router.get('/buscar', authMiddleware, async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);
  const { data, error } = await supabase.from('produtos').select('*, categorias(nome)')
    .eq('status', true)
    .or(`nome.ilike.%${q}%,codigo.ilike.%${q}%,codigo_barras.eq.${q}`)
    .limit(20);
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// POST /api/produtos
router.post('/', authMiddleware, adminOnly, auditLog('CRIAR_PRODUTO', 'PRODUTOS'), async (req, res) => {
  const { codigo, nome, categoria_id, preco_custo, preco_venda, estoque_atual, estoque_minimo, codigo_barras, unidade, observacoes } = req.body;
  if (!codigo || !nome || !preco_venda) return res.status(400).json({ error: 'Código, nome e preço são obrigatórios' });
  const { data, error } = await supabase.from('produtos').insert([req.body]).select();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data[0]);
});

// PUT /api/produtos/:id
router.put('/:id', authMiddleware, adminOnly, auditLog('EDITAR_PRODUTO', 'PRODUTOS'), async (req, res) => {
  const { data, error } = await supabase.from('produtos').update(req.body).eq('id', req.params.id).select();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data[0]);
});

// DELETE /api/produtos/:id (soft delete)
router.delete('/:id', authMiddleware, adminOnly, auditLog('EXCLUIR_PRODUTO', 'PRODUTOS'), async (req, res) => {
  const { error } = await supabase.from('produtos').update({ status: false }).eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;
