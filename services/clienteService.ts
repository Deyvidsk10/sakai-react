// Chamadas HTTP do CRUD de Clientes - [Deyvidsk10]
import api from './api';
import { Cliente } from '../types/pizzaria';

export const ClienteService = {
    async listar(): Promise<Cliente[]> {
        const { data } = await api.get<{ clientes: Cliente[] }>('/clientes');
        return data.clientes;
    },
    async criar(cliente: Cliente): Promise<Cliente> {
        const { data } = await api.post<{ cliente: Cliente }>('/clientes', cliente);
        return data.cliente;
    },
    async atualizar(id: number, cliente: Cliente): Promise<Cliente> {
        const { data } = await api.put<{ cliente: Cliente }>(`/clientes/${id}`, cliente);
        return data.cliente;
    },
    async excluir(id: number): Promise<void> {
        await api.delete(`/clientes/${id}`);
    }
};
