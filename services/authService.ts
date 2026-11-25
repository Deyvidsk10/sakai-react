// Serviço de autenticação: login, cadastro, logout e leitura do token salvo - [Deyvidsk10]
import api, { TOKEN_KEY, USUARIO_KEY } from './api';
import { Usuario } from '../types/pizzaria';

interface RespostaLogin {
    token: string;
    usuario: Usuario;
}

export const AuthService = {
    // Faz login e guarda token + usuário no localStorage - [Deyvidsk10]
    async login(email: string, senha: string): Promise<Usuario> {
        const { data } = await api.post<RespostaLogin>('/auth/login', { email, senha });
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USUARIO_KEY, JSON.stringify(data.usuario));
        return data.usuario;
    },

    async registrar(nome: string, email: string, senha: string): Promise<void> {
        await api.post('/auth/register', { nome, email, senha });
    },

    logout() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USUARIO_KEY);
    },

    getUsuario(): Usuario | null {
        if (typeof window === 'undefined') return null;
        const salvo = localStorage.getItem(USUARIO_KEY);
        return salvo ? (JSON.parse(salvo) as Usuario) : null;
    },

    // Confere se existe token e se ele ainda não expirou (lendo o "exp" do JWT) - [Deyvidsk10]
    estaAutenticado(): boolean {
        if (typeof window === 'undefined') return false;
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) return false;
        try {
            const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
            return !payload.exp || payload.exp * 1000 > Date.now();
        } catch {
            return false;
        }
    },

    ehAdmin(): boolean {
        return this.getUsuario()?.perfil === 'admin';
    }
};
