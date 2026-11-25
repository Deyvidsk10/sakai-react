// Model de Clientes: acesso à tabela "clientes" - [Deyvidsk10]
const { run, get, all } = require('../db/database');

function listarClientes() {
    return all('SELECT * FROM clientes ORDER BY nome');
}

function buscarClientePorId(id) {
    return get('SELECT * FROM clientes WHERE id = ?', [id]);
}

// Monta o array de parâmetros na mesma ordem das colunas - [Deyvidsk10]
function parametros(c) {
    return [c.nome, c.telefone, c.cep, c.logradouro, c.numero, c.complemento, c.bairro, c.cidade, c.uf];
}

async function criarCliente(cliente) {
    const { lastID } = await run(
        `INSERT INTO clientes (nome, telefone, cep, logradouro, numero, complemento, bairro, cidade, uf)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        parametros(cliente)
    );
    return buscarClientePorId(lastID);
}

async function atualizarCliente(id, cliente) {
    const { changes } = await run(
        `UPDATE clientes SET nome = ?, telefone = ?, cep = ?, logradouro = ?, numero = ?,
         complemento = ?, bairro = ?, cidade = ?, uf = ? WHERE id = ?`,
        [...parametros(cliente), id]
    );
    return changes > 0 ? buscarClientePorId(id) : null;
}

async function excluirCliente(id) {
    const { changes } = await run('DELETE FROM clientes WHERE id = ?', [id]);
    return changes > 0;
}

// Usado para impedir a exclusão de cliente que já possui pedidos - [Deyvidsk10]
async function clientePossuiPedidos(id) {
    const row = await get('SELECT COUNT(*) AS total FROM pedidos WHERE cliente_id = ?', [id]);
    return row.total > 0;
}

module.exports = { listarClientes, buscarClientePorId, criarCliente, atualizarCliente, excluirCliente, clientePossuiPedidos };
