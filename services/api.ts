// Instância do Axios usada em toda a aplicação para falar com a API - [Deyvidsk10]
import axios, { AxiosError } from 'axios';

// Se NEXT_PUBLIC_API_URL não for definido, usa o proxy "/backend" configurado no next.config.js - [Deyvidsk10]
export const API_URL = process.env.NEXT_PUBLIC_API_URL || '/backend';

export const TOKEN_KEY = 'pizzaria_token';
export const USUARIO_KEY = 'pizzaria_usuario';

const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' }
});

// Interceptor de requisição: anexa o token JWT em todas as chamadas - [Deyvidsk10]
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Interceptor de resposta: token expirado/inválido (401) leva de volta ao login - [Deyvidsk10]
api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        const ehLogin = error.config?.url?.includes('/auth/login');
        if (error.response?.status === 401 && !ehLogin && typeof window !== 'undefined') {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USUARIO_KEY);
            window.location.href = '/auth/login?expirado=1';
        }
        return Promise.reject(error);
    }
);

// Extrai a mensagem de erro enviada pela API (campo "message") - [Deyvidsk10]
export function mensagemErro(error: unknown, padrao = 'Não foi possível concluir a operação'): string {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data as { message?: string } | undefined;
        if (data?.message) return data.message;
        if (!error.response) return 'Não foi possível conectar à API. Verifique se o backend está rodando.';
    }
    return padrao;
}

export default api;
