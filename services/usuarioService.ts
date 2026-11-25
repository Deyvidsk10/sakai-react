// Chamadas HTTP do CRUD de Usuários (rotas exclusivas do admin) - [Deyvidsk10]
import api from './api';
import { Usuario } from '../types/pizzaria';

export const UsuarioService = {
    async listar(): Promise<Usuario[]> {
        const { data } = await api.get<{ usuarios: Usuario[] }>('/usuarios');
        return data.usuarios;
    },
    async criar(usuario: Usuario): Promise<Usuario> {
        const { data } = await api.post<{ usuario: Usuario }>('/usuarios', usuario);
        return data.usuario;
    },
    async atualizar(id: number, usuario: Usuario): Promise<Usuario> {
        const { data } = await api.put<{ usuario: Usuario }>(`/usuarios/${id}`, usuario);
        return data.usuario;
    },
    async excluir(id: number): Promise<void> {
        await api.delete(`/usuarios/${id}`);
    }
};
