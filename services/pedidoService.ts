// Chamadas HTTP do CRUD de Pedidos e do resumo do dashboard - [Deyvidsk10]
import api from './api';
import { Pedido, ResumoDashboard, StatusPedido } from '../types/pizzaria';

// Envia só o que a API precisa: o preço e o total são calculados no backend - [Deyvidsk10]
function corpo(pedido: Pedido) {
    return {
        cliente_id: pedido.cliente_id,
        status: pedido.status,
        data_hora: pedido.data_hora,
        observacao: pedido.observacao,
        itens: pedido.itens.map((i) => ({ produto_id: i.produto_id, quantidade: i.quantidade }))
    };
}

export const PedidoService = {
    async listar(): Promise<Pedido[]> {
        const { data } = await api.get<{ pedidos: Pedido[] }>('/pedidos');
        return data.pedidos;
    },
    async criar(pedido: Pedido): Promise<Pedido> {
        const { data } = await api.post<{ pedido: Pedido }>('/pedidos', corpo(pedido));
        return data.pedido;
    },
    async atualizar(id: number, pedido: Pedido): Promise<Pedido> {
        const { data } = await api.put<{ pedido: Pedido }>(`/pedidos/${id}`, corpo(pedido));
        return data.pedido;
    },
    async alterarStatus(id: number, status: StatusPedido): Promise<Pedido> {
        const { data } = await api.patch<{ pedido: Pedido }>(`/pedidos/${id}/status`, { status });
        return data.pedido;
    },
    async excluir(id: number): Promise<void> {
        await api.delete(`/pedidos/${id}`);
    },
    async resumo(): Promise<ResumoDashboard> {
        const { data } = await api.get<ResumoDashboard>('/pedidos/resumo');
        return data;
    }
};
