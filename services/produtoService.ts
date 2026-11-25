// Chamadas HTTP do CRUD de Produtos - [Deyvidsk10]
import api from './api';
import { Produto } from '../types/pizzaria';

export const ProdutoService = {
    async listar(): Promise<Produto[]> {
        const { data } = await api.get<{ produtos: Produto[] }>('/produtos');
        return data.produtos;
    },
    async criar(produto: Produto): Promise<Produto> {
        const { data } = await api.post<{ produto: Produto }>('/produtos', produto);
        return data.produto;
    },
    async atualizar(id: number, produto: Produto): Promise<Produto> {
        const { data } = await api.put<{ produto: Produto }>(`/produtos/${id}`, produto);
        return data.produto;
    },
    async excluir(id: number): Promise<void> {
        await api.delete(`/produtos/${id}`);
    }
};
