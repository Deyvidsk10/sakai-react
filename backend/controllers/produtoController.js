// Controller de Produtos: validação e regras do CRUD de produtos - [Deyvidsk10]
const model = require('../models/produtoModel');
const { buscarCategoriaPorNome } = require('../models/categoriaModel');
const { HttpError, lerId, texto } = require('../utils/http');

// A categoria precisa estar cadastrada na tabela de categorias - [Deyvidsk10]
async function validar(body) {
    const dados = {
        nome: texto(body.nome),
        descricao: texto(body.descricao),
        preco: Number(body.preco),
        categoria: texto(body.categoria)
    };

    if (!dados.nome) throw new HttpError(400, 'O nome é obrigatório');
    if (body.preco === undefined || body.preco === null || body.preco === '' || !Number.isFinite(dados.preco) || dados.preco < 0) {
        throw new HttpError(400, 'Informe um preço válido');
    }
    const categoria = dados.categoria ? await buscarCategoriaPorNome(dados.categoria) : null;
    if (!categoria) {
        throw new HttpError(400, 'Selecione uma categoria cadastrada');
    }
    // Usa o nome exatamente como está cadastrado (ex.: "pizza" vira "Pizza") - [Deyvidsk10]
    dados.categoria = categoria.nome;
    // Guarda o preço sempre com 2 casas decimais - [Deyvidsk10]
    dados.preco = Math.round(dados.preco * 100) / 100;
    return dados;
}

async function listar(req, res) {
    const categoria = texto(req.query.categoria);
    res.json({ produtos: await model.listarProdutos(categoria) });
}

async function buscar(req, res) {
    const produto = await model.buscarProdutoPorId(lerId(req));
    if (!produto) throw new HttpError(404, 'Produto não encontrado');
    res.json({ produto });
}

async function criar(req, res) {
    const produto = await model.criarProduto(await validar(req.body));
    res.status(201).json({ message: 'Produto criado com sucesso', produto });
}

async function atualizar(req, res) {
    const produto = await model.atualizarProduto(lerId(req), await validar(req.body));
    if (!produto) throw new HttpError(404, 'Produto não encontrado');
    res.json({ message: 'Produto atualizado com sucesso', produto });
}

async function excluir(req, res) {
    const id = lerId(req);
    if (await model.produtoEmPedidos(id)) {
        throw new HttpError(409, 'Este produto já foi usado em pedidos e não pode ser excluído');
    }
    const excluido = await model.excluirProduto(id);
    if (!excluido) throw new HttpError(404, 'Produto não encontrado');
    res.json({ message: 'Produto excluído com sucesso' });
}

module.exports = { listar, buscar, criar, atualizar, excluir };
