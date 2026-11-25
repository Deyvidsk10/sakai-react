/* eslint-disable @next/next/no-img-element */
'use client';
// Tela de login: envia e-mail/senha para a API e guarda o token JWT - [Deyvidsk10]
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useContext, useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { classNames } from 'primereact/utils';
import { LayoutContext } from '../../../../layout/context/layoutcontext';
import { AuthService } from '../../../../services/authService';
import { mensagemErro } from '../../../../services/api';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState('');
    const [carregando, setCarregando] = useState(false);
    const { layoutConfig } = useContext(LayoutContext);
    const router = useRouter();
    const params = useSearchParams();

    // Se já existe um token válido, pula direto para o dashboard - [Deyvidsk10]
    useEffect(() => {
        if (AuthService.estaAutenticado()) {
            router.replace('/');
        }
    }, [router]);

    const entrar = async (e: React.FormEvent) => {
        e.preventDefault();
        setErro('');
        if (!email || !senha) {
            setErro('Informe e-mail e senha');
            return;
        }
        setCarregando(true);
        try {
            await AuthService.login(email, senha);
            router.replace('/');
        } catch (error) {
            setErro(mensagemErro(error, 'Falha ao entrar'));
        } finally {
            setCarregando(false);
        }
    };

    const containerClassName = classNames('surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden', { 'p-input-filled': layoutConfig.inputStyle === 'filled' });

    return (
        <div className={containerClassName}>
            <div className="flex flex-column align-items-center justify-content-center px-3 w-full">
                <div
                    className="w-full"
                    style={{
                        maxWidth: '36rem',
                        borderRadius: '56px',
                        padding: '0.3rem',
                        background: 'linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)'
                    }}
                >
                    <form onSubmit={entrar} className="w-full surface-card py-7 px-4 sm:px-7" style={{ borderRadius: '53px' }}>
                        <div className="text-center mb-5">
                            <img src="/layout/images/logo-pizzaria.svg" alt="Pizzaria" height="64" className="mb-3" />
                            <div className="text-900 text-3xl font-medium mb-2">Pizzaria</div>
                            <span className="text-600 font-medium">Entre para gerenciar pedidos, clientes e produtos</span>
                        </div>

                        {params.get('expirado') && <Message severity="warn" text="Sua sessão expirou. Entre novamente." className="w-full mb-4" />}
                        {params.get('cadastrado') && <Message severity="success" text="Cadastro realizado! Faça login." className="w-full mb-4" />}
                        {erro && <Message severity="error" text={erro} className="w-full mb-4" />}

                        <label htmlFor="email" className="block text-900 text-xl font-medium mb-2">
                            E-mail
                        </label>
                        <InputText id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className="w-full mb-4" style={{ padding: '1rem' }} />

                        <label htmlFor="senha" className="block text-900 font-medium text-xl mb-2">
                            Senha
                        </label>
                        <Password inputId="senha" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Senha" toggleMask feedback={false} className="w-full mb-5" inputClassName="w-full p-3" />

                        <Button type="submit" label="Entrar" icon="pi pi-sign-in" loading={carregando} className="w-full p-3 text-xl mb-4" />

                        <div className="text-center text-600">
                            Não tem conta?{' '}
                            <Link href="/auth/register" className="font-medium no-underline" style={{ color: 'var(--primary-color)' }}>
                                Cadastre-se
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
