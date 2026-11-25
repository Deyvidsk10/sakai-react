// Middlewares de autenticação JWT e de autorização por perfil - [Deyvidsk10]
const jwt = require('jsonwebtoken');
const { buscarUsuarioPorId } = require('../models/usuarioModel');

// Verifica o token enviado no header "Authorization: Bearer <token>" - [Deyvidsk10]
function autenticarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
        return res.status(401).json({ message: 'Token não fornecido' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
        if (err) {
            // 401 faz o frontend redirecionar para o login quando o token expira - [Deyvidsk10]
            return res.status(401).json({ message: 'Token inválido ou expirado' });
        }
        req.usuario = payload; // { id, nome, email, perfil }
        next();
    });
}

// Libera a rota apenas para os perfis informados (ex.: somente 'admin').
// O perfil é lido do banco (e não do token), então quando o admin troca o perfil
// de alguém a mudança vale na hora, sem precisar fazer login de novo - [Deyvidsk10]
function autorizarPerfis(...perfis) {
    return async (req, res, next) => {
        try {
            const usuario = req.usuario ? await buscarUsuarioPorId(req.usuario.id) : null;
            if (!usuario) {
                return res.status(401).json({ message: 'Usuário não encontrado. Faça login novamente.' });
            }
            req.usuario = { ...req.usuario, perfil: usuario.perfil };
            if (!perfis.includes(usuario.perfil)) {
                return res.status(403).json({ message: 'Você não tem permissão para esta ação' });
            }
            next();
        } catch (err) {
            next(err);
        }
    };
}

// Atalho para as rotas da operação da pizzaria (clientes do perfil "cliente" não entram) - [Deyvidsk10]
const somenteEquipe = autorizarPerfis('admin', 'atendente');

module.exports = { autenticarToken, autorizarPerfis, somenteEquipe };
