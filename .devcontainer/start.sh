#!/usr/bin/env bash
# Sobe API (3001) e frontend (3000) em segundo plano - [Deyvidsk10]
# Uso:
#   bash .devcontainer/start.sh             -> sobe só o que estiver parado
#   bash .devcontainer/start.sh --reiniciar -> derruba e sobe tudo de novo
cd "$(dirname "$0")/.."

# Responde se tem algo escutando na porta (só abre a conexão, sem fazer o Next compilar página) - [Deyvidsk10]
no_ar() {
    (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null
}

# Inicia um comando totalmente separado deste script (setsid + nohup).
# Sem isso o Codespace encerra o processo quando o script de inicialização termina - [Deyvidsk10]
iniciar() {
    local nome="$1" log="$2"
    shift 2
    setsid nohup "$@" > "$log" 2>&1 < /dev/null &
    disown 2>/dev/null || true
    echo "   ▶ $nome iniciado (log: $log)"
}

if [ "$1" = "--reiniciar" ]; then
    pkill -f "node server.js" 2>/dev/null || true
    pkill -f "next dev" 2>/dev/null || true
    pkill -f "next-router-worker\|next-render-worker" 2>/dev/null || true
    sleep 1
fi

echo "🍕 Pizzaria"
if no_ar 3001; then
    echo "   ✔ API já está no ar (porta 3001)"
else
    iniciar "API" /tmp/pizzaria-api.log npm run api
fi

if no_ar 3000; then
    echo "   ✔ Frontend já está no ar (porta 3000)"
else
    iniciar "Frontend" /tmp/pizzaria-front.log npm run dev
fi

# Tenta deixar a porta 3000 pública automaticamente (se não der, faça pela aba Ports) - [Deyvidsk10]
if [ -n "$CODESPACE_NAME" ] && command -v gh >/dev/null 2>&1; then
    gh codespace ports visibility 3000:public -c "$CODESPACE_NAME" >/dev/null 2>&1 || true
fi

echo "   Logs: tail -f /tmp/pizzaria-api.log /tmp/pizzaria-front.log"
