// Rotas das Categorias de produtos (protegidas por JWT) - [Deyvidsk10]
const express = require('express');
const controller = require('../controllers/categoriaController');
const { autenticarToken, somenteEquipe } = require('../middleware/auth');
const { asyncHandler } = require('../utils/http');

const router = express.Router();

// Qualquer usuário logado pode consultar; criar/alterar/excluir é só para admin e atendente - [Deyvidsk10]
router.use(autenticarToken);

/**
 * @swagger
 * tags:
 *   - name: Categorias
 *     description: Categorias dos produtos (Pizza, Bebida, Sobremesa e outras criadas pelo usuário)
 */

/**
 * @swagger
 * /categorias:
 *   get:
 *     summary: Lista as categorias com a quantidade de produtos de cada uma
 *     tags: [Categorias]
 *     responses:
 *       200:
 *         description: Lista de categorias
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categorias:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Categoria' }
 *       401: { description: Não autenticado }
 *   post:
 *     summary: Cria uma categoria
 *     tags: [Categorias]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CategoriaInput' }
 *     responses:
 *       201: { description: Categoria criada com sucesso }
 *       400: { description: Nome inválido }
 *       409: { description: Categoria já existe }
 */
router.get('/', asyncHandler(controller.listar));
router.post('/', somenteEquipe, asyncHandler(controller.criar));

/**
 * @swagger
 * /categorias/{id}:
 *   parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       schema: { type: integer }
 *       description: ID da categoria
 *   put:
 *     summary: Renomeia a categoria (os produtos dela são atualizados juntos)
 *     tags: [Categorias]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CategoriaInput' }
 *     responses:
 *       200: { description: Categoria atualizada com sucesso }
 *       404: { description: Categoria não encontrada }
 *       409: { description: Já existe uma categoria com esse nome }
 *   delete:
 *     summary: Exclui a categoria (bloqueado se houver produtos nela)
 *     tags: [Categorias]
 *     responses:
 *       200: { description: Categoria excluída com sucesso }
 *       404: { description: Categoria não encontrada }
 *       409: { description: Existem produtos na categoria }
 */
router.put('/:id', somenteEquipe, asyncHandler(controller.atualizar));
router.delete('/:id', somenteEquipe, asyncHandler(controller.excluir));

module.exports = router;
