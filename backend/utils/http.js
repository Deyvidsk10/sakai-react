// Utilitários HTTP: erro com status e wrapper para controllers async - [Deyvidsk10]

// Erro que já carrega o status HTTP que deve ser devolvido ao cliente - [Deyvidsk10]
class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

// Repassa erros de funções async para o tratador de erros do Express - [Deyvidsk10]
function asyncHandler(fn) {
    return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// Converte o :id da URL em número inteiro válido - [Deyvidsk10]
function lerId(req) {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        throw new HttpError(400, 'ID inválido');
    }
    return id;
}

// Remove espaços e transforma string vazia em null - [Deyvidsk10]
function texto(valor) {
    if (valor === undefined || valor === null) return null;
    const limpo = String(valor).trim();
    return limpo === '' ? null : limpo;
}

module.exports = { HttpError, asyncHandler, lerId, texto };
