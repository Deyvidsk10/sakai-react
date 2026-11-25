// Rotas do CRUD de Produtos (protegidas por JWT) - [Deyvidsk10]
const express = require('express');
const controller = require('../controllers/produtoController');
const { autenticarToken, somenteEquipe } = require('../middleware/auth');
const { asyncHandler } = require('../utils/http');

const router = express.Router();

// Qualquer usuário logado pode consultar; criar/alterar/excluir é só para admin e atendente - [Deyvidsk10]
router.use(autenticarToken);

/**
 * @swagger
 * tags:
 *   - name: Produtos
 *     description: Pizzas, bebidas, sobremesas e outras categorias
 */

/**
 * @swagger
 * /produtos:
 *   get:
 *     summary: Lista os produtos
 *     tags: [Produtos]
 *     parameters:
 *       - in: query
 *         name: categoria
 *         required: false
 *         schema:
 *           type: string
 *           example: Pizza
 *         description: Filtra pela categoria
 *     responses:
 *       200:
 *         description: Lista de produtos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 produtos:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Produto' }
 *       401: { description: Não autenticado }
 *   post:
 *     summary: Cria um produto
 *     tags: [Produtos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ProdutoInput' }
 *     responses:
 *       201:
 *         description: Produto criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 produto: { $ref: '#/components/schemas/Produto' }
 *       400: { description: Dados inválidos }
 */
router.get('/', asyncHandler(controller.listar));
router.post('/', somenteEquipe, asyncHandler(controller.criar));

/**
 * @swagger
 * /produtos/{id}:
 *   parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       schema: { type: integer }
 *       description: ID do produto
 *   get:
 *     summary: Busca um produto pelo ID
 *     tags: [Produtos]
 *     responses:
 *       200:
 *         description: Produto encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 produto: { $ref: '#/components/schemas/Produto' }
 *       404: { description: Produto não encontrado }
 *   put:
 *     summary: Atualiza um produto
 *     tags: [Produtos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ProdutoInput' }
 *     responses:
 *       200: { description: Produto atualizado com sucesso }
 *       400: { description: Dados inválidos }
 *       404: { description: Produto não encontrado }
 *   delete:
 *     summary: Exclui um produto (bloqueado se já foi usado em pedidos)
 *     tags: [Produtos]
 *     responses:
 *       200: { description: Produto excluído com sucesso }
 *       404: { description: Produto não encontrado }
 *       409: { description: Produto usado em pedidos }
 */
router.get('/:id', asyncHandler(controller.buscar));
router.put('/:id', somenteEquipe, asyncHandler(controller.atualizar));
router.delete('/:id', somenteEquipe, asyncHandler(controller.excluir));

module.exports = router;
