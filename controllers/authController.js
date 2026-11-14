'use strict';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');
const { normalizarTelefone } = require('../utils/telefone');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Hash descartável: faz o login gastar o mesmo tempo quando o e-mail não existe.
const HASH_FALSO = bcrypt.hashSync('senha-falsa-para-igualar-o-tempo', 10);

function gerarToken(usuario) {
  return jwt.sign({ funcao: usuario.funcao }, process.env.JWT_SECRET, {
    subject: String(usuario.id),
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
}

// Só estes campos saem para o cliente. A senha nunca.
function publico(u) {
  return {
    id: u.id,
    nome: u.nome,
    email: u.email,
    telefone: u.telefone,
    funcao: u.funcao,
    whatsapp_opt_in: u.whatsapp_opt_in,
    whatsapp_opt_in_em: u.whatsapp_opt_in_em,
    criado_em: u.criado_em,
  };
}

exports.cadastro = async (req, res) => {
  const { nome, email, senha, telefone, aceitaWhatsapp } = req.body ?? {};

  const nomeLimpo = String(nome ?? '').trim();
  const emailLimpo = String(email ?? '').trim().toLowerCase();

  if (nomeLimpo.length < 2 || nomeLimpo.length > 255) {
    return res.status(400).json({ erro: 'Informe o nome (mínimo 2 caracteres).' });
  }
  if (!EMAIL_RE.test(emailLimpo) || emailLimpo.length > 150) {
    return res.status(400).json({ erro: 'E-mail inválido.' });
  }
  // o bcrypt só considera os primeiros 72 bytes da senha
  if (typeof senha !== 'string' || senha.length < 8 || Buffer.byteLength(senha) > 72) {
    return res.status(400).json({ erro: 'A senha deve ter entre 8 e 72 caracteres.' });
  }

  let telefoneNormalizado = null;
  if (telefone) {
    telefoneNormalizado = normalizarTelefone(telefone);
    if (!telefoneNormalizado) {
      return res.status(400).json({ erro: 'Telefone inválido. Use DDD + número, ex.: (85) 98211-3303.' });
    }
  }

  // consentimento explícito: só vale se o usuário marcou (true) e informou o telefone
  const aceita = aceitaWhatsapp === true;
  if (aceita && !telefoneNormalizado) {
    return res.status(400).json({ erro: 'Para receber alertas por WhatsApp, informe o telefone.' });
  }

  if (await Usuario.findOne({ where: { email: emailLimpo } })) {
    return res.status(409).json({ erro: 'Este e-mail já está cadastrado.' });
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  let usuario;
  try {
    usuario = await Usuario.create({
      nome: nomeLimpo,
      email: emailLimpo,
      senha: senhaHash,
      telefone: telefoneNormalizado,
      funcao: 'morador', // nunca vem do cliente: quem vira admin é decidido por você, no banco
      whatsapp_opt_in: aceita,
      whatsapp_opt_in_em: aceita ? new Date() : null,
    });
  } catch (e) {
    if (e.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ erro: 'Este e-mail já está cadastrado.' });
    }
    throw e;
  }

  res.status(201).json({ token: gerarToken(usuario), usuario: publico(usuario) });
};

exports.login = async (req, res) => {
  const { email, senha } = req.body ?? {};
  const emailLimpo = String(email ?? '').trim().toLowerCase();

  if (!emailLimpo || typeof senha !== 'string' || !senha) {
    return res.status(400).json({ erro: 'Informe e-mail e senha.' });
  }

  const usuario = await Usuario.scope('comSenha').findOne({ where: { email: emailLimpo } });
  const senhaConfere = await bcrypt.compare(senha, usuario ? usuario.senha : HASH_FALSO);

  // mesma mensagem nos dois casos, para não revelar quais e-mails existem
  if (!usuario || !senhaConfere) {
    return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
  }

  res.json({ token: gerarToken(usuario), usuario: publico(usuario) });
};

exports.me = async (req, res) => {
  const usuario = await Usuario.findByPk(req.usuario.id);
  if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });
  res.json({ usuario: publico(usuario) });
};
