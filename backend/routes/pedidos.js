// Rotas do CRUD de Pedidos e do resumo do dashboard (protegidas por JWT) - [Deyvidsk10]
const express = require('express');
const controller = require('../controllers/pedidoController');
const { autenticarToken } = require('../middleware/auth');
const { asyncHandler } = require('../utils/http');

const router = express.Router();

router.use(autenticarToken);

/**
 * @swagger
 * tags:
 *   - name: Pedidos
 *     description: Pedidos com cliente, itens, status, valor total e data/hora
 */

/**
 * @swagger
 * /pedidos/resumo:
 *   get:
 *     summary: Números para o dashboard (totais, faturamento e últimos pedidos)
 *     tags: [Pedidos]
 *     responses:
 *       200:
 *         description: Resumo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalClientes: { type: integer, example: 10 }
 *                 totalProdutos: { type: integer, example: 25 }
 *                 totalPedidos: { type: integer, example: 42 }
 *                 faturamento: { type: number, example: 3250.5 }
 *                 pedidosPorStatus:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       status: { type: string }
 *                       total: { type: integer }
 *                 ultimosPedidos:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Pedido' }
 */
// Precisa vir antes de "/:id" para não ser confundida com um ID - [Deyvidsk10]
router.get('/resumo', asyncHandler(controller.resumo));

/**
 * @swagger
 * /pedidos:
 *   get:
 *     summary: Lista os pedidos (mais recentes primeiro) com seus itens
 *     tags: [Pedidos]
 *     parameters:
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum: [Recebido, Em preparo, Saiu para entrega, Entregue, Cancelado]
 *         description: Filtra pelo status
 *     responses:
 *       200:
 *         description: Lista de pedidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pedidos:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Pedido' }
 *       401: { description: Não autenticado }
 *   post:
 *     summary: Cria um pedido (o valor total é calculado pela API)
 *     tags: [Pedidos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/PedidoInput' }
 *     responses:
 *       201:
 *         description: Pedido criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 pedido: { $ref: '#/components/schemas/Pedido' }
 *       400: { description: Dados inválidos }
 */
router.get('/', asyncHandler(controller.listar));
router.post('/', asyncHandler(controller.criar));

/**
 * @swagger
 * /pedidos/{id}:
 *   parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       schema: { type: integer }
 *       description: ID do pedido
 *   get:
 *     summary: Busca um pedido pelo ID
 *     tags: [Pedidos]
 *     responses:
 *       200:
 *         description: Pedido encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pedido: { $ref: '#/components/schemas/Pedido' }
 *       404: { description: Pedido não encontrado }
 *   put:
 *     summary: Atualiza um pedido (substitui todos os itens)
 *     tags: [Pedidos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/PedidoInput' }
 *     responses:
 *       200: { description: Pedido atualizado com sucesso }
 *       400: { description: Dados inválidos }
 *       404: { description: Pedido não encontrado }
 *   delete:
 *     summary: Exclui um pedido e seus itens
 *     tags: [Pedidos]
 *     responses:
 *       200: { description: Pedido excluído com sucesso }
 *       404: { description: Pedido não encontrado }
 */
router.get('/:id', asyncHandler(controller.buscar));
router.put('/:id', asyncHandler(controller.atualizar));
router.delete('/:id', asyncHandler(controller.excluir));

/**
 * @swagger
 * /pedidos/{id}/status:
 *   patch:
 *     summary: Altera apenas o status do pedido
 *     tags: [Pedidos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Recebido, Em preparo, Saiu para entrega, Entregue, Cancelado]
 *                 example: Em preparo
 *     responses:
 *       200: { description: Status atualizado com sucesso }
 *       400: { description: Status inválido }
 *       404: { description: Pedido não encontrado }
 */
router.patch('/:id/status', asyncHandler(controller.atualizarStatus));

module.exports = router;
