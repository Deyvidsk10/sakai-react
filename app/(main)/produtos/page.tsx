'use client';
// Página do CRUD de Produtos (pizzas, bebidas, sobremesas e novas categorias) integrada à API via Axios - [Deyvidsk10]
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { classNames } from 'primereact/utils';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ProdutoService } from '../../../services/produtoService';
import { CategoriaService } from '../../../services/categoriaService';
import { mensagemErro } from '../../../services/api';
import { Categoria, CategoriaProduto, Produto } from '../../../types/pizzaria';
import { formatarMoeda } from '../../../utils/formatadores';

// Ícone e cor das categorias padrão; categorias novas usam uma etiqueta genérica - [Deyvidsk10]
const ESTILO_CATEGORIA: Record<string, { icone: string; cor: 'warning' | 'info' | 'success' }> = {
    Pizza: { icone: 'pi pi-circle-fill', cor: 'warning' },
    Bebida: { icone: 'pi pi-filter-fill', cor: 'info' },
    Sobremesa: { icone: 'pi pi-star-fill', cor: 'success' }
};

const produtoVazio: Produto = { nome: '', descricao: '', preco: 0, categoria: 'Pizza' };

const ProdutosPage = () => {
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [produto, setProduto] = useState<Produto>(produtoVazio);
    const [dialogVisivel, setDialogVisivel] = useState(false);
    const [enviado, setEnviado] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [carregando, setCarregando] = useState(true);
    const [filtroGlobal, setFiltroGlobal] = useState('');
    const [filtroCategoria, setFiltroCategoria] = useState<Categoria | null>(null);
    const [categorias, setCategorias] = useState<CategoriaProduto[]>([]);
    const [dialogCategoria, setDialogCategoria] = useState(false);
    const [novaCategoria, setNovaCategoria] = useState('');
    const [salvandoCategoria, setSalvandoCategoria] = useState(false);
    const toast = useRef<Toast>(null);

    // Busca os produtos na API - [Deyvidsk10]
    const carregar = useCallback(async () => {
        setCarregando(true);
        try {
            setProdutos(await ProdutoService.listar());
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Erro', detail: mensagemErro(error), life: 4000 });
        } finally {
            setCarregando(false);
        }
    }, []);

    // Busca as categorias cadastradas (usadas no formulário e no filtro) - [Deyvidsk10]
    const carregarCategorias = useCallback(async () => {
        try {
            setCategorias(await CategoriaService.listar());
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Erro', detail: mensagemErro(error), life: 4000 });
        }
    }, []);

    useEffect(() => {
        carregar();
        carregarCategorias();
    }, [carregar, carregarCategorias]);

    const nomesCategorias = useMemo(() => categorias.map((c) => c.nome), [categorias]);

    const abrirNovaCategoria = () => {
        setNovaCategoria('');
        setDialogCategoria(true);
    };

    // Cria a categoria na API e já deixa ela selecionada no produto - [Deyvidsk10]
    const salvarCategoria = async () => {
        if (!novaCategoria.trim()) return;
        setSalvandoCategoria(true);
        try {
            const criada = await CategoriaService.criar(novaCategoria);
            await carregarCategorias();
            setProduto((atual) => ({ ...atual, categoria: criada.nome }));
            setDialogCategoria(false);
            toast.current?.show({ severity: 'success', summary: 'Sucesso', detail: `Categoria "${criada.nome}" criada`, life: 3000 });
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Erro', detail: mensagemErro(error), life: 4000 });
        } finally {
            setSalvandoCategoria(false);
        }
    };

    // Aplica o filtro de categoria escolhido na lista - [Deyvidsk10]
    const produtosFiltrados = useMemo(() => (filtroCategoria ? produtos.filter((p) => p.categoria === filtroCategoria) : produtos), [produtos, filtroCategoria]);

    const abrirNovo = () => {
        setProduto(produtoVazio);
        setEnviado(false);
        setDialogVisivel(true);
    };

    const editar = (p: Produto) => {
        setProduto({ ...p, descricao: p.descricao ?? '' });
        setEnviado(false);
        setDialogVisivel(true);
    };

    const fecharDialog = () => {
        setDialogVisivel(false);
        setEnviado(false);
    };

    // Cria ou atualiza conforme o produto já tenha ID - [Deyvidsk10]
    const salvar = async () => {
        setEnviado(true);
        if (!produto.nome.trim() || !(produto.preco > 0) || !produto.categoria) return;

        setSalvando(true);
        try {
            if (produto.id) {
                await ProdutoService.atualizar(produto.id, produto);
                toast.current?.show({ severity: 'success', summary: 'Sucesso', detail: 'Produto atualizado', life: 3000 });
            } else {
                await ProdutoService.criar(produto);
                toast.current?.show({ severity: 'success', summary: 'Sucesso', detail: 'Produto cadastrado', life: 3000 });
            }
            setDialogVisivel(false);
            await carregar();
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Erro', detail: mensagemErro(error), life: 4000 });
        } finally {
            setSalvando(false);
        }
    };

    const confirmarExclusao = (p: Produto) => {
        confirmDialog({
            message: `Deseja excluir o produto "${p.nome}"?`,
            header: 'Confirmar exclusão',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sim, excluir',
            rejectLabel: 'Cancelar',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                try {
                    await ProdutoService.excluir(p.id!);
                    toast.current?.show({ severity: 'success', summary: 'Sucesso', detail: 'Produto excluído', life: 3000 });
                    await carregar();
                } catch (error) {
                    toast.current?.show({ severity: 'error', summary: 'Erro', detail: mensagemErro(error), life: 5000 });
                }
            }
        });
    };

    // Templates das colunas (o span p-column-title aparece no layout empilhado do celular) - [Deyvidsk10]
    const nomeTemplate = (p: Produto) => (
        <>
            <span className="font-medium">{p.nome}</span>
        </>
    );
    const descricaoTemplate = (p: Produto) => (
        <>
            <span className="text-600">{p.descricao}</span>
        </>
    );
    const precoTemplate = (p: Produto) => <>{formatarMoeda(p.preco)}</>;
    const categoriaTemplate = (p: Produto) => {
        const estilo = ESTILO_CATEGORIA[p.categoria];
        return <Tag value={p.categoria} icon={estilo?.icone ?? 'pi pi-tag'} severity={estilo?.cor} />;
    };
    const acoesTemplate = (p: Produto) => (
        <div className="flex gap-2">
            <Button icon="pi pi-pencil" rounded severity="success" aria-label="Editar" onClick={() => editar(p)} />
            <Button icon="pi pi-trash" rounded severity="danger" aria-label="Excluir" onClick={() => confirmarExclusao(p)} />
        </div>
    );

    const toolbarEsquerda = () => <Button label="Novo produto" icon="pi pi-plus" severity="success" onClick={abrirNovo} />;
    // Filtro em lista (cabe qualquer quantidade de categorias) - [Deyvidsk10]
    const toolbarDireita = () => <Dropdown value={filtroCategoria} options={nomesCategorias} onChange={(e) => setFiltroCategoria(e.value)} placeholder="Filtrar por categoria" showClear className="w-full sm:w-15rem" />;

    const cabecalho = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-2">
            <h5 className="m-0">Cardápio ({produtosFiltrados.length})</h5>
            <span className="p-input-icon-left">
                <i className="pi pi-search" />
                <InputText type="search" value={filtroGlobal} onChange={(e) => setFiltroGlobal(e.target.value)} placeholder="Buscar..." />
            </span>
        </div>
    );

    const rodapeDialog = (
        <>
            <Button label="Cancelar" icon="pi pi-times" text onClick={fecharDialog} />
            <Button label="Salvar" icon="pi pi-check" loading={salvando} onClick={salvar} />
        </>
    );

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <div className="card">
                    <Toast ref={toast} />
                    <ConfirmDialog />
                    <Toolbar className="mb-4" left={toolbarEsquerda} right={toolbarDireita} />

                    <DataTable
                        value={produtosFiltrados}
                        dataKey="id"
                        loading={carregando}
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        className="datatable-responsive"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="{first} a {last} de {totalRecords} produtos"
                        globalFilter={filtroGlobal}
                        globalFilterFields={['nome', 'descricao', 'categoria']}
                        emptyMessage="Nenhum produto encontrado."
                        header={cabecalho}
                        responsiveLayout="stack"
                        breakpoint="960px"
                    >
                        <Column field="nome" header="Nome" sortable body={nomeTemplate} headerStyle={{ minWidth: '12rem' }} />
                        <Column field="descricao" header="Descrição" body={descricaoTemplate} headerStyle={{ minWidth: '16rem' }} />
                        <Column field="preco" header="Preço" sortable body={precoTemplate} />
                        <Column field="categoria" header="Categoria" sortable body={categoriaTemplate} />
                        <Column body={acoesTemplate} headerStyle={{ minWidth: '8rem' }} />
                    </DataTable>

                    <Dialog visible={dialogVisivel} style={{ width: '480px' }} breakpoints={{ '641px': '95vw' }} header={produto.id ? 'Editar produto' : 'Novo produto'} modal className="p-fluid" footer={rodapeDialog} onHide={fecharDialog}>
                        <div className="field">
                            <label htmlFor="nome">Nome *</label>
                            <InputText id="nome" value={produto.nome} onChange={(e) => setProduto({ ...produto, nome: e.target.value })} autoFocus className={classNames({ 'p-invalid': enviado && !produto.nome.trim() })} />
                            {enviado && !produto.nome.trim() && <small className="p-error">O nome é obrigatório.</small>}
                        </div>
                        <div className="field">
                            <label htmlFor="descricao">Descrição</label>
                            <InputTextarea id="descricao" value={produto.descricao ?? ''} onChange={(e) => setProduto({ ...produto, descricao: e.target.value })} rows={3} autoResize />
                        </div>
                        <div className="formgrid grid">
                            <div className="field col-12 sm:col-6">
                                <label htmlFor="preco">Preço *</label>
                                <InputNumber
                                    inputId="preco"
                                    // Campo vazio (em vez de "R$ 0,00") para o usuário conseguir digitar direto - [Deyvidsk10]
                                    value={produto.preco || null}
                                    onValueChange={(e) => setProduto({ ...produto, preco: e.value ?? 0 })}
                                    mode="currency"
                                    currency="BRL"
                                    locale="pt-BR"
                                    min={0}
                                    placeholder="R$ 0,00"
                                    // Seleciona o valor ao clicar: o que for digitado substitui o preço antigo - [Deyvidsk10]
                                    onFocus={(e) => {
                                        const campo = e.target;
                                        setTimeout(() => campo.select(), 0);
                                    }}
                                    className={classNames({ 'p-invalid': enviado && !(produto.preco > 0) })}
                                />
                                {enviado && !(produto.preco > 0) && <small className="p-error">Informe o preço.</small>}
                            </div>
                            <div className="field col-12 sm:col-6">
                                <label htmlFor="categoria">Categoria *</label>
                                {/* Lista de categorias + botão para criar uma nova sem sair do formulário - [Deyvidsk10] */}
                                <div className="p-inputgroup">
                                    <Dropdown
                                        inputId="categoria"
                                        value={produto.categoria}
                                        options={nomesCategorias}
                                        onChange={(e) => setProduto({ ...produto, categoria: e.value })}
                                        placeholder="Selecione"
                                        className={classNames({ 'p-invalid': enviado && !produto.categoria })}
                                    />
                                    <Button icon="pi pi-plus" severity="info" onClick={abrirNovaCategoria} tooltip="Nova categoria" tooltipOptions={{ position: 'top' }} aria-label="Nova categoria" />
                                </div>
                            </div>
                        </div>
                    </Dialog>

                    <Dialog
                        visible={dialogCategoria}
                        style={{ width: '380px' }}
                        breakpoints={{ '641px': '90vw' }}
                        header="Nova categoria"
                        modal
                        className="p-fluid"
                        onHide={() => setDialogCategoria(false)}
                        footer={
                            <>
                                <Button label="Cancelar" icon="pi pi-times" text onClick={() => setDialogCategoria(false)} />
                                <Button label="Criar" icon="pi pi-check" loading={salvandoCategoria} disabled={!novaCategoria.trim()} onClick={salvarCategoria} />
                            </>
                        }
                    >
                        <div className="field">
                            <label htmlFor="novaCategoria">Nome da categoria</label>
                            {/* Enter também cria a categoria - [Deyvidsk10] */}
                            <InputText
                                id="novaCategoria"
                                value={novaCategoria}
                                onChange={(e) => setNovaCategoria(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && salvarCategoria()}
                                placeholder="Ex.: Esfiha, Calzone, Porções..."
                                maxLength={40}
                                autoFocus
                            />
                            <small className="text-500">Categorias atuais: {nomesCategorias.join(', ')}</small>
                        </div>
                    </Dialog>
                </div>
            </div>
        </div>
    );
};

export default ProdutosPage;
