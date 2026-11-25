// Tipos das entidades da Pizzaria (espelham as respostas da API) - [Deyvidsk10]

// admin: tudo | atendente: operação da pizzaria | cliente: só vê o cardápio - [Deyvidsk10]
export type Perfil = 'admin' | 'atendente' | 'cliente';

export interface Usuario {
    id?: number;
    nome: string;
    email: string;
    perfil: Perfil;
    senha?: string;
    criado_em?: string;
}

export interface Cliente {
    id?: number;
    nome: string;
    telefone: string;
    cep: string | null;
    logradouro: string | null;
    numero: string | null;
    complemento: string | null;
    bairro: string | null;
    cidade: string | null;
    uf: string | null;
}

// Nome da categoria (Pizza, Bebida, Sobremesa ou outra criada pelo usuário) - [Deyvidsk10]
export type Categoria = string;

export interface CategoriaProduto {
    id?: number;
    nome: string;
    total_produtos?: number;
}

export interface Produto {
    id?: number;
    nome: string;
    descricao: string | null;
    preco: number;
    categoria: Categoria;
}

export type StatusPedido = 'Recebido' | 'Em preparo' | 'Saiu para entrega' | 'Entregue' | 'Cancelado';

export interface PedidoItem {
    id?: number;
    produto_id: number;
    produto_nome?: string;
    produto_categoria?: Categoria;
    quantidade: number;
    preco_unitario?: number;
    subtotal?: number;
}

export interface Pedido {
    id?: number;
    cliente_id: number | null;
    cliente_nome?: string;
    cliente_telefone?: string;
    status: StatusPedido;
    valor_total?: number;
    data_hora: string;
    observacao: string | null;
    itens: PedidoItem[];
}

export interface ResumoDashboard {
    totalClientes: number;
    totalProdutos: number;
    totalPedidos: number;
    faturamento: number;
    pedidosPorStatus: { status: StatusPedido; total: number }[];
    ultimosPedidos: Pedido[];
}

// Respostas das APIs públicas de endereço - [Deyvidsk10]
export interface EstadoIBGE {
    id: number;
    sigla: string;
    nome: string;
}

export interface MunicipioIBGE {
    id: number;
    nome: string;
}

export interface EnderecoViaCep {
    cep: string;
    logradouro: string;
    complemento: string;
    bairro: string;
    localidade: string;
    uf: string;
    erro?: boolean | string;
}
