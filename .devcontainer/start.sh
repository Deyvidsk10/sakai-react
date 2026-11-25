#!/usr/bin/env bash
# Sobe API (3001) e frontend (3000) em segundo plano sempre que o Codespace liga - [Deyvidsk10]
cd "$(dirname "$0")/.."

# Evita subir duas vezes se o script rodar de novo - [Deyvidsk10]
pkill -f "node server.js" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true

nohup npm run api > /tmp/pizzaria-api.log 2>&1 &
nohup npm run dev > /tmp/pizzaria-front.log 2>&1 &

# Tenta deixar a porta 3000 pública automaticamente (se não der, faça pela aba Ports) - [Deyvidsk10]
if [ -n "$CODESPACE_NAME" ] && command -v gh >/dev/null 2>&1; then
    gh codespace ports visibility 3000:public -c "$CODESPACE_NAME" >/dev/null 2>&1 || true
fi

echo "🍕 Pizzaria iniciando..."
echo "   Frontend: porta 3000  |  API/Swagger: porta 3001"
echo "   Logs: tail -f /tmp/pizzaria-api.log /tmp/pizzaria-front.log"
