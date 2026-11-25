/* eslint-disable @next/next/no-img-element */
'use client';
// Tela de cadastro público (cria usuário com perfil "atendente") - [Deyvidsk10]
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useContext, useState } from 'react';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { classNames } from 'primereact/utils';
import { LayoutContext } from '../../../../layout/context/layoutcontext';
import { AuthService } from '../../../../services/authService';
import { mensagemErro } from '../../../../services/api';

const RegisterPage = () => {
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [confirmacao, setConfirmacao] = useState('');
    const [erro, setErro] = useState('');
    const [carregando, setCarregando] = useState(false);
    const { layoutConfig } = useContext(LayoutContext);
    const router = useRouter();

    // Validação simples antes de chamar a API - [Deyvidsk10]
    const cadastrar = async (e: React.FormEvent) => {
        e.preventDefault();
        setErro('');
        if (!nome.trim() || !email.trim() || !senha) return setErro('Preencha todos os campos');
        if (senha.length < 6) return setErro('A senha deve ter pelo menos 6 caracteres');
        if (senha !== confirmacao) return setErro('As senhas não conferem');

        setCarregando(true);
        try {
            await AuthService.registrar(nome, email, senha);
            router.replace('/auth/login?cadastrado=1');
        } catch (error) {
            setErro(mensagemErro(error, 'Falha ao cadastrar'));
        } finally {
            setCarregando(false);
        }
    };

    const containerClassName = classNames('surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden', { 'p-input-filled': layoutConfig.inputStyle === 'filled' });

    return (
        <div className={containerClassName}>
            <div className="flex flex-column align-items-center justify-content-center px-3 py-5 w-full">
                <form onSubmit={cadastrar} className="w-full surface-card py-6 px-4 sm:px-6 shadow-2" style={{ borderRadius: '32px', maxWidth: '34rem' }}>
                    <div className="text-center mb-5">
                        <img src="/layout/images/logo-pizzaria.svg" alt="Pizzaria" height="56" className="mb-3" />
                        <div className="text-900 text-3xl font-medium mb-2">Criar conta</div>
                        <span className="text-600 font-medium">Novos usuários entram com perfil de atendente</span>
                    </div>

                    {erro && <Message severity="error" text={erro} className="w-full mb-4" />}

                    <label htmlFor="nome" className="block text-900 font-medium mb-2">
                        Nome
                    </label>
                    <InputText id="nome" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full mb-3 p-3" />

                    <label htmlFor="email" className="block text-900 font-medium mb-2">
                        E-mail
                    </label>
                    <InputText id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mb-3 p-3" />

                    <label htmlFor="senha" className="block text-900 font-medium mb-2">
                        Senha
                    </label>
                    <Password
                        inputId="senha"
                        autoComplete="new-password"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        toggleMask
                        className="w-full mb-3"
                        inputClassName="w-full p-3"
                        promptLabel="Digite uma senha"
                        weakLabel="Fraca"
                        mediumLabel="Média"
                        strongLabel="Forte"
                    />

                    <label htmlFor="confirmacao" className="block text-900 font-medium mb-2">
                        Confirmar senha
                    </label>
                    <Password inputId="confirmacao" autoComplete="new-password" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} toggleMask feedback={false} className="w-full mb-5" inputClassName="w-full p-3" />

                    <Button type="submit" label="Cadastrar" icon="pi pi-user-plus" loading={carregando} className="w-full p-3 text-lg mb-4" />

                    <div className="text-center text-600">
                        Já tem conta?{' '}
                        <Link href="/auth/login" className="font-medium no-underline" style={{ color: 'var(--primary-color)' }}>
                            Entrar
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegisterPage;
