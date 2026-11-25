// Rotas de autenticação (públicas: login e cadastro; privada: /me) - [Deyvidsk10]
const express = require('express');
const controller = require('../controllers/authController');
const { autenticarToken } = require('../middleware/auth');
const { asyncHandler } = require('../utils/http');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Login, cadastro e dados do usuário logado
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Realiza o login e devolve o token JWT
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, senha]
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@pizzaria.com
 *               senha:
 *                 type: string
 *                 example: admin123
 *     responses:
 *       200:
 *         description: Login bem-sucedido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Login realizado com sucesso }
 *                 token: { type: string, example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... }
 *                 usuario: { $ref: '#/components/schemas/Usuario' }
 *       400:
 *         description: Campos obrigatórios ausentes
 *       401:
 *         description: E-mail ou senha inválidos
 */
router.post('/login', asyncHandler(controller.login));

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Cadastra um novo usuário com perfil "cliente" (o admin pode promover depois)
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nome, email, senha]
 *             properties:
 *               nome: { type: string, example: Maria Souza }
 *               email: { type: string, example: maria@pizzaria.com }
 *               senha: { type: string, example: '123456' }
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       409:
 *         description: E-mail já cadastrado
 */
router.post('/register', asyncHandler(controller.registrar));

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Retorna os dados do usuário dono do token
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Usuário logado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 usuario: { $ref: '#/components/schemas/Usuario' }
 *       401:
 *         description: Token ausente, inválido ou expirado
 */
router.get('/me', autenticarToken, asyncHandler(controller.me));

module.exports = router;
