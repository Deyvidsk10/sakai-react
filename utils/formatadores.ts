// Funções de formatação usadas nas tabelas e formulários - [Deyvidsk10]

// Formata número como moeda brasileira (R$ 1.234,56) - [Deyvidsk10]
export function formatarMoeda(valor: number | null | undefined): string {
    return (valor ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Formata data ISO como "25/11/2026 20:30" - [Deyvidsk10]
export function formatarDataHora(valor: string | null | undefined): string {
    if (!valor) return '';
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) return valor;
    return data.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

// Cor da Tag de status do pedido (severidade do PrimeReact) - [Deyvidsk10]
export function severidadeStatus(status: string): 'info' | 'warning' | 'success' | 'danger' | undefined {
    switch (status) {
        case 'Recebido':
            return 'info';
        case 'Em preparo':
        case 'Saiu para entrega':
            return 'warning';
        case 'Entregue':
            return 'success';
        case 'Cancelado':
            return 'danger';
        default:
            return undefined;
    }
}

// Formata o telefone enquanto digita: (11) 3333-4444 ou (11) 98888-7777 - [Deyvidsk10]
export function formatarTelefone(valor: string): string {
    const d = valor.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return d.length ? `(${d}` : '';
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

// Formata o CEP enquanto digita: 01001-000 - [Deyvidsk10]
export function formatarCep(valor: string): string {
    const d = valor.replace(/\D/g, '').slice(0, 8);
    return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}
