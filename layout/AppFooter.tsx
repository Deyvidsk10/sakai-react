/* eslint-disable @next/next/no-img-element */

import React from 'react';

// Rodapé do sistema - [Deyvidsk10]
const AppFooter = () => {
    return (
        <div className="layout-footer">
            <img src="/layout/images/logo-pizzaria.svg" alt="Logo" height="20" className="mr-2" />
            <span className="font-medium">Pizzaria</span>
            <span className="ml-2 text-600">— Sistema de Gestão © {new Date().getFullYear()}</span>
        </div>
    );
};

export default AppFooter;
