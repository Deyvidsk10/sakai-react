// Model de Produtos (pizzas, bebidas e sobremesas): acesso à tabela "produtos" - [Deyvidsk10]
const { run, get, all } = require('../db/database');

const CATEGORIAS = ['Pizza', 'Bebida', 'Sobremesa'];

// Lista todos os produtos, com filtro opcional por categoria - [Deyvidsk10]
function listarProdutos(categoria) {
    if (categoria) {
        return all('SELECT * FROM produtos WHERE categoria = ? ORDER BY nome', [categoria]);
    }
    return all('SELECT * FROM produtos ORDER BY categoria, nome');
}

function buscarProdutoPorId(id) {
    return get('SELECT * FROM produtos WHERE id = ?', [id]);
}

async function criarProduto({ nome, descricao, preco, categoria }) {
    const { lastID } = await run('INSERT INTO produtos (nome, descricao, preco, categoria) VALUES (?, ?, ?, ?)', [nome, descricao, preco, categoria]);
    return buscarProdutoPorId(lastID);
}

async function atualizarProduto(id, { nome, descricao, preco, categoria }) {
    const { changes } = await run('UPDATE produtos SET nome = ?, descricao = ?, preco = ?, categoria = ? WHERE id = ?', [nome, descricao, preco, categoria, id]);
    return changes > 0 ? buscarProdutoPorId(id) : null;
}

async function excluirProduto(id) {
    const { changes } = await run('DELETE FROM produtos WHERE id = ?', [id]);
    return changes > 0;
}

// Usado para impedir a exclusão de produto que já foi vendido - [Deyvidsk10]
async function produtoEmPedidos(id) {
    const row = await get('SELECT COUNT(*) AS total FROM pedido_itens WHERE produto_id = ?', [id]);
    return row.total > 0;
}

module.exports = { CATEGORIAS, listarProdutos, buscarProdutoPorId, criarProduto, atualizarProduto, excluirProduto, produtoEmPedidos };
