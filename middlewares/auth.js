'use strict';

const jwt = require('jsonwebtoken');

// Exige um token JWT válido no cabeçalho: Authorization: Bearer <token>
function autenticar(req, res, next) {
  const cabecalho = req.headers.authorization || '';
  const token = cabecalho.startsWith('Bearer ') ? cabecalho.slice(7) : null;

  if (!token) return res.status(401).json({ erro: 'Token ausente.' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = { id: Number(payload.sub), funcao: payload.funcao };
    next();
  } catch {
    return res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
}

// Restringe a rota a certas funções. Ex.: router.post('/x', autenticar, exigirFuncao('admin'), ...)
function exigirFuncao(...funcoes) {
  return (req, res, next) => {
    if (!req.usuario || !funcoes.includes(req.usuario.funcao)) {
      return res.status(403).json({ erro: 'Sem permissão para esta ação.' });
    }
    next();
  };
}

module.exports = { autenticar, exigirFuncao };
