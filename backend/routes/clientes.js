// Rotas do CRUD de Clientes (protegidas por JWT) - [Deyvidsk10]
const express = require('express');
const controller = require('../controllers/clienteController');
const { autenticarToken } = require('../middleware/auth');
const { asyncHandler } = require('../utils/http');

const router = express.Router();

router.use(autenticarToken);

/**
 * @swagger
 * tags:
 *   - name: Clientes
 *     description: Cadastro de clientes (endereço preenchido via ViaCEP e IBGE no frontend)
 */

/**
 * @swagger
 * /clientes:
 *   get:
 *     summary: Lista todos os clientes
 *     tags: [Clientes]
 *     responses:
 *       200:
 *         description: Lista de clientes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clientes:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Cliente' }
 *       401: { description: Não autenticado }
 *   post:
 *     summary: Cria um cliente
 *     tags: [Clientes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ClienteInput' }
 *     responses:
 *       201:
 *         description: Cliente criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 cliente: { $ref: '#/components/schemas/Cliente' }
 *       400: { description: Dados inválidos }
 */
router.get('/', asyncHandler(controller.listar));
router.post('/', asyncHandler(controller.criar));

/**
 * @swagger
 * /clientes/{id}:
 *   parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       schema: { type: integer }
 *       description: ID do cliente
 *   get:
 *     summary: Busca um cliente pelo ID
 *     tags: [Clientes]
 *     responses:
 *       200:
 *         description: Cliente encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cliente: { $ref: '#/components/schemas/Cliente' }
 *       404: { description: Cliente não encontrado }
 *   put:
 *     summary: Atualiza um cliente
 *     tags: [Clientes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ClienteInput' }
 *     responses:
 *       200: { description: Cliente atualizado com sucesso }
 *       400: { description: Dados inválidos }
 *       404: { description: Cliente não encontrado }
 *   delete:
 *     summary: Exclui um cliente (bloqueado se ele tiver pedidos)
 *     tags: [Clientes]
 *     responses:
 *       200: { description: Cliente excluído com sucesso }
 *       404: { description: Cliente não encontrado }
 *       409: { description: Cliente possui pedidos }
 */
router.get('/:id', asyncHandler(controller.buscar));
router.put('/:id', asyncHandler(controller.atualizar));
router.delete('/:id', asyncHandler(controller.excluir));

module.exports = router;
