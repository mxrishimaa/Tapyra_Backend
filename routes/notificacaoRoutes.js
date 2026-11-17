'use strict';

const router = require('express').Router();
const { autenticar, exigirFuncao } = require('../middlewares/auth');
const ctrl = require('../controllers/notificacaoController');

// Só usuários autenticados com função "admin" podem disparar notificações
router.post('/whatsapp/:id', autenticar, exigirFuncao('admin'), ctrl.notificarUsuario);
router.post('/broadcast', autenticar, exigirFuncao('admin'), ctrl.notificarInscritos);

module.exports = router;