/**
 * SIGEC - Rotas de Licença
 */

const express = require('express');
const router = express.Router();
const supabase = require('../services/supabase');
const { authMiddleware, superAdmin } = require('../middleware/auth');

// GET /api/licenca/status — verifica licença ativa
router.get('/status', authMiddleware, async (req, res) => {
  const { data: licenca } = await supabase
    .from('licencas')
    .select('empresa, status, tipo, data_ativacao, data_expiracao')
    .in('status', ['ATIVA', 'TRIAL'])
    .limit(1)
    .single();

  if (!licenca) {
    return res.json({
      ativa: false,
      mensagem: 'Nenhuma licença ativa encontrada.',
      expirada: true
    });
  }

  const hoje = new Date();
  const expira = new Date(licenca.data_expiracao);
  const diasRestantes = Math.ceil((expira - hoje) / (1000 * 60 * 60 * 24));
  const expirada = diasRestantes <= 0;

  if (expirada) {
    await supabase.from('licencas').update({ status: 'EXPIRADA' })
      .lt('data_expiracao', new Date().toISOString())
      .in('status', ['ATIVA', 'TRIAL']);
  }

  res.json({
    ativa: !expirada,
    empresa: licenca.empresa,
    tipo: licenca.tipo,
    status: expirada ? 'EXPIRADA' : licenca.status,
    data_expiracao: licenca.data_expiracao,
    dias_restantes: Math.max(0, diasRestantes),
    aviso: diasRestantes <= 7 && !expirada
      ? `⚠️ Sua licença expira em ${diasRestantes} dia(s).`
      : null
  });
});

// POST /api/licenca/ativar — ativa uma licença
router.post('/ativar', authMiddleware, superAdmin, async (req, res) => {
  const { chave } = req.body;
  if (!chave) return res.status(400).json({ error: 'Chave de licença obrigatória' });

  const { data, error } = await supabase
    .from('licencas').select('*').eq('chave_licenca', chave).single();

  if (error || !data) return res.status(404).json({ error: 'Licença não encontrada' });
  if (new Date(data.data_expiracao) < new Date()) {
    return res.status(400).json({ error: 'Esta licença já expirou' });
  }

  await supabase.from('licencas').update({ status: 'ATIVA', data_ativacao: new Date() }).eq('id', data.id);
  res.json({ message: 'Licença ativada com sucesso!', expiracao: data.data_expiracao });
});

module.exports = router;
