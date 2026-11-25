// Configuração do Next.js - [Deyvidsk10]
/** @type {import('next').NextConfig} */
const nextConfig = {
    // Mantém a barra final das URLs (o Swagger da API precisa de "/api-docs/") - [Deyvidsk10]
    skipTrailingSlashRedirect: true,
    // Proxy: chamadas para /backend/* são repassadas para a API Express.
    // Assim, no Codespaces/Replit só a porta do frontend precisa ficar pública - [Deyvidsk10]
    async rewrites() {
        const apiInterna = process.env.API_INTERNAL_URL || 'http://localhost:3001';
        return [
            // A página do Swagger precisa da barra final para carregar seus arquivos - [Deyvidsk10]
            {
                source: '/backend/api-docs/',
                destination: `${apiInterna}/api-docs/`
            },
            {
                source: '/backend/:path*',
                destination: `${apiInterna}/:path*`
            }
        ];
    }
};

module.exports = nextConfig;
