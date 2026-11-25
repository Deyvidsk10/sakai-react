// Middlewares de autenticação JWT e de autorização por perfil - [Deyvidsk10]
const jwt = require('jsonwebtoken');

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

// Libera a rota apenas para os perfis informados (ex.: somente 'admin') - [Deyvidsk10]
function autorizarPerfis(...perfis) {
    return (req, res, next) => {
        if (!req.usuario || !perfis.includes(req.usuario.perfil)) {
            return res.status(403).json({ message: 'Você não tem permissão para esta ação' });
        }
        next();
    };
}

module.exports = { autenticarToken, autorizarPerfis };
