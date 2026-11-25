'use client';
// Cardápio para o perfil "cliente": mostra os produtos por categoria, sem edição - [Deyvidsk10]
import { Message } from 'primereact/message';
import { Skeleton } from 'primereact/skeleton';
import React, { useEffect, useMemo, useState } from 'react';
import { ProdutoService } from '../../../services/produtoService';
import { AuthService } from '../../../services/authService';
import { mensagemErro } from '../../../services/api';
import { Produto } from '../../../types/pizzaria';
import { formatarMoeda } from '../../../utils/formatadores';

// Ordem preferida: categorias padrão primeiro, as criadas depois (em ordem alfabética) - [Deyvidsk10]
const ORDEM = ['Pizza', 'Bebida', 'Sobremesa'];

const CardapioPage = () => {
    const [produtos, setProdutos] = useState<Produto[] | null>(null);
    const [erro, setErro] = useState('');
    const [ehCliente, setEhCliente] = useState(false);

    useEffect(() => {
        setEhCliente(AuthService.ehCliente());
        ProdutoService.listar()
            .then(setProdutos)
            .catch((e) => setErro(mensagemErro(e)));
    }, []);

    // Agrupa os produtos por categoria - [Deyvidsk10]
    const grupos = useMemo(() => {
        const lista = produtos ?? [];
        const categorias = Array.from(new Set(lista.map((p) => p.categoria))).sort((a, b) => {
            const ia = ORDEM.indexOf(a) === -1 ? 99 : ORDEM.indexOf(a);
            const ib = ORDEM.indexOf(b) === -1 ? 99 : ORDEM.indexOf(b);
            return ia - ib || a.localeCompare(b);
        });
        return categorias.map((categoria) => ({ categoria, itens: lista.filter((p) => p.categoria === categoria) }));
    }, [produtos]);

    return (
        <div className="grid">
            <div className="col-12">
                <h3 className="mt-0 mb-1">Cardápio 🍕</h3>
                <span className="text-600">Confira nossas pizzas, bebidas e sobremesas</span>
            </div>

            {ehCliente && (
                <div className="col-12">
                    {/* Explica por que o cliente só vê o cardápio - [Deyvidsk10] */}
                    <Message severity="info" className="w-full justify-content-start" text="Sua conta está com perfil de cliente. Se você trabalha na pizzaria, peça ao administrador para alterar seu perfil para atendente." />
                </div>
            )}

            {erro && (
                <div className="col-12">
                    <Message severity="error" text={erro} className="w-full justify-content-start" />
                </div>
            )}

            {!produtos &&
                !erro &&
                [1, 2, 3].map((i) => (
                    <div key={i} className="col-12 md:col-6 xl:col-4">
                        <div className="card">
                            <Skeleton height="6rem" />
                        </div>
                    </div>
                ))}

            {grupos.map(({ categoria, itens }) => (
                <div key={categoria} className="col-12">
                    <div className="card">
                        <h5 className="mt-0">
                            {categoria} <span className="text-500 text-base font-normal">({itens.length})</span>
                        </h5>
                        <div className="grid">
                            {itens.map((p) => (
                                <div key={p.id} className="col-12 md:col-6 xl:col-4">
                                    <div className="surface-50 border-1 surface-border border-round p-3 h-full flex flex-column justify-content-between gap-2">
                                        <div>
                                            <div className="font-medium text-900 text-lg">{p.nome}</div>
                                            {p.descricao && <div className="text-600 mt-1">{p.descricao}</div>}
                                        </div>
                                        <div className="text-primary font-bold text-xl">{formatarMoeda(p.preco)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ))}

            {produtos && produtos.length === 0 && (
                <div className="col-12">
                    <div className="card text-600">Nenhum produto cadastrado ainda.</div>
                </div>
            )}
        </div>
    );
};

export default CardapioPage;
