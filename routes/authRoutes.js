'use strict';

const router = require('express').Router();
const { autenticar } = require('../middlewares/auth');
const ctrl = require('../controllers/authController');

/**
 * @swagger
 * /auth/cadastro:
 *   post:
 *     summary: Cadastra um novo usuário (função "morador")
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nome, email, senha]
 *             properties:
 *               nome: { type: string, example: Maria Souza }
 *               email: { type: string, example: maria@email.com }
 *               senha: { type: string, example: minhasenha123 }
 *               telefone: { type: string, example: "(92) 99999-0000" }
 *               aceitaWhatsapp: { type: boolean, example: true }
 *     responses:
 *       201: { description: Usuário criado; devolve token e dados públicos }
 *       400: { description: Dados inválidos }
 *       409: { description: E-mail já cadastrado }
 */
router.post('/cadastro', ctrl.cadastro);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Faz login e devolve o token JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, senha]
 *             properties:
 *               email: { type: string }
 *               senha: { type: string }
 *     responses:
 *       200: { description: Login realizado }
 *       401: { description: E-mail ou senha inválidos }
 */
router.post('/login', ctrl.login);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Dados do usuário logado
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Dados do usuário }
 *       401: { description: Token ausente, inválido ou expirado }
 */
router.get('/me', autenticar, ctrl.me);

module.exports = router;
