// Rotas do CRUD de Usuários (somente administradores) - [Deyvidsk10]
const express = require('express');
const controller = require('../controllers/usuarioController');
const { autenticarToken, autorizarPerfis } = require('../middleware/auth');
const { asyncHandler } = require('../utils/http');

const router = express.Router();

// Todas as rotas abaixo exigem token válido E perfil admin - [Deyvidsk10]
router.use(autenticarToken, autorizarPerfis('admin'));

/**
 * @swagger
 * tags:
 *   - name: Usuários
 *     description: Gerenciamento de usuários do sistema (apenas perfil admin)
 */

/**
 * @swagger
 * /usuarios:
 *   get:
 *     summary: Lista todos os usuários
 *     tags: [Usuários]
 *     responses:
 *       200:
 *         description: Lista de usuários
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 usuarios:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Usuario' }
 *       401: { description: Não autenticado }
 *       403: { description: Sem permissão (não é admin) }
 *   post:
 *     summary: Cria um usuário
 *     tags: [Usuários]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UsuarioInput' }
 *     responses:
 *       201: { description: Usuário criado com sucesso }
 *       400: { description: Dados inválidos }
 *       409: { description: E-mail já cadastrado }
 */
router.get('/', asyncHandler(controller.listar));
router.post('/', asyncHandler(controller.criar));

/**
 * @swagger
 * /usuarios/{id}:
 *   parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       schema: { type: integer }
 *       description: ID do usuário
 *   get:
 *     summary: Busca um usuário pelo ID
 *     tags: [Usuários]
 *     responses:
 *       200:
 *         description: Usuário encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 usuario: { $ref: '#/components/schemas/Usuario' }
 *       404: { description: Usuário não encontrado }
 *   put:
 *     summary: Atualiza um usuário (senha opcional)
 *     tags: [Usuários]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UsuarioInput' }
 *     responses:
 *       200: { description: Usuário atualizado com sucesso }
 *       400: { description: Dados inválidos }
 *       404: { description: Usuário não encontrado }
 *       409: { description: E-mail já cadastrado }
 *   delete:
 *     summary: Exclui um usuário
 *     tags: [Usuários]
 *     responses:
 *       200: { description: Usuário excluído com sucesso }
 *       400: { description: Tentativa de excluir o próprio usuário }
 *       404: { description: Usuário não encontrado }
 */
router.get('/:id', asyncHandler(controller.buscar));
router.put('/:id', asyncHandler(controller.atualizar));
router.delete('/:id', asyncHandler(controller.excluir));

module.exports = router;
