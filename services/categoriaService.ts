// Chamadas HTTP das Categorias de produtos - [Deyvidsk10]
import api from './api';
import { CategoriaProduto } from '../types/pizzaria';

export const CategoriaService = {
    async listar(): Promise<CategoriaProduto[]> {
        const { data } = await api.get<{ categorias: CategoriaProduto[] }>('/categorias');
        return data.categorias;
    },
    async criar(nome: string): Promise<CategoriaProduto> {
        const { data } = await api.post<{ categoria: CategoriaProduto }>('/categorias', { nome });
        return data.categoria;
    },
    async renomear(id: number, nome: string): Promise<CategoriaProduto> {
        const { data } = await api.put<{ categoria: CategoriaProduto }>(`/categorias/${id}`, { nome });
        return data.categoria;
    },
    async excluir(id: number): Promise<void> {
        await api.delete(`/categorias/${id}`);
    }
};
