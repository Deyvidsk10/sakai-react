/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useState } from 'react';
import AppMenuitem from './AppMenuitem';
import { MenuProvider } from './context/menucontext';
import { AppMenuItem } from '../types/types';
import { AuthService } from '../services/authService';
import { API_URL } from '../services/api';
import { Perfil } from '../types/pizzaria';

// Menu lateral da pizzaria, montado conforme o perfil do usuário - [Deyvidsk10]
const AppMenu = () => {
    const [perfil, setPerfil] = useState<Perfil | undefined>();

    useEffect(() => {
        setPerfil(AuthService.getUsuario()?.perfil);
    }, []);

    // Perfil cliente: só o cardápio - [Deyvidsk10]
    const menuCliente: AppMenuItem[] = [
        {
            label: 'Pizzaria',
            items: [{ label: 'Cardápio', icon: 'pi pi-fw pi-book', to: '/cardapio' }]
        }
    ];

    const menuEquipe: AppMenuItem[] = [
        {
            label: 'Início',
            items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/' }]
        },
        {
            label: 'Pizzaria',
            items: [
                { label: 'Pedidos', icon: 'pi pi-fw pi-shopping-cart', to: '/pedidos' },
                { label: 'Clientes', icon: 'pi pi-fw pi-users', to: '/clientes' },
                { label: 'Produtos', icon: 'pi pi-fw pi-box', to: '/produtos' }
            ]
        },
        {
            label: 'Administração',
            visible: perfil === 'admin',
            items: [{ label: 'Usuários', icon: 'pi pi-fw pi-id-card', to: '/usuarios' }]
        },
        {
            label: 'API',
            items: [
                // Abre a documentação Swagger servida pelo backend - [Deyvidsk10]
                { label: 'Documentação (Swagger)', icon: 'pi pi-fw pi-book', url: `${API_URL}/api-docs/`, target: '_blank' }
            ]
        }
    ];

    const model = perfil === 'cliente' ? menuCliente : menuEquipe;

    return (
        <MenuProvider>
            <ul className="layout-menu">
                {model.map((item, i) => {
                    return !item?.seperator ? <AppMenuitem item={item} root={true} index={i} key={item.label} /> : <li className="menu-separator"></li>;
                })}
            </ul>
        </MenuProvider>
    );
};

export default AppMenu;
