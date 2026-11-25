// Model de Pedidos: tabelas "pedidos" e "pedido_itens" - [Deyvidsk10]
const { run, get, all, transaction } = require('../db/database');

const STATUS = ['Recebido', 'Em preparo', 'Saiu para entrega', 'Entregue', 'Cancelado'];

const SELECT_PEDIDO = `
    SELECT p.*, c.nome AS cliente_nome, c.telefone AS cliente_telefone
    FROM pedidos p
    JOIN clientes c ON c.id = p.cliente_id
`;

// Busca os itens de vários pedidos de uma vez e agrupa por pedido_id - [Deyvidsk10]
async function anexarItens(pedidos) {
    if (pedidos.length === 0) return pedidos;
    const ids = pedidos.map((p) => p.id);
    const itens = await all(
        `SELECT i.*, pr.nome AS produto_nome, pr.categoria AS produto_categoria
         FROM pedido_itens i
         JOIN produtos pr ON pr.id = i.produto_id
         WHERE i.pedido_id IN (${ids.map(() => '?').join(',')})
         ORDER BY i.id`,
        ids
    );
    return pedidos.map((p) => ({ ...p, itens: itens.filter((i) => i.pedido_id === p.id) }));
}

// Lista pedidos (mais recentes primeiro), com filtro opcional de status - [Deyvidsk10]
async function listarPedidos(status) {
    const pedidos = status ? await all(`${SELECT_PEDIDO} WHERE p.status = ? ORDER BY p.data_hora DESC`, [status]) : await all(`${SELECT_PEDIDO} ORDER BY p.data_hora DESC`);
    return anexarItens(pedidos);
}

async function buscarPedidoPorId(id) {
    const pedido = await get(`${SELECT_PEDIDO} WHERE p.id = ?`, [id]);
    if (!pedido) return null;
    const [comItens] = await anexarItens([pedido]);
    return comItens;
}

// Grava os itens e devolve o valor total calculado no servidor - [Deyvidsk10]
async function gravarItens(pedidoId, itensCalculados) {
    let total = 0;
    for (const item of itensCalculados) {
        await run('INSERT INTO pedido_itens (pedido_id, produto_id, quantidade, preco_unitario, subtotal) VALUES (?, ?, ?, ?, ?)', [pedidoId, item.produto_id, item.quantidade, item.preco_unitario, item.subtotal]);
        total += item.subtotal;
    }
    return Math.round(total * 100) / 100;
}

// Cria pedido + itens em uma única transação - [Deyvidsk10]
async function criarPedido({ cliente_id, status, data_hora, observacao, itens }) {
    const id = await transaction(async () => {
        const { lastID } = await run('INSERT INTO pedidos (cliente_id, status, data_hora, observacao) VALUES (?, ?, ?, ?)', [cliente_id, status, data_hora, observacao]);
        const total = await gravarItens(lastID, itens);
        await run('UPDATE pedidos SET valor_total = ? WHERE id = ?', [total, lastID]);
        return lastID;
    });
    return buscarPedidoPorId(id);
}

// Atualiza o pedido substituindo todos os itens - [Deyvidsk10]
async function atualizarPedido(id, { cliente_id, status, data_hora, observacao, itens }) {
    await transaction(async () => {
        await run('UPDATE pedidos SET cliente_id = ?, status = ?, data_hora = ?, observacao = ? WHERE id = ?', [cliente_id, status, data_hora, observacao, id]);
        await run('DELETE FROM pedido_itens WHERE pedido_id = ?', [id]);
        const total = await gravarItens(id, itens);
        await run('UPDATE pedidos SET valor_total = ? WHERE id = ?', [total, id]);
    });
    return buscarPedidoPorId(id);
}

async function atualizarStatus(id, status) {
    const { changes } = await run('UPDATE pedidos SET status = ? WHERE id = ?', [status, id]);
    return changes > 0 ? buscarPedidoPorId(id) : null;
}

// Os itens são removidos automaticamente (ON DELETE CASCADE) - [Deyvidsk10]
async function excluirPedido(id) {
    const { changes } = await run('DELETE FROM pedidos WHERE id = ?', [id]);
    return changes > 0;
}

// Números usados no painel inicial (dashboard) - [Deyvidsk10]
async function resumo() {
    const [clientes, produtos, pedidos, faturamento, porStatus] = await Promise.all([
        get('SELECT COUNT(*) AS total FROM clientes'),
        get('SELECT COUNT(*) AS total FROM produtos'),
        get('SELECT COUNT(*) AS total FROM pedidos'),
        get("SELECT COALESCE(SUM(valor_total), 0) AS total FROM pedidos WHERE status <> 'Cancelado'"),
        all('SELECT status, COUNT(*) AS total FROM pedidos GROUP BY status')
    ]);
    const ultimos = await all(`${SELECT_PEDIDO} ORDER BY p.data_hora DESC LIMIT 5`);
    return {
        totalClientes: clientes.total,
        totalProdutos: produtos.total,
        totalPedidos: pedidos.total,
        faturamento: faturamento.total,
        pedidosPorStatus: porStatus,
        ultimosPedidos: ultimos
    };
}

module.exports = { STATUS, listarPedidos, buscarPedidoPorId, criarPedido, atualizarPedido, atualizarStatus, excluirPedido, resumo };
