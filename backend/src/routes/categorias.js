/**
 * SIGEC - Rota: Categorias
 */
const express = require('express');
const router = express.Router();
const supabase = require('../services/supabase');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.get('/',    authMiddleware, async (req, res) => {
  const { data } = await supabase.from('categorias').select('*').eq('status', true).order('nome');
  res.json(data || []);
});
router.post('/',   authMiddleware, adminOnly, async (req, res) => {
  const { data, error } = await supabase.from('categorias').insert([req.body]).select();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data[0]);
});
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  const { data, error } = await supabase.from('categorias').update(req.body).eq('id', req.params.id).select();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data[0]);
});

module.exports = router;
