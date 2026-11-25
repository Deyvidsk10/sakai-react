/* eslint-disable @next/next/no-img-element */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { classNames } from 'primereact/utils';
import React, { forwardRef, useContext, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { AppTopbarRef } from '../types/types';
import { LayoutContext } from './context/layoutcontext';
import { AuthService } from '../services/authService';
import { Usuario } from '../types/pizzaria';

const AppTopbar = forwardRef<AppTopbarRef>((props, ref) => {
    const { layoutState, onMenuToggle, showProfileSidebar } = useContext(LayoutContext);
    const menubuttonRef = useRef(null);
    const topbarmenuRef = useRef(null);
    const topbarmenubuttonRef = useRef(null);
    const router = useRouter();
    const [usuario, setUsuario] = useState<Usuario | null>(null);

    useImperativeHandle(ref, () => ({
        menubutton: menubuttonRef.current,
        topbarmenu: topbarmenuRef.current,
        topbarmenubutton: topbarmenubuttonRef.current
    }));

    // Lê o usuário logado salvo no login - [Deyvidsk10]
    useEffect(() => {
        setUsuario(AuthService.getUsuario());
    }, []);

    // Sai do sistema: apaga o token e volta para o login - [Deyvidsk10]
    const sair = () => {
        AuthService.logout();
        router.replace('/auth/login');
    };

    return (
        <div className="layout-topbar">
            <Link href="/" className="layout-topbar-logo">
                <img src="/layout/images/logo-pizzaria.svg" width="40px" height={'40px'} alt="logo" />
                <span>Pizzaria</span>
            </Link>

            <button ref={menubuttonRef} type="button" className="p-link layout-menu-button layout-topbar-button" onClick={onMenuToggle}>
                <i className="pi pi-bars" />
            </button>

            <button ref={topbarmenubuttonRef} type="button" className="p-link layout-topbar-menu-button layout-topbar-button" onClick={showProfileSidebar}>
                <i className="pi pi-ellipsis-v" />
            </button>

            <div ref={topbarmenuRef} className={classNames('layout-topbar-menu', { 'layout-topbar-menu-mobile-active': layoutState.profileSidebarVisible })}>
                {usuario && (
                    <div className="flex align-items-center gap-2 px-3 text-700" title={usuario.email}>
                        <i className="pi pi-user" />
                        <span className="font-medium">{usuario.nome}</span>
                        <span className="text-sm text-500">({usuario.perfil})</span>
                    </div>
                )}
                <button type="button" className="p-link layout-topbar-button" onClick={sair} title="Sair">
                    <i className="pi pi-sign-out"></i>
                    <span>Sair</span>
                </button>
            </div>
        </div>
    );
});

AppTopbar.displayName = 'AppTopbar';

export default AppTopbar;
