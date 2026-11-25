// Configuração do Express: CORS, JSON, Swagger, rotas e tratamento de erros - [Deyvidsk10]
const express = require('express');
const cors = require('cors');
const logger = require('morgan');
const { swaggerUi, swaggerSpec } = require('./config/swagger');

const app = express();

// CORS: libera as origens listadas em CORS_ORIGIN (ou todas, se vazio) - [Deyvidsk10]
const origensPermitidas = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

app.use(
    cors({
        origin: origensPermitidas.length > 0 ? origensPermitidas : true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    })
);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Documentação interativa em /api-docs e o JSON da especificação em /api-docs.json - [Deyvidsk10]
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: 'API Pizzaria' }));
app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));

// Rota simples para verificar se a API está no ar - [Deyvidsk10]
app.get('/', (req, res) => {
    res.json({ message: 'API Pizzaria no ar 🍕', docs: '/api-docs' });
});

// Rotas da aplicação - [Deyvidsk10]
app.use('/auth', require('./routes/auth'));
app.use('/usuarios', require('./routes/usuarios'));
app.use('/clientes', require('./routes/clientes'));
app.use('/produtos', require('./routes/produtos'));
app.use('/pedidos', require('./routes/pedidos'));

// Rota não encontrada - [Deyvidsk10]
app.use((req, res) => {
    res.status(404).json({ message: 'Rota não encontrada' });
});

// Tratador central de erros: devolve sempre JSON com "message" - [Deyvidsk10]
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    if (err.status) {
        return res.status(err.status).json({ message: err.message });
    }
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ message: 'JSON inválido no corpo da requisição' });
    }
    if (err.code === 'SQLITE_CONSTRAINT') {
        return res.status(409).json({ message: 'Operação viola uma regra do banco de dados' });
    }
    console.error(err);
    res.status(500).json({ message: 'Erro interno do servidor' });
});

module.exports = app;
