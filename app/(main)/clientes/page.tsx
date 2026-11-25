'use client';
// Página do CRUD de Clientes com endereço via ViaCEP e estados/municípios via IBGE - [Deyvidsk10]
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Divider } from 'primereact/divider';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { classNames } from 'primereact/utils';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ClienteService } from '../../../services/clienteService';
import { LocalidadeService } from '../../../services/localidadeService';
import { mensagemErro } from '../../../services/api';
import { Cliente, EstadoIBGE, MunicipioIBGE } from '../../../types/pizzaria';
import { formatarCep, formatarTelefone } from '../../../utils/formatadores';

const clienteVazio: Cliente = {
    nome: '',
    telefone: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: ''
};

const ClientesPage = () => {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [cliente, setCliente] = useState<Cliente>(clienteVazio);
    const [estados, setEstados] = useState<EstadoIBGE[]>([]);
    const [municipios, setMunicipios] = useState<MunicipioIBGE[]>([]);
    const [dialogVisivel, setDialogVisivel] = useState(false);
    const [enviado, setEnviado] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [carregando, setCarregando] = useState(true);
    const [buscandoCep, setBuscandoCep] = useState(false);
    const [carregandoMunicipios, setCarregandoMunicipios] = useState(false);
    const [filtroGlobal, setFiltroGlobal] = useState('');
    const toast = useRef<Toast>(null);

    const avisar = (severity: 'success' | 'error' | 'warn' | 'info', detail: string) => {
        toast.current?.show({ severity, summary: severity === 'success' ? 'Sucesso' : severity === 'error' ? 'Erro' : 'Atenção', detail, life: 4000 });
    };

    const carregar = useCallback(async () => {
        setCarregando(true);
        try {
            setClientes(await ClienteService.listar());
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Erro', detail: mensagemErro(error), life: 4000 });
        } finally {
            setCarregando(false);
        }
    }, []);

    // Carrega clientes da API e a lista de estados do IBGE ao abrir a página - [Deyvidsk10]
    useEffect(() => {
        carregar();
        LocalidadeService.estados()
            .then(setEstados)
            .catch(() => toast.current?.show({ severity: 'warn', summary: 'IBGE', detail: 'Não foi possível carregar os estados', life: 4000 }));
    }, [carregar]);

    // Busca os municípios do IBGE sempre que a UF muda - [Deyvidsk10]
    const carregarMunicipios = async (uf: string | null) => {
        setMunicipios([]);
        if (!uf) return;
        setCarregandoMunicipios(true);
        try {
            setMunicipios(await LocalidadeService.municipios(uf));
        } catch {
            avisar('warn', 'Não foi possível carregar os municípios');
        } finally {
            setCarregandoMunicipios(false);
        }
    };

    const alterarCampo = (campo: keyof Cliente, valor: string | null) => {
        setCliente((atual) => ({ ...atual, [campo]: valor }));
    };

    // Ao trocar o estado manualmente, limpa a cidade e recarrega os municípios - [Deyvidsk10]
    const alterarUf = (uf: string) => {
        setCliente((atual) => ({ ...atual, uf, cidade: '' }));
        carregarMunicipios(uf);
    };

    // Quando o CEP é digitado por completo, consulta o ViaCEP e preenche o endereço - [Deyvidsk10]
    const buscarCep = async (cep: string) => {
        setBuscandoCep(true);
        try {
            const endereco = await LocalidadeService.buscarCep(cep);
            if (!endereco) {
                avisar('warn', 'CEP não encontrado. Preencha o endereço manualmente.');
                return;
            }
            setCliente((atual) => ({
                ...atual,
                logradouro: endereco.logradouro || atual.logradouro,
                bairro: endereco.bairro || atual.bairro,
                complemento: atual.complemento || endereco.complemento,
                uf: endereco.uf,
                cidade: endereco.localidade
            }));
            await carregarMunicipios(endereco.uf);
        } catch {
            avisar('error', 'Falha ao consultar o ViaCEP');
        } finally {
            setBuscandoCep(false);
        }
    };

    // Formata o CEP e, quando tiver 8 dígitos (e for diferente do anterior), consulta o ViaCEP - [Deyvidsk10]
    const alterarCep = (valor: string) => {
        const cep = formatarCep(valor);
        const anterior = (cliente.cep ?? '').replace(/\D/g, '');
        alterarCampo('cep', cep);
        const digitos = cep.replace(/\D/g, '');
        if (digitos.length === 8 && digitos !== anterior) {
            buscarCep(cep);
        }
    };

    const abrirNovo = () => {
        setCliente(clienteVazio);
        setMunicipios([]);
        setEnviado(false);
        setDialogVisivel(true);
    };

    const editar = (c: Cliente) => {
        // Troca null por string vazia para os inputs controlados - [Deyvidsk10]
        const copia = Object.fromEntries(Object.entries(c).map(([k, v]) => [k, v ?? ''])) as unknown as Cliente;
        setCliente(copia);
        setEnviado(false);
        setDialogVisivel(true);
        carregarMunicipios(c.uf);
    };

    const fecharDialog = () => {
        setDialogVisivel(false);
        setEnviado(false);
    };

    const telefoneValido = (tel: string) => tel.replace(/\D/g, '').length >= 10;

    const salvar = async () => {
        setEnviado(true);
        if (!cliente.nome.trim() || !telefoneValido(cliente.telefone)) return;

        setSalvando(true);
        try {
            if (cliente.id) {
                await ClienteService.atualizar(cliente.id, cliente);
                avisar('success', 'Cliente atualizado');
            } else {
                await ClienteService.criar(cliente);
                avisar('success', 'Cliente cadastrado');
            }
            setDialogVisivel(false);
            await carregar();
        } catch (error) {
            avisar('error', mensagemErro(error));
        } finally {
            setSalvando(false);
        }
    };

    const confirmarExclusao = (c: Cliente) => {
        confirmDialog({
            message: `Deseja excluir o cliente "${c.nome}"?`,
            header: 'Confirmar exclusão',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sim, excluir',
            rejectLabel: 'Cancelar',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                try {
                    await ClienteService.excluir(c.id!);
                    avisar('success', 'Cliente excluído');
                    await carregar();
                } catch (error) {
                    avisar('error', mensagemErro(error));
                }
            }
        });
    };

    // Monta o endereço em uma linha para a tabela - [Deyvidsk10]
    const enderecoTemplate = (c: Cliente) => {
        const rua = [c.logradouro, c.numero].filter(Boolean).join(', ');
        const local = [c.bairro, c.cidade && c.uf ? `${c.cidade}/${c.uf}` : c.cidade || c.uf].filter(Boolean).join(' - ');
        return (
            <>
                <div>
                    <div>{rua || <span className="text-500">Sem endereço</span>}</div>
                    <small className="text-600">
                        {local}
                        {c.cep ? ` • CEP ${c.cep}` : ''}
                    </small>
                </div>
            </>
        );
    };
    const nomeTemplate = (c: Cliente) => (
        <>
            <span className="font-medium">{c.nome}</span>
        </>
    );
    const telefoneTemplate = (c: Cliente) => (
        <>
            <a href={`tel:${c.telefone.replace(/\D/g, '')}`} className="no-underline">
                <i className="pi pi-phone mr-1 text-sm" />
                {c.telefone}
            </a>
        </>
    );
    const acoesTemplate = (c: Cliente) => (
        <div className="flex gap-2">
            <Button icon="pi pi-pencil" rounded severity="success" aria-label="Editar" onClick={() => editar(c)} />
            <Button icon="pi pi-trash" rounded severity="danger" aria-label="Excluir" onClick={() => confirmarExclusao(c)} />
        </div>
    );

    const cabecalho = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-2">
            <h5 className="m-0">Clientes ({clientes.length})</h5>
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
                    <Toolbar className="mb-4" left={() => <Button label="Novo cliente" icon="pi pi-plus" severity="success" onClick={abrirNovo} />} />

                    <DataTable
                        value={clientes}
                        dataKey="id"
                        loading={carregando}
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        className="datatable-responsive"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="{first} a {last} de {totalRecords} clientes"
                        globalFilter={filtroGlobal}
                        globalFilterFields={['nome', 'telefone', 'logradouro', 'bairro', 'cidade', 'uf', 'cep']}
                        emptyMessage="Nenhum cliente encontrado."
                        header={cabecalho}
                        responsiveLayout="stack"
                        breakpoint="960px"
                    >
                        <Column field="nome" header="Nome" sortable body={nomeTemplate} headerStyle={{ minWidth: '12rem' }} />
                        <Column field="telefone" header="Telefone" body={telefoneTemplate} headerStyle={{ minWidth: '10rem' }} />
                        <Column field="cidade" header="Endereço" sortable body={enderecoTemplate} headerStyle={{ minWidth: '18rem' }} />
                        <Column body={acoesTemplate} headerStyle={{ minWidth: '8rem' }} />
                    </DataTable>

                    <Dialog
                        visible={dialogVisivel}
                        style={{ width: '720px' }}
                        breakpoints={{ '960px': '85vw', '641px': '95vw' }}
                        header={cliente.id ? 'Editar cliente' : 'Novo cliente'}
                        modal
                        className="p-fluid"
                        footer={rodapeDialog}
                        onHide={fecharDialog}
                    >
                        <div className="formgrid grid">
                            <div className="field col-12 md:col-7">
                                <label htmlFor="nome">Nome *</label>
                                <InputText id="nome" value={cliente.nome} onChange={(e) => alterarCampo('nome', e.target.value)} autoFocus className={classNames({ 'p-invalid': enviado && !cliente.nome.trim() })} />
                                {enviado && !cliente.nome.trim() && <small className="p-error">O nome é obrigatório.</small>}
                            </div>
                            <div className="field col-12 md:col-5">
                                <label htmlFor="telefone">Telefone *</label>
                                <InputText
                                    id="telefone"
                                    inputMode="tel"
                                    value={cliente.telefone}
                                    onChange={(e) => alterarCampo('telefone', formatarTelefone(e.target.value))}
                                    placeholder="(11) 98888-7777"
                                    className={classNames({ 'p-invalid': enviado && !telefoneValido(cliente.telefone) })}
                                />
                                {enviado && !telefoneValido(cliente.telefone) && <small className="p-error">Informe DDD + número.</small>}
                            </div>
                        </div>

                        <Divider align="left">
                            <span className="text-600 font-medium">
                                <i className="pi pi-map-marker mr-2" />
                                Endereço
                            </span>
                        </Divider>

                        <div className="formgrid grid">
                            <div className="field col-12 md:col-4">
                                <label htmlFor="cep">CEP</label>
                                <span className="p-input-icon-right">
                                    {buscandoCep && <i className="pi pi-spin pi-spinner" />}
                                    {/* Formata enquanto digita e consulta o ViaCEP ao completar os 8 dígitos - [Deyvidsk10] */}
                                    <InputText id="cep" inputMode="numeric" value={cliente.cep ?? ''} onChange={(e) => alterarCep(e.target.value)} placeholder="00000-000" />
                                </span>
                                <small className="text-500">O endereço é preenchido pelo ViaCEP</small>
                            </div>
                            <div className="field col-12 md:col-8">
                                <label htmlFor="logradouro">Logradouro</label>
                                <InputText id="logradouro" value={cliente.logradouro ?? ''} onChange={(e) => alterarCampo('logradouro', e.target.value)} />
                            </div>
                            <div className="field col-6 md:col-3">
                                <label htmlFor="numero">Número</label>
                                <InputText id="numero" value={cliente.numero ?? ''} onChange={(e) => alterarCampo('numero', e.target.value)} />
                            </div>
                            <div className="field col-6 md:col-4">
                                <label htmlFor="complemento">Complemento</label>
                                <InputText id="complemento" value={cliente.complemento ?? ''} onChange={(e) => alterarCampo('complemento', e.target.value)} />
                            </div>
                            <div className="field col-12 md:col-5">
                                <label htmlFor="bairro">Bairro</label>
                                <InputText id="bairro" value={cliente.bairro ?? ''} onChange={(e) => alterarCampo('bairro', e.target.value)} />
                            </div>
                            <div className="field col-12 md:col-5">
                                <label htmlFor="uf">Estado (IBGE)</label>
                                <Dropdown
                                    inputId="uf"
                                    value={cliente.uf}
                                    options={estados}
                                    optionValue="sigla"
                                    optionLabel="nome"
                                    itemTemplate={(e: EstadoIBGE) => `${e.sigla} - ${e.nome}`}
                                    onChange={(e) => alterarUf(e.value)}
                                    filter
                                    filterBy="nome,sigla"
                                    placeholder="Selecione o estado"
                                    emptyFilterMessage="Nenhum estado encontrado"
                                />
                            </div>
                            <div className="field col-12 md:col-7">
                                <label htmlFor="cidade">Município (IBGE)</label>
                                <Dropdown
                                    inputId="cidade"
                                    value={cliente.cidade}
                                    options={municipios}
                                    optionValue="nome"
                                    optionLabel="nome"
                                    onChange={(e) => alterarCampo('cidade', e.value)}
                                    filter
                                    disabled={!cliente.uf}
                                    placeholder={carregandoMunicipios ? 'Carregando municípios...' : cliente.uf ? 'Selecione o município' : 'Escolha o estado primeiro'}
                                    emptyFilterMessage="Nenhum município encontrado"
                                    virtualScrollerOptions={{ itemSize: 38 }}
                                />
                            </div>
                        </div>
                    </Dialog>
                </div>
            </div>
        </div>
    );
};

export default ClientesPage;
