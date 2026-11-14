'use strict';

const { Regiao, UsuarioRegiao } = require('../models');

const NIVEIS = ['atencao', 'alerta', 'critico'];

// DECIMAL chega do MySQL como texto; aqui viram número para o front.
function formatarRegiao(r) {
  return {
    id: r.id,
    estado: r.estado,
    codigo_estado: r.codigo_estado,
    nome_regiao: r.nome_regiao,
    latitude: r.latitude === null ? null : Number(r.latitude),
    longitude: r.longitude === null ? null : Number(r.longitude),
    raio_km: r.raio_km,
  };
}

function formatarInscricao(i) {
  return {
    regiao_id: i.regiao_id,
    nivel_minimo: i.nivel_minimo,
    ativo: i.ativo,
    regiao: i.regiao ? formatarRegiao(i.regiao) : undefined,
  };
}

function lerRegiaoId(valor) {
  const n = Number(valor);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// GET /regioes (pública): catálogo de regiões que o usuário pode escolher
exports.listar = async (req, res) => {
  const regioes = await Regiao.findAll({ order: [['estado', 'ASC'], ['nome_regiao', 'ASC']] });
  res.json({ regioes: regioes.map(formatarRegiao) });
};

// GET /regioes/minhas: inscrições do usuário logado
exports.minhas = async (req, res) => {
  const inscricoes = await UsuarioRegiao.findAll({
    where: { usuario_id: req.usuario.id },
    include: [{ model: Regiao, as: 'regiao' }],
    order: [['id', 'ASC']],
  });
  res.json({ inscricoes: inscricoes.map(formatarInscricao) });
};

// POST /regioes/inscricao  { regiaoId, nivelMinimo? }
exports.inscrever = async (req, res) => {
  const { regiaoId, nivelMinimo = 'atencao' } = req.body ?? {};

  const id = lerRegiaoId(regiaoId);
  if (!id) return res.status(400).json({ erro: 'Informe regiaoId (número inteiro).' });
  if (!NIVEIS.includes(nivelMinimo)) {
    return res.status(400).json({ erro: `nivelMinimo deve ser um destes: ${NIVEIS.join(', ')}.` });
  }

  const regiao = await Regiao.findByPk(id);
  if (!regiao) return res.status(404).json({ erro: 'Região não encontrada.' });

  const existente = await UsuarioRegiao.findOne({ where: { usuario_id: req.usuario.id, regiao_id: id } });
  if (existente) {
    return res.status(409).json({ erro: 'Você já acompanha esta região. Use PATCH para alterar.' });
  }

  const inscricao = await UsuarioRegiao.create({
    usuario_id: req.usuario.id,
    regiao_id: id,
    nivel_minimo: nivelMinimo,
    ativo: true,
  });
  inscricao.regiao = regiao;
  res.status(201).json({ inscricao: formatarInscricao(inscricao) });
};

// PATCH /regioes/inscricao/:regiaoId  { nivelMinimo?, ativo? }
exports.atualizar = async (req, res) => {
  const id = lerRegiaoId(req.params.regiaoId);
  if (!id) return res.status(400).json({ erro: 'regiaoId inválido.' });

  const { nivelMinimo, ativo } = req.body ?? {};
  const mudancas = {};

  if (nivelMinimo !== undefined) {
    if (!NIVEIS.includes(nivelMinimo)) {
      return res.status(400).json({ erro: `nivelMinimo deve ser um destes: ${NIVEIS.join(', ')}.` });
    }
    mudancas.nivel_minimo = nivelMinimo;
  }
  if (ativo !== undefined) {
    if (typeof ativo !== 'boolean') return res.status(400).json({ erro: 'ativo deve ser true ou false.' });
    mudancas.ativo = ativo;
  }
  if (Object.keys(mudancas).length === 0) {
    return res.status(400).json({ erro: 'Envie nivelMinimo e/ou ativo.' });
  }

  // o filtro por usuario_id garante que ninguém mexe na inscrição de outra pessoa
  const inscricao = await UsuarioRegiao.findOne({ where: { usuario_id: req.usuario.id, regiao_id: id } });
  if (!inscricao) return res.status(404).json({ erro: 'Você não acompanha esta região.' });

  await inscricao.update(mudancas);
  res.json({ inscricao: formatarInscricao(inscricao) });
};

// DELETE /regioes/inscricao/:regiaoId
exports.remover = async (req, res) => {
  const id = lerRegiaoId(req.params.regiaoId);
  if (!id) return res.status(400).json({ erro: 'regiaoId inválido.' });

  const apagadas = await UsuarioRegiao.destroy({ where: { usuario_id: req.usuario.id, regiao_id: id } });
  if (!apagadas) return res.status(404).json({ erro: 'Você não acompanha esta região.' });

  res.status(204).end();
};
