// Controller de Usuários: regras de negócio do CRUD de usuários - [Deyvidsk10]
const model = require('../models/usuarioModel');
const { HttpError, lerId, texto } = require('../utils/http');

const PERFIS = ['admin', 'atendente', 'cliente'];

// Valida o corpo da requisição; a senha só é obrigatória na criação - [Deyvidsk10]
function validar(body, { criando }) {
    const dados = {
        nome: texto(body.nome),
        email: texto(body.email)?.toLowerCase(),
        senha: body.senha ? String(body.senha) : null,
        perfil: texto(body.perfil) || 'cliente'
    };

    if (!dados.nome) throw new HttpError(400, 'O nome é obrigatório');
    if (!dados.email || !/^\S+@\S+\.\S+$/.test(dados.email)) throw new HttpError(400, 'Informe um e-mail válido');
    if (criando && !dados.senha) throw new HttpError(400, 'A senha é obrigatória');
    if (dados.senha && dados.senha.length < 6) throw new HttpError(400, 'A senha deve ter pelo menos 6 caracteres');
    if (!PERFIS.includes(dados.perfil)) throw new HttpError(400, 'Perfil inválido (use admin, atendente ou cliente)');

    return dados;
}

async function listar(req, res) {
    res.json({ usuarios: await model.listarUsuarios() });
}

async function buscar(req, res) {
    const usuario = await model.buscarUsuarioPorId(lerId(req));
    if (!usuario) throw new HttpError(404, 'Usuário não encontrado');
    res.json({ usuario });
}

async function criar(req, res) {
    const dados = validar(req.body, { criando: true });
    if (await model.buscarUsuarioPorEmail(dados.email)) {
        throw new HttpError(409, 'Já existe um usuário com este e-mail');
    }
    const usuario = await model.criarUsuario(dados);
    res.status(201).json({ message: 'Usuário criado com sucesso', usuario });
}

async function atualizar(req, res) {
    const id = lerId(req);
    const atual = await model.buscarUsuarioPorId(id);
    if (!atual) throw new HttpError(404, 'Usuário não encontrado');

    const dados = validar(req.body, { criando: false });

    const outro = await model.buscarUsuarioPorEmail(dados.email);
    if (outro && outro.id !== id) {
        throw new HttpError(409, 'Já existe um usuário com este e-mail');
    }
    // Impede que o sistema fique sem nenhum administrador - [Deyvidsk10]
    if (atual.perfil === 'admin' && dados.perfil !== 'admin' && (await model.contarAdmins()) <= 1) {
        throw new HttpError(400, 'Não é possível remover o último administrador');
    }

    const usuario = await model.atualizarUsuario(id, dados);
    res.json({ message: 'Usuário atualizado com sucesso', usuario });
}

async function excluir(req, res) {
    const id = lerId(req);
    // O usuário logado não pode excluir a própria conta - [Deyvidsk10]
    if (id === req.usuario.id) {
        throw new HttpError(400, 'Você não pode excluir o seu próprio usuário');
    }
    const excluido = await model.excluirUsuario(id);
    if (!excluido) throw new HttpError(404, 'Usuário não encontrado');
    res.json({ message: 'Usuário excluído com sucesso' });
}

module.exports = { listar, buscar, criar, atualizar, excluir };
