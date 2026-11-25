#!/usr/bin/env bash
# Instala as dependências e cria o backend/.env na criação do Codespace - [Deyvidsk10]
set -e
cd "$(dirname "$0")/.."

npm run setup

# Cria o .env da API com um JWT_SECRET aleatório (só se ainda não existir) - [Deyvidsk10]
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    SEGREDO=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    sed -i "s/^JWT_SECRET=.*/JWT_SECRET=${SEGREDO}/" backend/.env
    # O front chama a API pelo proxy /backend (mesma origem), então o CORS pode ficar liberado - [Deyvidsk10]
    sed -i "s/^CORS_ORIGIN=.*/CORS_ORIGIN=/" backend/.env
    echo "backend/.env criado com um JWT_SECRET aleatório"
fi
