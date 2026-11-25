import { Metadata } from 'next';
import Layout from '../../layout/layout';
import AuthGuard from '../../layout/AuthGuard';

interface AppLayoutProps {
    children: React.ReactNode;
}

export const metadata: Metadata = {
    title: 'Pizzaria - Sistema de Gestão',
    description: 'Sistema de gestão da pizzaria: clientes, produtos, pedidos e usuários.',
    robots: { index: false, follow: false },
    viewport: { initialScale: 1, width: 'device-width' },
    icons: {
        icon: '/favicon.ico'
    }
};

// Todas as páginas do grupo (main) passam pelo AuthGuard (exigem login) - [Deyvidsk10]
export default function AppLayout({ children }: AppLayoutProps) {
    return (
        <AuthGuard>
            <Layout>{children}</Layout>
        </AuthGuard>
    );
}
