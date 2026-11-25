'use client';
// Protege as páginas internas: sem token válido o usuário é mandado para o login - [Deyvidsk10]
import { usePathname, useRouter } from 'next/navigation';
import { ProgressSpinner } from 'primereact/progressspinner';
import React, { useEffect, useState } from 'react';
import { AuthService } from '../services/authService';

// Páginas que só o perfil admin pode abrir - [Deyvidsk10]
const ROTAS_ADMIN = ['/usuarios'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [liberado, setLiberado] = useState(false);

    useEffect(() => {
        if (!AuthService.estaAutenticado()) {
            AuthService.logout();
            router.replace('/auth/login');
            return;
        }
        if (ROTAS_ADMIN.some((rota) => pathname.startsWith(rota)) && !AuthService.ehAdmin()) {
            router.replace('/auth/access');
            return;
        }
        setLiberado(true);
    }, [pathname, router]);

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
