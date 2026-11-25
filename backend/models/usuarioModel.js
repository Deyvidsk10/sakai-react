// Model de Usuários: acesso à tabela "usuarios" - [Deyvidsk10]
const bcrypt = require('bcryptjs');
const { run, get, all } = require('../db/database');

// Campos públicos (a senha nunca sai da API) - [Deyvidsk10]
const CAMPOS_PUBLICOS = 'id, nome, email, perfil, criado_em';

function listarUsuarios() {
    return all(`SELECT ${CAMPOS_PUBLICOS} FROM usuarios ORDER BY nome`);
}

function buscarUsuarioPorId(id) {
    return get(`SELECT ${CAMPOS_PUBLICOS} FROM usuarios WHERE id = ?`, [id]);
}

// Retorna o usuário COM o hash da senha (uso interno no login) - [Deyvidsk10]
function buscarUsuarioPorEmail(email) {
    return get('SELECT * FROM usuarios WHERE email = ?', [email]);
}

// Cria usuário gravando a senha criptografada com bcrypt - [Deyvidsk10]
async function criarUsuario({ nome, email, senha, perfil = 'atendente' }) {
    const hash = await bcrypt.hash(senha, 10);
    const { lastID } = await run('INSERT INTO usuarios (nome, email, senha, perfil) VALUES (?, ?, ?, ?)', [nome, email, hash, perfil]);
    return buscarUsuarioPorId(lastID);
}

// Atualiza dados; a senha só é trocada quando enviada - [Deyvidsk10]
async function atualizarUsuario(id, { nome, email, senha, perfil }) {
    if (senha) {
        const hash = await bcrypt.hash(senha, 10);
        await run('UPDATE usuarios SET nome = ?, email = ?, perfil = ?, senha = ? WHERE id = ?', [nome, email, perfil, hash, id]);
    } else {
        await run('UPDATE usuarios SET nome = ?, email = ?, perfil = ? WHERE id = ?', [nome, email, perfil, id]);
    }
    return buscarUsuarioPorId(id);
}

async function excluirUsuario(id) {
    const { changes } = await run('DELETE FROM usuarios WHERE id = ?', [id]);
    return changes > 0;
}

async function contarAdmins() {
    const row = await get("SELECT COUNT(*) AS total FROM usuarios WHERE perfil = 'admin'");
    return row.total;
}

module.exports = { listarUsuarios, buscarUsuarioPorId, buscarUsuarioPorEmail, criarUsuario, atualizarUsuario, excluirUsuario, contarAdmins };
