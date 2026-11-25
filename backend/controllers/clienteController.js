// Controller de Clientes: validação e regras do CRUD de clientes - [Deyvidsk10]
const model = require('../models/clienteModel');
const { HttpError, lerId, texto } = require('../utils/http');

// Valida e normaliza os dados do cliente (endereço vem do ViaCEP/IBGE no frontend) - [Deyvidsk10]
function validar(body) {
    const dados = {
        nome: texto(body.nome),
        telefone: texto(body.telefone),
        cep: texto(body.cep),
        logradouro: texto(body.logradouro),
        numero: texto(body.numero),
        complemento: texto(body.complemento),
        bairro: texto(body.bairro),
        cidade: texto(body.cidade),
        uf: texto(body.uf)?.toUpperCase() || null
    };

    if (!dados.nome) throw new HttpError(400, 'O nome é obrigatório');
    // Telefone é opcional (permite o cadastro rápido só com o nome na tela de pedidos),
    // mas se for informado precisa ter DDD + número - [Deyvidsk10]
    if (dados.telefone && dados.telefone.replace(/\D/g, '').length < 10) throw new HttpError(400, 'Telefone inválido (informe DDD + número)');
    // A coluna no banco é NOT NULL, então "sem telefone" é gravado como texto vazio - [Deyvidsk10]
    dados.telefone = dados.telefone ?? '';
    if (dados.cep && dados.cep.replace(/\D/g, '').length !== 8) throw new HttpError(400, 'CEP inválido');
    if (dados.uf && !/^[A-Z]{2}$/.test(dados.uf)) throw new HttpError(400, 'UF inválida');

    return dados;
}

async function listar(req, res) {
    res.json({ clientes: await model.listarClientes() });
}

async function buscar(req, res) {
    const cliente = await model.buscarClientePorId(lerId(req));
    if (!cliente) throw new HttpError(404, 'Cliente não encontrado');
    res.json({ cliente });
}

async function criar(req, res) {
    const cliente = await model.criarCliente(validar(req.body));
    res.status(201).json({ message: 'Cliente criado com sucesso', cliente });
}

async function atualizar(req, res) {
    const cliente = await model.atualizarCliente(lerId(req), validar(req.body));
    if (!cliente) throw new HttpError(404, 'Cliente não encontrado');
    res.json({ message: 'Cliente atualizado com sucesso', cliente });
}

async function excluir(req, res) {
    const id = lerId(req);
    // Mantém o histórico: cliente com pedidos não pode ser apagado - [Deyvidsk10]
    if (await model.clientePossuiPedidos(id)) {
        throw new HttpError(409, 'Este cliente possui pedidos e não pode ser excluído');
    }
    const excluido = await model.excluirCliente(id);
    if (!excluido) throw new HttpError(404, 'Cliente não encontrado');
    res.json({ message: 'Cliente excluído com sucesso' });
}

module.exports = { listar, buscar, criar, atualizar, excluir };
