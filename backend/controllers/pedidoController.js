// Controller de Pedidos: valida itens e calcula o valor total no servidor - [Deyvidsk10]
const model = require('../models/pedidoModel');
const { buscarClientePorId } = require('../models/clienteModel');
const { buscarProdutoPorId } = require('../models/produtoModel');
const { HttpError, lerId, texto } = require('../utils/http');

// Valida o pedido e monta os itens com preço vindo do banco (nunca do frontend) - [Deyvidsk10]
// "atual" é o pedido já salvo (na edição), usado para manter a data/hora original - [Deyvidsk10]
async function validar(body, atual = null) {
    const clienteId = Number(body.cliente_id);
    if (!Number.isInteger(clienteId) || !(await buscarClientePorId(clienteId))) {
        throw new HttpError(400, 'Selecione um cliente válido');
    }

    const status = texto(body.status) || 'Recebido';
    if (!model.STATUS.includes(status)) {
        throw new HttpError(400, `Status inválido (use: ${model.STATUS.join(', ')})`);
    }

    let dataHora = atual ? atual.data_hora : new Date().toISOString();
    if (body.data_hora) {
        const data = new Date(body.data_hora);
        if (Number.isNaN(data.getTime())) throw new HttpError(400, 'Data/hora inválida');
        dataHora = data.toISOString();
    }

    if (!Array.isArray(body.itens) || body.itens.length === 0) {
        throw new HttpError(400, 'O pedido precisa ter pelo menos um item');
    }

    const itens = [];
    for (const item of body.itens) {
        const produtoId = Number(item.produto_id);
        const quantidade = Number(item.quantidade);
        if (!Number.isInteger(quantidade) || quantidade <= 0) {
            throw new HttpError(400, 'A quantidade de cada item deve ser um número inteiro maior que zero');
        }
        const produto = Number.isInteger(produtoId) ? await buscarProdutoPorId(produtoId) : null;
        if (!produto) {
            throw new HttpError(400, `Produto ${item.produto_id} não encontrado`);
        }
        // Função que calcula o subtotal do item (preço x quantidade) - [Deyvidsk10]
        const subtotal = Math.round(produto.preco * quantidade * 100) / 100;
        itens.push({ produto_id: produto.id, quantidade, preco_unitario: produto.preco, subtotal });
    }

    return { cliente_id: clienteId, status, data_hora: dataHora, observacao: texto(body.observacao), itens };
}

async function listar(req, res) {
    res.json({ pedidos: await model.listarPedidos(texto(req.query.status)) });
}

async function buscar(req, res) {
    const pedido = await model.buscarPedidoPorId(lerId(req));
    if (!pedido) throw new HttpError(404, 'Pedido não encontrado');
    res.json({ pedido });
}

async function criar(req, res) {
    const pedido = await model.criarPedido(await validar(req.body));
    res.status(201).json({ message: 'Pedido criado com sucesso', pedido });
}

async function atualizar(req, res) {
    const id = lerId(req);
    const atual = await model.buscarPedidoPorId(id);
    if (!atual) throw new HttpError(404, 'Pedido não encontrado');
    const pedido = await model.atualizarPedido(id, await validar(req.body, atual));
    res.json({ message: 'Pedido atualizado com sucesso', pedido });
}

// PATCH /pedidos/:id/status - troca rápida de status pela tabela - [Deyvidsk10]
async function atualizarStatus(req, res) {
    const status = texto(req.body.status);
    if (!model.STATUS.includes(status)) {
        throw new HttpError(400, `Status inválido (use: ${model.STATUS.join(', ')})`);
    }
    const pedido = await model.atualizarStatus(lerId(req), status);
    if (!pedido) throw new HttpError(404, 'Pedido não encontrado');
    res.json({ message: 'Status atualizado com sucesso', pedido });
}

async function excluir(req, res) {
    const excluido = await model.excluirPedido(lerId(req));
    if (!excluido) throw new HttpError(404, 'Pedido não encontrado');
    res.json({ message: 'Pedido excluído com sucesso' });
}

async function resumo(req, res) {
    res.json(await model.resumo());
}

module.exports = { listar, buscar, criar, atualizar, atualizarStatus, excluir, resumo };
