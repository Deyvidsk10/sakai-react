'use client';
// Página do CRUD de Usuários (acesso exclusivo do perfil admin) - [Deyvidsk10]
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { classNames } from 'primereact/utils';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { UsuarioService } from '../../../services/usuarioService';
import { AuthService } from '../../../services/authService';
import { mensagemErro } from '../../../services/api';
import { Usuario } from '../../../types/pizzaria';
import { formatarDataHora } from '../../../utils/formatadores';

const PERFIS = [
    { label: 'Administrador', value: 'admin' },
    { label: 'Atendente', value: 'atendente' }
];

const usuarioVazio: Usuario = { nome: '', email: '', senha: '', perfil: 'atendente' };

const UsuariosPage = () => {
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [usuario, setUsuario] = useState<Usuario>(usuarioVazio);
    const [dialogVisivel, setDialogVisivel] = useState(false);
    const [enviado, setEnviado] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [carregando, setCarregando] = useState(true);
    const [filtroGlobal, setFiltroGlobal] = useState('');
    const [idLogado, setIdLogado] = useState<number | undefined>();
    const toast = useRef<Toast>(null);

    const carregar = useCallback(async () => {
        setCarregando(true);
        try {
            setUsuarios(await UsuarioService.listar());
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Erro', detail: mensagemErro(error), life: 4000 });
        } finally {
            setCarregando(false);
        }
    }, []);

    useEffect(() => {
        setIdLogado(AuthService.getUsuario()?.id);
        carregar();
    }, [carregar]);

    const abrirNovo = () => {
        setUsuario(usuarioVazio);
        setEnviado(false);
        setDialogVisivel(true);
    };

    // Na edição a senha começa vazia: só é trocada se o admin digitar uma nova - [Deyvidsk10]
    const editar = (u: Usuario) => {
        setUsuario({ ...u, senha: '' });
        setEnviado(false);
        setDialogVisivel(true);
    };

    const fecharDialog = () => {
        setDialogVisivel(false);
        setEnviado(false);
    };

    const emailValido = (email: string) => /^\S+@\S+\.\S+$/.test(email);
    const senhaInvalida = () => (!usuario.id && !usuario.senha) || (!!usuario.senha && usuario.senha.length < 6);

    const salvar = async () => {
        setEnviado(true);
        if (!usuario.nome.trim() || !emailValido(usuario.email) || senhaInvalida()) return;

        setSalvando(true);
        try {
            if (usuario.id) {
                await UsuarioService.atualizar(usuario.id, usuario);
                toast.current?.show({ severity: 'success', summary: 'Sucesso', detail: 'Usuário atualizado', life: 3000 });
            } else {
                await UsuarioService.criar(usuario);
                toast.current?.show({ severity: 'success', summary: 'Sucesso', detail: 'Usuário cadastrado', life: 3000 });
            }
            setDialogVisivel(false);
            await carregar();
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Erro', detail: mensagemErro(error), life: 4000 });
        } finally {
            setSalvando(false);
        }
    };

    const confirmarExclusao = (u: Usuario) => {
        confirmDialog({
            message: `Deseja excluir o usuário "${u.nome}"?`,
            header: 'Confirmar exclusão',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sim, excluir',
            rejectLabel: 'Cancelar',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                try {
                    await UsuarioService.excluir(u.id!);
                    toast.current?.show({ severity: 'success', summary: 'Sucesso', detail: 'Usuário excluído', life: 3000 });
                    await carregar();
                } catch (error) {
                    toast.current?.show({ severity: 'error', summary: 'Erro', detail: mensagemErro(error), life: 4000 });
                }
            }
        });
    };

    const nomeTemplate = (u: Usuario) => (
        <>
            <span className="font-medium">{u.nome}</span>
            {u.id === idLogado && <Tag value="você" className="ml-2" severity="info" />}
        </>
    );
    const emailTemplate = (u: Usuario) => <>{u.email}</>;
    const perfilTemplate = (u: Usuario) => (
        <>
            <Tag value={u.perfil === 'admin' ? 'Administrador' : 'Atendente'} severity={u.perfil === 'admin' ? 'danger' : 'success'} icon={u.perfil === 'admin' ? 'pi pi-shield' : 'pi pi-user'} />
        </>
    );
    const criadoTemplate = (u: Usuario) => (
        <>
            {/* A data do SQLite vem em UTC sem fuso; o "Z" faz o navegador converter para o horário local - [Deyvidsk10] */}
            {u.criado_em ? formatarDataHora(u.criado_em.replace(' ', 'T') + 'Z') : ''}
        </>
    );
    const acoesTemplate = (u: Usuario) => (
        <div className="flex gap-2">
            <Button icon="pi pi-pencil" rounded severity="success" aria-label="Editar" onClick={() => editar(u)} />
            {/* O próprio usuário logado não pode se excluir - [Deyvidsk10] */}
            <Button icon="pi pi-trash" rounded severity="danger" aria-label="Excluir" disabled={u.id === idLogado} onClick={() => confirmarExclusao(u)} />
        </div>
    );

    const cabecalho = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-2">
            <h5 className="m-0">Usuários do sistema ({usuarios.length})</h5>
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
                    <Toolbar className="mb-4" left={() => <Button label="Novo usuário" icon="pi pi-plus" severity="success" onClick={abrirNovo} />} />

                    <DataTable
                        value={usuarios}
                        dataKey="id"
                        loading={carregando}
                        paginator
                        rows={10}
                        className="datatable-responsive"
                        currentPageReportTemplate="{first} a {last} de {totalRecords} usuários"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
                        globalFilter={filtroGlobal}
                        globalFilterFields={['nome', 'email', 'perfil']}
                        emptyMessage="Nenhum usuário encontrado."
                        header={cabecalho}
                        responsiveLayout="stack"
                        breakpoint="960px"
                    >
                        <Column field="nome" header="Nome" sortable body={nomeTemplate} headerStyle={{ minWidth: '12rem' }} />
                        <Column field="email" header="E-mail" sortable body={emailTemplate} headerStyle={{ minWidth: '14rem' }} />
                        <Column field="perfil" header="Perfil" sortable body={perfilTemplate} />
                        <Column field="criado_em" header="Criado em" sortable body={criadoTemplate} />
                        <Column body={acoesTemplate} headerStyle={{ minWidth: '8rem' }} />
                    </DataTable>

                    <Dialog visible={dialogVisivel} style={{ width: '480px' }} breakpoints={{ '641px': '95vw' }} header={usuario.id ? 'Editar usuário' : 'Novo usuário'} modal className="p-fluid" footer={rodapeDialog} onHide={fecharDialog}>
                        <div className="field">
                            <label htmlFor="nome">Nome *</label>
                            <InputText id="nome" value={usuario.nome} onChange={(e) => setUsuario({ ...usuario, nome: e.target.value })} autoFocus className={classNames({ 'p-invalid': enviado && !usuario.nome.trim() })} />
                            {enviado && !usuario.nome.trim() && <small className="p-error">O nome é obrigatório.</small>}
                        </div>
                        <div className="field">
                            <label htmlFor="email">E-mail (login) *</label>
                            <InputText id="email" type="email" value={usuario.email} onChange={(e) => setUsuario({ ...usuario, email: e.target.value })} className={classNames({ 'p-invalid': enviado && !emailValido(usuario.email) })} />
                            {enviado && !emailValido(usuario.email) && <small className="p-error">Informe um e-mail válido.</small>}
                        </div>
                        <div className="field">
                            <label htmlFor="senha">{usuario.id ? 'Nova senha (deixe em branco para manter)' : 'Senha *'}</label>
                            <Password
                                inputId="senha"
                                value={usuario.senha ?? ''}
                                onChange={(e) => setUsuario({ ...usuario, senha: e.target.value })}
                                toggleMask
                                feedback={false}
                                autoComplete="new-password"
                                className={classNames({ 'p-invalid': enviado && senhaInvalida() })}
                            />
                            {enviado && senhaInvalida() && <small className="p-error">A senha deve ter pelo menos 6 caracteres.</small>}
                        </div>
                        <div className="field">
                            <label htmlFor="perfil">Perfil *</label>
                            <Dropdown inputId="perfil" value={usuario.perfil} options={PERFIS} onChange={(e) => setUsuario({ ...usuario, perfil: e.value })} />
                        </div>
                    </Dialog>
                </div>
            </div>
        </div>
    );
};

export default UsuariosPage;
