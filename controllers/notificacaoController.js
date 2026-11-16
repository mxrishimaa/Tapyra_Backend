'use strict';

const { Usuario, Notificacao } = require('../models');
const { enviarAlertaWhatsApp } = require('../services/whatsappService');

// POST /notificacoes/whatsapp/:id -> busca telefone na tabela usuario e dispara
exports.notificarUsuario = async (req, res) => {
  const { nivel, regiao, mensagem } = req.body;

  if (!mensagem) {
    return res.status(400).json({ erro: 'O campo "mensagem" é obrigatório.' });
  }

  const usuario = await Usuario.findByPk(req.params.id, {
    attributes: ['id', 'nome', 'telefone', 'whatsapp_opt_in'],
  });

  if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });
  if (!usuario.telefone) return res.status(400).json({ erro: 'Usuário não possui telefone cadastrado.' });

  const resultado = await enviarAlertaWhatsApp({
    telefone: usuario.telefone,
    nome: usuario.nome,
    nivel: nivel || 'Atenção',
    regiao: regiao || 'Manaus e entorno',
    mensagem,
  });

  // Se o model Notificacao existir no banco, tenta registrar o histórico sem travar a resposta
  if (Notificacao) {
    try {
      await Notificacao.create({
        usuario_id: usuario.id,
        mensagem,
        nivel: nivel || 'Atenção',
        enviado_em: new Date(),
      });
    } catch (e) {
      console.warn('[Notificacao] Aviso ao salvar histórico no banco:', e.message);
    }
  }

  res.json({
    ok: true,
    destinatario: usuario.nome,
    telefone: usuario.telefone,
    ...resultado,
  });
};

// POST /notificacoes/broadcast -> dispara para todos os usuários com whatsapp_opt_in = true
exports.notificarInscritos = async (req, res) => {
  const { nivel, regiao, mensagem } = req.body;
  if (!mensagem) return res.status(400).json({ erro: 'O campo "mensagem" é obrigatório.' });

  const usuarios = await Usuario.findAll({
    where: { whatsapp_opt_in: true },
    attributes: ['id', 'nome', 'telefone'],
  });

  const comTelefone = usuarios.filter((u) => u.telefone);
  if (comTelefone.length === 0) {
    return res.status(400).json({ erro: 'Nenhum usuário com whatsapp_opt_in ativo e telefone cadastrado.' });
  }

  const resultados = await Promise.allSettled(
    comTelefone.map((u) =>
      enviarAlertaWhatsApp({
        telefone: u.telefone,
        nome: u.nome,
        nivel,
        regiao,
        mensagem,
      })
    )
  );

  const enviados = resultados.filter((r) => r.status === 'fulfilled').length;
  const falhas = resultados
    .filter((r) => r.status === 'rejected')
    .map((r) => r.reason?.message);

  res.json({ ok: true, total: comTelefone.length, enviados, falhas });
};