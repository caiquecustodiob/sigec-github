/**
 * SIGEC - Rota: Clientes
 */
const express = require('express');
const router = express.Router();
const supabase = require('../services/supabase');
const { authMiddleware, auditLog } = require('../middleware/auth');

router.get('/', authMiddleware, async (req, res) => {
  const { search } = req.query;
  let q = supabase.from('clientes').select('*').eq('status', true).order('nome');
  if (search) q = q.or(`nome.ilike.%${search}%,cpf_cnpj.ilike.%${search}%,telefone.ilike.%${search}%`);
  const { data, error } = await q;
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.get('/:id', authMiddleware, async (req, res) => {
  const { data, error } = await supabase.from('clientes').select('*').eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: 'Cliente não encontrado' });
  res.json(data);
});

router.get('/:id/historico', authMiddleware, async (req, res) => {
  const { data, error } = await supabase.from('movimentacoes_financeiras')
    .select('*, usuarios(nome)').eq('cliente_id', req.params.id)
    .order('data', { ascending: false }).limit(100);
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.post('/', authMiddleware, auditLog('CRIAR_CLIENTE', 'CLIENTES'), async (req, res) => {
  if (!req.body.nome) return res.status(400).json({ error: 'Nome é obrigatório' });
  const { data, error } = await supabase.from('clientes').insert([req.body]).select();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data[0]);
});

router.put('/:id', authMiddleware, auditLog('EDITAR_CLIENTE', 'CLIENTES'), async (req, res) => {
  const { data, error } = await supabase.from('clientes').update(req.body).eq('id', req.params.id).select();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data[0]);
});

module.exports = router;
