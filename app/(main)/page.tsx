'use client';
// Dashboard da pizzaria: totais, faturamento, pedidos por status e últimos pedidos - [Deyvidsk10]
import Link from 'next/link';
import { Button } from 'primereact/button';
import { Chart } from 'primereact/chart';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Skeleton } from 'primereact/skeleton';
import { Tag } from 'primereact/tag';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { LayoutContext } from '../../layout/context/layoutcontext';
import { PedidoService } from '../../services/pedidoService';
import { AuthService } from '../../services/authService';
import { mensagemErro } from '../../services/api';
import { Pedido, ResumoDashboard } from '../../types/pizzaria';
import { formatarDataHora, formatarMoeda, severidadeStatus } from '../../utils/formatadores';

// Cores fixas para cada status no gráfico - [Deyvidsk10]
const CORES_STATUS: Record<string, string> = {
    Recebido: '#3B82F6',
    'Em preparo': '#F59E0B',
    'Saiu para entrega': '#A855F7',
    Entregue: '#22C55E',
    Cancelado: '#EF4444'
};

const Dashboard = () => {
    const [resumo, setResumo] = useState<ResumoDashboard | null>(null);
    const [erro, setErro] = useState('');
    const [nome, setNome] = useState('');
    const { layoutConfig } = useContext(LayoutContext);

    useEffect(() => {
        setNome(AuthService.getUsuario()?.nome ?? '');
        PedidoService.resumo()
            .then(setResumo)
            .catch((e) => setErro(mensagemErro(e)));
    }, []);

    // Dados e opções do gráfico de rosca (ajusta a cor do texto ao tema claro/escuro) - [Deyvidsk10]
    const grafico = useMemo(() => {
        const lista = resumo?.pedidosPorStatus ?? [];
        return {
            data: {
                labels: lista.map((s) => s.status),
                datasets: [{ data: lista.map((s) => s.total), backgroundColor: lista.map((s) => CORES_STATUS[s.status] ?? '#64748B') }]
            },
            options: {
                plugins: { legend: { position: 'bottom', labels: { color: layoutConfig.colorScheme === 'light' ? '#495057' : '#ebedef' } } },
                maintainAspectRatio: false
            }
        };
    }, [resumo, layoutConfig.colorScheme]);

    const cards = [
        { titulo: 'Pedidos', valor: resumo?.totalPedidos, icone: 'pi-shopping-cart', cor: 'blue', link: '/pedidos' },
        { titulo: 'Faturamento', valor: resumo ? formatarMoeda(resumo.faturamento) : undefined, icone: 'pi-wallet', cor: 'green', link: '/pedidos', obs: 'exceto cancelados' },
        { titulo: 'Clientes', valor: resumo?.totalClientes, icone: 'pi-users', cor: 'cyan', link: '/clientes' },
        { titulo: 'Produtos', valor: resumo?.totalProdutos, icone: 'pi-box', cor: 'orange', link: '/produtos' }
    ];

    return (
        <div className="grid">
            <div className="col-12">
                <div className="flex flex-column sm:flex-row sm:align-items-center sm:justify-content-between gap-3 mb-2">
                    <div>
                        <h3 className="m-0">Olá{nome ? `, ${nome}` : ''}! 🍕</h3>
                        <span className="text-600">Resumo da pizzaria</span>
                    </div>
                    <Link href="/pedidos">
                        <Button label="Ir para pedidos" icon="pi pi-arrow-right" iconPos="right" />
                    </Link>
                </div>
                {erro && <div className="p-3 border-round bg-red-100 text-red-700">{erro}</div>}
            </div>

            {cards.map((c) => (
                <div key={c.titulo} className="col-12 md:col-6 xl:col-3">
                    <Link href={c.link} className="no-underline">
                        <div className="card mb-0 h-full">
                            <div className="flex justify-content-between mb-2">
                                <div>
                                    <span className="block text-500 font-medium mb-3">{c.titulo}</span>
                                    <div className="text-900 font-medium text-2xl">{c.valor ?? <Skeleton width="5rem" height="2rem" />}</div>
                                </div>
                                <div className={`flex align-items-center justify-content-center bg-${c.cor}-100 border-round`} style={{ width: '2.5rem', height: '2.5rem' }}>
                                    <i className={`pi ${c.icone} text-${c.cor}-500 text-xl`} />
                                </div>
                            </div>
                            {c.obs && <span className="text-500 text-sm">{c.obs}</span>}
                        </div>
                    </Link>
                </div>
            ))}

            <div className="col-12 xl:col-8">
                <div className="card h-full">
                    <h5>Últimos pedidos</h5>
                    <DataTable value={resumo?.ultimosPedidos ?? []} dataKey="id" loading={!resumo && !erro} emptyMessage="Nenhum pedido ainda." responsiveLayout="stack" breakpoint="960px">
                        <Column field="id" header="Nº" body={(p: Pedido) => `#${p.id}`} />
                        <Column field="cliente_nome" header="Cliente" />
                        <Column header="Data/Hora" body={(p: Pedido) => formatarDataHora(p.data_hora)} />
                        <Column header="Total" body={(p: Pedido) => formatarMoeda(p.valor_total)} />
                        <Column header="Status" body={(p: Pedido) => <Tag value={p.status} severity={severidadeStatus(p.status)} />} />
                    </DataTable>
                </div>
            </div>

            <div className="col-12 xl:col-4">
                <div className="card h-full">
                    <h5>Pedidos por status</h5>
                    {resumo && resumo.pedidosPorStatus.length > 0 ? (
                        <Chart type="doughnut" data={grafico.data} options={grafico.options} style={{ height: '280px' }} />
                    ) : (
                        <div className="text-600">{resumo ? 'Sem pedidos para exibir.' : <Skeleton height="280px" />}</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
