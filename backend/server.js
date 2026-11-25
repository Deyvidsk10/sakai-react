// Ponto de entrada da API: carrega o .env, prepara o banco e sobe o servidor - [Deyvidsk10]
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const app = require('./app');
const { initDatabase } = require('./db/database');

const PORT = process.env.PORT || 3001;

// Sem segredo do JWT a autenticação não funciona; avisa e usa um valor só para desenvolvimento - [Deyvidsk10]
if (!process.env.JWT_SECRET) {
    console.warn('⚠️  JWT_SECRET não definido no .env. Usando um segredo de desenvolvimento (NÃO use em produção).');
    process.env.JWT_SECRET = 'segredo-dev-pizzaria';
}

initDatabase()
    .then(() => {
        // 0.0.0.0 permite acesso externo no Codespaces/Replit - [Deyvidsk10]
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🍕 API Pizzaria rodando em http://localhost:${PORT}`);
            console.log(`📚 Swagger em http://localhost:${PORT}/api-docs`);
        });
    })
    .catch((err) => {
        console.error('Falha ao iniciar o banco de dados:', err);
        process.exit(1);
    });
