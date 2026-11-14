'use strict';

const router = require('express').Router();
const { autenticar } = require('../middlewares/auth');
const ctrl = require('../controllers/regiaoController');

/**
 * @swagger
 * /regioes:
 *   get:
 *     summary: Lista as regiões disponíveis (pública)
 *     tags: [Regiões]
 *     responses:
 *       200: { description: Lista de regiões }
 */
router.get('/', ctrl.listar);

/**
 * @swagger
 * /regioes/minhas:
 *   get:
 *     summary: Regiões que o usuário logado acompanha
 *     tags: [Regiões]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Lista de inscrições }
 */
router.get('/minhas', autenticar, ctrl.minhas);

/**
 * @swagger
 * /regioes/inscricao:
 *   post:
 *     summary: Passa a acompanhar uma região
 *     tags: [Regiões]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [regiaoId]
 *             properties:
 *               regiaoId: { type: integer, example: 1 }
 *               nivelMinimo: { type: string, enum: [atencao, alerta, critico], example: atencao }
 *     responses:
 *       201: { description: Inscrição criada }
 *       404: { description: Região não encontrada }
 *       409: { description: Já acompanha esta região }
 */
router.post('/inscricao', autenticar, ctrl.inscrever);

/**
 * @swagger
 * /regioes/inscricao/{regiaoId}:
 *   patch:
 *     summary: Altera o nível mínimo ou pausa/reativa a inscrição
 *     tags: [Regiões]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: regiaoId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nivelMinimo: { type: string, enum: [atencao, alerta, critico] }
 *               ativo: { type: boolean }
 *     responses:
 *       200: { description: Inscrição atualizada }
 *       404: { description: Você não acompanha esta região }
 *   delete:
 *     summary: Deixa de acompanhar a região
 *     tags: [Regiões]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: regiaoId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204: { description: Removida }
 *       404: { description: Você não acompanha esta região }
 */
router.patch('/inscricao/:regiaoId', autenticar, ctrl.atualizar);
router.delete('/inscricao/:regiaoId', autenticar, ctrl.remover);

module.exports = router;
