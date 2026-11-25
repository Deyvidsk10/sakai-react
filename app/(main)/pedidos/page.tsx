'use client';
// Página do CRUD de Pedidos: cliente, itens, status, valor total e data/hora - [Deyvidsk10]
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Column } from 'primereact/column';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { DataTable, DataTableExpandedRows, DataTableValueArray } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Divider } from 'primereact/divider';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { classNames } from 'primereact/utils';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PedidoService } from '../../../services/pedidoService';
import { ClienteService } from '../../../services/clienteService';
import { ProdutoService } from '../../../services/produtoService';
import { mensagemErro } from '../../../services/api';
import { Cliente, Pedido, PedidoItem, Produto, StatusPedido } from '../../../types/pizzaria';
import { formatarDataHora, formatarMoeda, formatarTelefone, severidadeStatus } from '../../../utils/formatadores';

const STATUS: StatusPedido[] = ['Recebido', 'Em preparo', 'Saiu para entrega', 'Entregue', 'Cancelado'];

const novoPedido = (): Pedido => ({
    cliente_id: null,
    status: 'Recebido',
    data_hora: new Date().toISOString(),
    observacao: '',
    itens: []
});

// Função que calcula o total do pedido (prévia na tela; o valor oficial é calculado pela API) - [Deyvidsk10]
function calcularTotal(itens: PedidoItem[], produtos: Produto[]): number {
    return itens.reduce((total, item) => {
        const preco = produtos.find((p) => p.id === item.produto_id)?.preco ?? item.preco_unitario ?? 0;
        return total + preco * item.quantidade;
    }, 0);
}

const PedidosPage = () => {
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [pedido, setPedido] = useState<Pedido>(novoPedido());
    const [produtoSelecionado, setProdutoSelecionado] = useState<number | null>(null);
    const [quantidade, setQuantidade] = useState<number>(1);
    const [dialogVisivel, setDialogVisivel] = useState(false);
    const [enviado, setEnviado] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [carregando, setCarregando] = useState(true);
    const [filtroGlobal, setFiltroGlobal] = useState('');
    const [filtroStatus, setFiltroStatus] = useState<StatusPedido | null>(null);
    const [linhasExpandidas, setLinhasExpandidas] = useState<DataTableExpandedRows | DataTableValueArray | undefined>(undefined);
    // Cadastro rápido de cliente sem sair do pedido - [Deyvidsk10]
    const [filtroCliente, setFiltroCliente] = useState('');
    const [dialogCliente, setDialogCliente] = useState(false);
    const [clienteRapido, setClienteRapido] = useState({ nome: '', telefone: '' });
    const [salvandoCliente, setSalvandoCliente] = useState(false);
    const dropdownClienteRef = useRef<Dropdown>(null);
    const toast = useRef<Toast>(null);

    const avisar = (severity: 'success' | 'error' | 'warn', detail: string) => {
        toast.current?.show({ severity, summary: severity === 'success' ? 'Sucesso' : severity === 'error' ? 'Erro' : 'Atenção', detail, life: 4000 });
    };

    const carregarPedidos = useCallback(async () => {
        setCarregando(true);
        try {
            setPedidos(await PedidoService.listar());
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Erro', detail: mensagemErro(error), life: 4000 });
        } finally {
            setCarregando(false);
        }
    }, []);

    // Carrega pedidos, clientes e produtos em paralelo - [Deyvidsk10]
    useEffect(() => {
        carregarPedidos();
        Promise.all([ClienteService.listar(), ProdutoService.listar()])
            .then(([c, p]) => {
                setClientes(c);
                setProdutos(p);
            })
            .catch((error) => toast.current?.show({ severity: 'error', summary: 'Erro', detail: mensagemErro(error), life: 4000 }));
    }, [carregarPedidos]);

    const pedidosFiltrados = useMemo(() => (filtroStatus ? pedidos.filter((p) => p.status === filtroStatus) : pedidos), [pedidos, filtroStatus]);
    const totalPrevisto = useMemo(() => calcularTotal(pedido.itens, produtos), [pedido.itens, produtos]);

    // Opções do dropdown de produtos agrupadas por categoria (inclui categorias criadas pelo usuário) - [Deyvidsk10]
    const produtosAgrupados = useMemo(() => {
        const ordem = ['Pizza', 'Bebida', 'Sobremesa'];
        const categorias = Array.from(new Set(produtos.map((p) => p.categoria))).sort((a, b) => {
            const ia = ordem.indexOf(a) === -1 ? 99 : ordem.indexOf(a);
            const ib = ordem.indexOf(b) === -1 ? 99 : ordem.indexOf(b);
            return ia - ib || a.localeCompare(b);
        });
        return categorias.map((categoria) => ({
            label: categoria,
            items: produtos.filter((p) => p.categoria === categoria).map((p) => ({ label: `${p.nome} — ${formatarMoeda(p.preco)}`, value: p.id }))
        }));
    }, [produtos]);

    // Abre o cadastro rápido já com o nome que o atendente digitou na busca - [Deyvidsk10]
    const abrirClienteRapido = () => {
        // hide() existe no componente, mas não está na tipagem do PrimeReact 9 - [Deyvidsk10]
        (dropdownClienteRef.current as unknown as { hide?: () => void } | null)?.hide?.();
        setClienteRapido({ nome: filtroCliente.trim(), telefone: '' });
        setDialogCliente(true);
    };

    const telefoneRapidoValido = !clienteRapido.telefone || clienteRapido.telefone.replace(/\D/g, '').length >= 10;

    // Cria o cliente na API e já seleciona ele no pedido - [Deyvidsk10]
    const salvarClienteRapido = async () => {
        if (!clienteRapido.nome.trim() || !telefoneRapidoValido) return;
        setSalvandoCliente(true);
        try {
            const criado = await ClienteService.criar({
                nome: clienteRapido.nome,
                telefone: clienteRapido.telefone,
                cep: null,
                logradouro: null,
                numero: null,
                complemento: null,
                bairro: null,
                cidade: null,
                uf: null
            });
            setClientes((lista) => [...lista, criado].sort((a, b) => a.nome.localeCompare(b.nome)));
            setPedido((atual) => ({ ...atual, cliente_id: criado.id! }));
            setFiltroCliente('');
            setDialogCliente(false);
            avisar('success', `Cliente "${criado.nome}" cadastrado e selecionado`);
        } catch (error) {
            avisar('error', mensagemErro(error));
        } finally {
            setSalvandoCliente(false);
        }
    };

    // Mensagem da lista de clientes quando a busca não encontra ninguém: oferece cadastrar - [Deyvidsk10]
    const semClienteEncontrado = (
        <div className="flex flex-column gap-2">
            <span>{filtroCliente ? `Nenhum cliente "${filtroCliente}".` : 'Nenhum cliente cadastrado.'}</span>
            <Button type="button" label={filtroCliente ? `Cadastrar "${filtroCliente}"` : 'Cadastrar cliente'} icon="pi pi-user-plus" size="small" onClick={abrirClienteRapido} />
        </div>
    );

    const abrirNovo = () => {
        setPedido(novoPedido());
        setProdutoSelecionado(null);
        setQuantidade(1);
        setEnviado(false);
        setDialogVisivel(true);
    };

    const editar = (p: Pedido) => {
        setPedido({ ...p, observacao: p.observacao ?? '', itens: p.itens.map((i) => ({ ...i })) });
        setProdutoSelecionado(null);
        setQuantidade(1);
        setEnviado(false);
        setDialogVisivel(true);
    };

    const fecharDialog = () => {
        setDialogVisivel(false);
        setEnviado(false);
    };

    // Adiciona um item; se o produto já estiver no pedido, soma a quantidade - [Deyvidsk10]
    const adicionarItem = () => {
        if (!produtoSelecionado || quantidade < 1) return;
        const produto = produtos.find((p) => p.id === produtoSelecionado);
        if (!produto) return;

        setPedido((atual) => {
            const existente = atual.itens.find((i) => i.produto_id === produto.id);
            const itens = existente
                ? atual.itens.map((i) => (i.produto_id === produto.id ? { ...i, quantidade: i.quantidade + quantidade } : i))
                : [...atual.itens, { produto_id: produto.id!, produto_nome: produto.nome, produto_categoria: produto.categoria, quantidade, preco_unitario: produto.preco }];
            return { ...atual, itens };
        });
        setProdutoSelecionado(null);
        setQuantidade(1);
    };

    const alterarQuantidade = (produtoId: number, qtd: number) => {
        setPedido((atual) => ({ ...atual, itens: atual.itens.map((i) => (i.produto_id === produtoId ? { ...i, quantidade: Math.max(1, qtd) } : i)) }));
    };

    const removerItem = (produtoId: number) => {
        setPedido((atual) => ({ ...atual, itens: atual.itens.filter((i) => i.produto_id !== produtoId) }));
    };

    const salvar = async () => {
        setEnviado(true);
        if (!pedido.cliente_id || pedido.itens.length === 0) {
            if (pedido.itens.length === 0) avisar('warn', 'Adicione pelo menos um item ao pedido');
            return;
        }

        setSalvando(true);
        try {
            if (pedido.id) {
                await PedidoService.atualizar(pedido.id, pedido);
                avisar('success', `Pedido #${pedido.id} atualizado`);
            } else {
                const criado = await PedidoService.criar(pedido);
                avisar('success', `Pedido #${criado.id} criado — total ${formatarMoeda(criado.valor_total)}`);
            }
            setDialogVisivel(false);
            await carregarPedidos();
        } catch (error) {
            avisar('error', mensagemErro(error));
        } finally {
            setSalvando(false);
        }
    };

    // Troca rápida de status direto na tabela (PATCH /pedidos/:id/status) - [Deyvidsk10]
    const alterarStatus = async (p: Pedido, status: StatusPedido) => {
        try {
            const atualizado = await PedidoService.alterarStatus(p.id!, status);
            setPedidos((lista) => lista.map((item) => (item.id === atualizado.id ? atualizado : item)));
            avisar('success', `Pedido #${p.id}: ${status}`);
        } catch (error) {
            avisar('error', mensagemErro(error));
        }
    };

    const confirmarExclusao = (p: Pedido) => {
        confirmDialog({
            message: `Deseja excluir o pedido #${p.id} de ${p.cliente_nome}?`,
            header: 'Confirmar exclusão',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sim, excluir',
            rejectLabel: 'Cancelar',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                try {
                    await PedidoService.excluir(p.id!);
                    avisar('success', 'Pedido excluído');
                    await carregarPedidos();
                } catch (error) {
                    avisar('error', mensagemErro(error));
                }
            }
        });
    };

    // ---------- Templates da tabela ---------- - [Deyvidsk10]
    const idTemplate = (p: Pedido) => (
        <>
            <span className="font-bold">#{p.id}</span>
        </>
    );
    const dataTemplate = (p: Pedido) => <>{formatarDataHora(p.data_hora)}</>;
    const clienteTemplate = (p: Pedido) => (
        <>
            <div>
                <div className="font-medium">{p.cliente_nome}</div>
                <small className="text-600">{p.cliente_telefone}</small>
            </div>
        </>
    );
    const itensTemplate = (p: Pedido) => (
        <>
            <span className="text-700">{p.itens.map((i) => `${i.quantidade}x ${i.produto_nome}`).join(', ')}</span>
        </>
    );
    const totalTemplate = (p: Pedido) => (
        <>
            <span className="font-bold">{formatarMoeda(p.valor_total)}</span>
        </>
    );
    const statusTemplate = (p: Pedido) => (
        <>
            <Dropdown
                value={p.status}
                options={STATUS}
                onChange={(e) => alterarStatus(p, e.value)}
                valueTemplate={(s: StatusPedido) => <Tag value={s} severity={severidadeStatus(s)} />}
                itemTemplate={(s: StatusPedido) => <Tag value={s} severity={severidadeStatus(s)} />}
                className="p-inputtext-sm border-none bg-transparent shadow-none"
                aria-label="Alterar status"
            />
        </>
    );
    const acoesTemplate = (p: Pedido) => (
        <div className="flex gap-2">
            <Button icon="pi pi-pencil" rounded severity="success" aria-label="Editar" onClick={() => editar(p)} />
            <Button icon="pi pi-trash" rounded severity="danger" aria-label="Excluir" onClick={() => confirmarExclusao(p)} />
        </div>
    );

    // Detalhe do pedido exibido ao expandir a linha - [Deyvidsk10]
    const detalhePedido = (p: Pedido) => (
        <div className="p-3">
            <h6 className="mt-0">Itens do pedido #{p.id}</h6>
            <DataTable value={p.itens} dataKey="id" size="small">
                <Column field="produto_nome" header="Produto" />
                <Column field="produto_categoria" header="Categoria" />
                <Column field="quantidade" header="Qtd." />
                <Column header="Preço unit." body={(i: PedidoItem) => formatarMoeda(i.preco_unitario)} />
                <Column header="Subtotal" body={(i: PedidoItem) => formatarMoeda(i.subtotal)} />
            </DataTable>
            {p.observacao && (
                <p className="mt-3 mb-0">
                    <i className="pi pi-comment mr-2" />
                    <b>Observação:</b> {p.observacao}
                </p>
            )}
        </div>
    );

    const toolbarDireita = () => <Dropdown value={filtroStatus} options={STATUS} onChange={(e) => setFiltroStatus(e.value)} placeholder="Filtrar por status" showClear className="w-full sm:w-15rem" />;

    const cabecalho = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-2">
            <h5 className="m-0">Pedidos ({pedidosFiltrados.length})</h5>
            <span className="p-input-icon-left">
                <i className="pi pi-search" />
                <InputText type="search" value={filtroGlobal} onChange={(e) => setFiltroGlobal(e.target.value)} placeholder="Buscar cliente..." />
            </span>
        </div>
    );

    const rodapeDialog = (
        <div className="flex flex-column sm:flex-row sm:align-items-center sm:justify-content-between gap-2">
            <span className="text-xl text-left">
                Total: <b>{formatarMoeda(totalPrevisto)}</b>
            </span>
            <div>
                <Button label="Cancelar" icon="pi pi-times" text onClick={fecharDialog} />
                <Button label="Salvar pedido" icon="pi pi-check" loading={salvando} onClick={salvar} />
            </div>
        </div>
    );

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <div className="card">
                    <Toast ref={toast} />
                    <ConfirmDialog />
                    <Toolbar className="mb-4" left={() => <Button label="Novo pedido" icon="pi pi-plus" severity="success" onClick={abrirNovo} />} right={toolbarDireita} />

                    <DataTable
                        value={pedidosFiltrados}
                        dataKey="id"
                        loading={carregando}
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        className="datatable-responsive"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="{first} a {last} de {totalRecords} pedidos"
                        globalFilter={filtroGlobal}
                        globalFilterFields={['cliente_nome', 'cliente_telefone', 'status', 'id']}
                        emptyMessage="Nenhum pedido encontrado."
                        header={cabecalho}
                        expandedRows={linhasExpandidas}
                        onRowToggle={(e) => setLinhasExpandidas(e.data)}
                        rowExpansionTemplate={detalhePedido}
                        responsiveLayout="stack"
                        breakpoint="960px"
                    >
                        <Column expander style={{ width: '3rem' }} />
                        <Column field="id" header="Nº" sortable body={idTemplate} />
                        <Column field="data_hora" header="Data/Hora" sortable body={dataTemplate} headerStyle={{ minWidth: '9rem' }} />
                        <Column field="cliente_nome" header="Cliente" sortable body={clienteTemplate} headerStyle={{ minWidth: '12rem' }} />
                        <Column header="Itens" body={itensTemplate} headerStyle={{ minWidth: '14rem' }} />
                        <Column field="valor_total" header="Total" sortable body={totalTemplate} />
                        <Column field="status" header="Status" sortable body={statusTemplate} headerStyle={{ minWidth: '12rem' }} />
                        <Column body={acoesTemplate} headerStyle={{ minWidth: '8rem' }} />
                    </DataTable>

                    <Dialog
                        visible={dialogVisivel}
                        style={{ width: '820px' }}
                        breakpoints={{ '960px': '90vw', '641px': '100vw' }}
                        header={pedido.id ? `Editar pedido #${pedido.id}` : 'Novo pedido'}
                        modal
                        className="p-fluid"
                        footer={rodapeDialog}
                        onHide={fecharDialog}
                    >
                        <div className="formgrid grid">
                            <div className="field col-12 md:col-6">
                                <label htmlFor="cliente">Cliente *</label>
                                {/* Busca de cliente + botão para cadastrar um novo sem sair do pedido - [Deyvidsk10] */}
                                <div className="p-inputgroup">
                                    <Dropdown
                                        ref={dropdownClienteRef}
                                        inputId="cliente"
                                        value={pedido.cliente_id}
                                        options={clientes}
                                        optionLabel="nome"
                                        optionValue="id"
                                        itemTemplate={(c: Cliente) => (
                                            <div>
                                                <div>{c.nome}</div>
                                                {c.telefone && <small className="text-600">{c.telefone}</small>}
                                            </div>
                                        )}
                                        onChange={(e) => setPedido({ ...pedido, cliente_id: e.value })}
                                        filter
                                        filterBy="nome,telefone"
                                        filterPlaceholder="Digite o nome ou telefone"
                                        onFilter={(e) => setFiltroCliente(e.filter)}
                                        placeholder="Busque ou cadastre o cliente"
                                        emptyFilterMessage={semClienteEncontrado}
                                        emptyMessage={semClienteEncontrado}
                                        className={classNames({ 'p-invalid': enviado && !pedido.cliente_id })}
                                    />
                                    <Button type="button" icon="pi pi-user-plus" severity="info" onClick={abrirClienteRapido} tooltip="Novo cliente" tooltipOptions={{ position: 'top' }} aria-label="Novo cliente" />
                                </div>
                                {enviado && !pedido.cliente_id && <small className="p-error">Selecione o cliente.</small>}
                            </div>
                            <div className="field col-12 sm:col-6 md:col-3">
                                <label htmlFor="data_hora">Data/Hora</label>
                                <Calendar
                                    inputId="data_hora"
                                    value={new Date(pedido.data_hora)}
                                    onChange={(e) => e.value && setPedido({ ...pedido, data_hora: (e.value as Date).toISOString() })}
                                    showTime
                                    hourFormat="24"
                                    dateFormat="dd/mm/yy"
                                    showIcon
                                />
                            </div>
                            <div className="field col-12 sm:col-6 md:col-3">
                                <label htmlFor="status">Status</label>
                                <Dropdown inputId="status" value={pedido.status} options={STATUS} onChange={(e) => setPedido({ ...pedido, status: e.value })} />
                            </div>
                        </div>

                        <Divider align="left">
                            <span className="text-600 font-medium">
                                <i className="pi pi-shopping-bag mr-2" />
                                Itens
                            </span>
                        </Divider>

                        {/* Linha para adicionar um produto ao pedido - [Deyvidsk10] */}
                        <div className="formgrid grid align-items-end">
                            <div className="field col-12 md:col-7">
                                <label htmlFor="produto">Produto</label>
                                <Dropdown
                                    inputId="produto"
                                    value={produtoSelecionado}
                                    options={produtosAgrupados}
                                    optionGroupLabel="label"
                                    optionGroupChildren="items"
                                    onChange={(e) => setProdutoSelecionado(e.value)}
                                    filter
                                    placeholder="Escolha um produto"
                                    emptyFilterMessage="Nenhum produto encontrado"
                                />
                            </div>
                            <div className="field col-6 md:col-2">
                                <label htmlFor="quantidade">Qtd.</label>
                                <InputNumber
                                    inputId="quantidade"
                                    value={quantidade}
                                    onValueChange={(e) => setQuantidade(e.value ?? 1)}
                                    min={1}
                                    max={99}
                                    showButtons
                                    buttonLayout="horizontal"
                                    decrementButtonClassName="p-button-secondary"
                                    incrementButtonClassName="p-button-secondary"
                                    incrementButtonIcon="pi pi-plus"
                                    decrementButtonIcon="pi pi-minus"
                                    inputClassName="text-center"
                                />
                            </div>
                            <div className="field col-6 md:col-3">
                                <Button label="Adicionar" icon="pi pi-plus" severity="info" onClick={adicionarItem} disabled={!produtoSelecionado} />
                            </div>
                        </div>

                        <DataTable value={pedido.itens} dataKey="produto_id" size="small" emptyMessage="Nenhum item adicionado." className={classNames({ 'border-1 border-red-400 border-round': enviado && pedido.itens.length === 0 })}>
                            <Column field="produto_nome" header="Produto" />
                            <Column
                                header="Qtd."
                                body={(i: PedidoItem) => <InputNumber value={i.quantidade} onValueChange={(e) => alterarQuantidade(i.produto_id, e.value ?? 1)} min={1} max={99} inputStyle={{ width: '4rem' }} aria-label="Quantidade" />}
                            />
                            <Column header="Preço" body={(i: PedidoItem) => formatarMoeda(produtos.find((p) => p.id === i.produto_id)?.preco ?? i.preco_unitario)} />
                            <Column header="Subtotal" body={(i: PedidoItem) => formatarMoeda((produtos.find((p) => p.id === i.produto_id)?.preco ?? i.preco_unitario ?? 0) * i.quantidade)} />
                            <Column body={(i: PedidoItem) => <Button icon="pi pi-times" rounded text severity="danger" aria-label="Remover item" onClick={() => removerItem(i.produto_id)} />} style={{ width: '3rem' }} />
                        </DataTable>

                        <div className="field mt-4">
                            <label htmlFor="observacao">Observação</label>
                            <InputTextarea id="observacao" value={pedido.observacao ?? ''} onChange={(e) => setPedido({ ...pedido, observacao: e.target.value })} rows={2} autoResize placeholder="Ex.: sem cebola, troco para R$ 100..." />
                        </div>
                    </Dialog>

                    <Dialog
                        visible={dialogCliente}
                        style={{ width: '420px' }}
                        breakpoints={{ '641px': '92vw' }}
                        header="Novo cliente"
                        modal
                        className="p-fluid"
                        onHide={() => setDialogCliente(false)}
                        footer={
                            <>
                                <Button label="Cancelar" icon="pi pi-times" text onClick={() => setDialogCliente(false)} />
                                <Button label="Cadastrar e usar no pedido" icon="pi pi-check" loading={salvandoCliente} disabled={!clienteRapido.nome.trim() || !telefoneRapidoValido} onClick={salvarClienteRapido} />
                            </>
                        }
                    >
                        <div className="field">
                            <label htmlFor="clienteRapidoNome">Nome *</label>
                            <InputText id="clienteRapidoNome" value={clienteRapido.nome} onChange={(e) => setClienteRapido({ ...clienteRapido, nome: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && salvarClienteRapido()} autoFocus />
                        </div>
                        <div className="field">
                            <label htmlFor="clienteRapidoTelefone">Telefone (opcional)</label>
                            <InputText
                                id="clienteRapidoTelefone"
                                inputMode="tel"
                                value={clienteRapido.telefone}
                                onChange={(e) => setClienteRapido({ ...clienteRapido, telefone: formatarTelefone(e.target.value) })}
                                onKeyDown={(e) => e.key === 'Enter' && salvarClienteRapido()}
                                placeholder="(11) 98888-7777"
                                className={classNames({ 'p-invalid': !telefoneRapidoValido })}
                            />
                            {!telefoneRapidoValido && <small className="p-error">Informe DDD + número.</small>}
                        </div>
                        <small className="text-500">
                            <i className="pi pi-info-circle mr-1" />O endereço pode ser completado depois na tela de Clientes.
                        </small>
                    </Dialog>
                </div>
            </div>
        </div>
    );
};

export default PedidosPage;
