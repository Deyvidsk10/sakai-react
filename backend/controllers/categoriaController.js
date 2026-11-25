// Controller de Categorias: criar, renomear e excluir categorias de produtos - [Deyvidsk10]
const model = require('../models/categoriaModel');
const { HttpError, lerId, texto } = require('../utils/http');

// Valida o nome e deixa a primeira letra maiúscula (ex.: "lanches" -> "Lanches") - [Deyvidsk10]
function validarNome(body) {
    const nome = texto(body.nome);
    if (!nome) throw new HttpError(400, 'O nome da categoria é obrigatório');
    if (nome.length > 40) throw new HttpError(400, 'O nome da categoria deve ter no máximo 40 caracteres');
    return nome.charAt(0).toUpperCase() + nome.slice(1);
}

async function listar(req, res) {
    res.json({ categorias: await model.listarCategorias() });
}

async function criar(req, res) {
    const nome = validarNome(req.body);
    if (await model.buscarCategoriaPorNome(nome)) {
        throw new HttpError(409, `A categoria "${nome}" já existe`);
    }
    const categoria = await model.criarCategoria(nome);
    res.status(201).json({ message: 'Categoria criada com sucesso', categoria });
}

async function atualizar(req, res) {
    const id = lerId(req);
    const atual = await model.buscarCategoriaPorId(id);
    if (!atual) throw new HttpError(404, 'Categoria não encontrada');

    const nome = validarNome(req.body);
    const outra = await model.buscarCategoriaPorNome(nome);
    if (outra && outra.id !== id) {
        throw new HttpError(409, `A categoria "${nome}" já existe`);
    }
    const categoria = await model.renomearCategoria(id, atual.nome, nome);
    res.json({ message: 'Categoria atualizada com sucesso', categoria });
}

async function excluir(req, res) {
    const id = lerId(req);
    const atual = await model.buscarCategoriaPorId(id);
    if (!atual) throw new HttpError(404, 'Categoria não encontrada');
    // Não deixa produtos "órfãos" de categoria - [Deyvidsk10]
    if (await model.categoriaEmUso(atual.nome)) {
        throw new HttpError(409, 'Existem produtos nesta categoria. Mude a categoria deles antes de excluir.');
    }
    await model.excluirCategoria(id);
    res.json({ message: 'Categoria excluída com sucesso' });
}

module.exports = { listar, criar, atualizar, excluir };
