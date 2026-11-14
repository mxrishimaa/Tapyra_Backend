'use strict';

const { Usuario } = require('../models');
const { normalizarTelefone } = require('../utils/telefone');
const { usuarioPublico } = require('../utils/usuarioPublico');

// PATCH /usuarios/me/whatsapp  { aceita: true|false, telefone? }
// Registra (ou revoga) o consentimento para receber alertas por WhatsApp.
exports.consentimentoWhatsapp = async (req, res) => {
  const { aceita, telefone } = req.body ?? {};

  if (typeof aceita !== 'boolean') {
    return res.status(400).json({ erro: 'Informe aceita: true ou false.' });
  }

  const usuario = await Usuario.findByPk(req.usuario.id);
  if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });

  if (!aceita) {
    await usuario.update({ whatsapp_opt_in: false, whatsapp_opt_in_em: null });
    return res.json({ usuario: usuarioPublico(usuario) });
  }

  let telefoneFinal = usuario.telefone;
  if (telefone) {
    telefoneFinal = normalizarTelefone(telefone);
    if (!telefoneFinal) {
      return res.status(400).json({ erro: 'Telefone inválido. Use DDD + número, ex.: (85) 98211-3303.' });
    }
  }
  if (!telefoneFinal) {
    return res.status(400).json({ erro: 'Informe o telefone para receber alertas por WhatsApp.' });
  }

  // se já tinha aceitado com o mesmo número, mantém a data original do consentimento
  const jaConsentido = usuario.whatsapp_opt_in && usuario.telefone === telefoneFinal;
  await usuario.update({
    telefone: telefoneFinal,
    whatsapp_opt_in: true,
    whatsapp_opt_in_em: jaConsentido ? usuario.whatsapp_opt_in_em : new Date(),
  });

  res.json({ usuario: usuarioPublico(usuario) });
};
