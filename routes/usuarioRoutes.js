'use strict';

const router = require('express').Router();
const { autenticar } = require('../middlewares/auth');
const ctrl = require('../controllers/usuarioController');

/**
 * @swagger
 * /usuarios/me/whatsapp:
 *   patch:
 *     summary: Aceita ou revoga o recebimento de alertas por WhatsApp
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [aceita]
 *             properties:
 *               aceita: { type: boolean, example: true }
 *               telefone: { type: string, example: "(85) 98211-3303" }
 *     responses:
 *       200: { description: Consentimento atualizado }
 *       400: { description: Dados inválidos }
 */
router.patch('/me/whatsapp', autenticar, ctrl.consentimentoWhatsapp);

module.exports = router;
