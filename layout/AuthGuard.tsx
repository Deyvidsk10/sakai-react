'use client';
// Protege as páginas internas: exige login e libera as telas conforme o perfil do usuário - [Deyvidsk10]
import { usePathname, useRouter } from 'next/navigation';
import { ProgressSpinner } from 'primereact/progressspinner';
import React, { useEffect, useState } from 'react';
import { AuthService } from '../services/authService';

// Páginas que só o perfil admin pode abrir - [Deyvidsk10]
const ROTAS_ADMIN = ['/usuarios'];
// Únicas páginas que o perfil cliente pode abrir - [Deyvidsk10]
const ROTAS_CLIENTE = ['/cardapio'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [perfilConferido, setPerfilConferido] = useState(false);
    const [liberado, setLiberado] = useState(false);

    // Ao abrir o sistema, busca o perfil atual na API (o admin pode ter trocado o perfil) - [Deyvidsk10]
    useEffect(() => {
        if (!AuthService.estaAutenticado()) {
            AuthService.logout();
            router.replace('/auth/login');
            return;
        }
        AuthService.atualizarUsuario()
            .catch(() => null) // sem conexão: segue com o perfil salvo no login
            .finally(() => setPerfilConferido(true));
    }, [router]);

    // A cada troca de página, confere se o perfil pode abrir a rota - [Deyvidsk10]
    useEffect(() => {
        if (!perfilConferido) return;
        // Só esconde a tela quando precisa redirecionar (evita piscar a cada navegação) - [Deyvidsk10]
        const redirecionar = (destino: string) => {
            setLiberado(false);
            router.replace(destino);
        };
        if (!AuthService.estaAutenticado()) {
            AuthService.logout();
            return redirecionar('/auth/login');
        }
        if (AuthService.ehCliente() && !ROTAS_CLIENTE.some((rota) => pathname.startsWith(rota))) {
            return redirecionar('/cardapio');
        }
        if (ROTAS_ADMIN.some((rota) => pathname.startsWith(rota)) && !AuthService.ehAdmin()) {
            return redirecionar('/auth/access');
        }
        setLiberado(true);
    }, [pathname, router, perfilConferido]);

    // Enquanto verifica, mostra um carregando em vez do conteúdo protegido - [Deyvidsk10]
    if (!liberado) {
        return (
            <div className="flex align-items-center justify-content-center min-h-screen">
                <ProgressSpinner />
            </div>
        );
    }

    return <>{children}</>;
}
