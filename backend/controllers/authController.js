// Controller de autenticação: login, cadastro e dados do usuário logado - [Deyvidsk10]
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { buscarUsuarioPorEmail, buscarUsuarioPorId, criarUsuario } = require('../models/usuarioModel');
const { HttpError, texto } = require('../utils/http');

// Gera o token JWT com os dados básicos do usuário - [Deyvidsk10]
function gerarToken(usuario) {
    return jwt.sign({ id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
}

// POST /auth/login - [Deyvidsk10]
async function login(req, res) {
    const email = texto(req.body.email)?.toLowerCase();
    const senha = req.body.senha;

    if (!email || !senha) {
        throw new HttpError(400, 'Informe e-mail e senha');
    }

    const usuario = await buscarUsuarioPorEmail(email);
    // Mesma mensagem para e-mail ou senha errados, para não revelar quais e-mails existem - [Deyvidsk10]
    const senhaValida = usuario ? await bcrypt.compare(senha, usuario.senha) : false;
    if (!senhaValida) {
        throw new HttpError(401, 'E-mail ou senha inválidos');
    }

    const { senha: _ignorar, ...usuarioPublico } = usuario;
    res.json({ message: 'Login realizado com sucesso', token: gerarToken(usuario), usuario: usuarioPublico });
}

// POST /auth/register - cadastro público sempre cria perfil "cliente";
// o admin promove para atendente pela tela de Usuários quando precisar - [Deyvidsk10]
async function registrar(req, res) {
    const nome = texto(req.body.nome);
    const email = texto(req.body.email)?.toLowerCase();
    const senha = req.body.senha;

    if (!nome || !email || !senha) {
        throw new HttpError(400, 'Nome, e-mail e senha são obrigatórios');
    }
    if (String(senha).length < 6) {
        throw new HttpError(400, 'A senha deve ter pelo menos 6 caracteres');
    }
    if (await buscarUsuarioPorEmail(email)) {
        throw new HttpError(409, 'Já existe um usuário com este e-mail');
    }

    const usuario = await criarUsuario({ nome, email, senha, perfil: 'cliente' });
    res.status(201).json({ message: 'Usuário criado com sucesso', usuario });
}

// GET /auth/me - devolve o usuário dono do token - [Deyvidsk10]
async function me(req, res) {
    const usuario = await buscarUsuarioPorId(req.usuario.id);
    if (!usuario) {
        throw new HttpError(404, 'Usuário não encontrado');
    }
    res.json({ usuario });
}

module.exports = { login, registrar, me };
