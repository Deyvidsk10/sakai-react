// Model de Categorias de produtos: acesso à tabela "categorias" - [Deyvidsk10]
const { run, get, all, transaction } = require('../db/database');

// Lista as categorias com quantos produtos usam cada uma - [Deyvidsk10]
function listarCategorias() {
    return all(`
        SELECT c.*, (SELECT COUNT(*) FROM produtos p WHERE p.categoria = c.nome) AS total_produtos
        FROM categorias c
        ORDER BY c.id
    `);
}

function buscarCategoriaPorId(id) {
    return get('SELECT * FROM categorias WHERE id = ?', [id]);
}

// Busca ignorando maiúsculas/minúsculas (a coluna é COLLATE NOCASE) - [Deyvidsk10]
function buscarCategoriaPorNome(nome) {
    return get('SELECT * FROM categorias WHERE nome = ?', [nome]);
}

async function criarCategoria(nome) {
    const { lastID } = await run('INSERT INTO categorias (nome) VALUES (?)', [nome]);
    return buscarCategoriaPorId(lastID);
}

// Renomeia a categoria e atualiza os produtos que usavam o nome antigo - [Deyvidsk10]
async function renomearCategoria(id, nomeAntigo, nomeNovo) {
    await transaction(async () => {
        await run('UPDATE categorias SET nome = ? WHERE id = ?', [nomeNovo, id]);
        await run('UPDATE produtos SET categoria = ? WHERE categoria = ?', [nomeNovo, nomeAntigo]);
    });
    return buscarCategoriaPorId(id);
}

async function excluirCategoria(id) {
    const { changes } = await run('DELETE FROM categorias WHERE id = ?', [id]);
    return changes > 0;
}

async function categoriaEmUso(nome) {
    const row = await get('SELECT COUNT(*) AS total FROM produtos WHERE categoria = ?', [nome]);
    return row.total > 0;
}

module.exports = { listarCategorias, buscarCategoriaPorId, buscarCategoriaPorNome, criarCategoria, renomearCategoria, excluirCategoria, categoriaEmUso };
