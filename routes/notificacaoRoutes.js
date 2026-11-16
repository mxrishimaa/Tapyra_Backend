'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/notificacaoController');

router.post('/whatsapp/:id', ctrl.notificarUsuario);
router.post('/broadcast', ctrl.notificarInscritos);

module.exports = router;