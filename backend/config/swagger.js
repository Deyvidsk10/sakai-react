// Configuração da documentação Swagger (OpenAPI 3) lida dos comentários das rotas - [Deyvidsk10]
const path = require('path');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API Pizzaria',
            version: '1.0.0',
            description: 'API REST da Pizzaria com autenticação JWT. Faça login em **/auth/login**, copie o token e clique em **Authorize**.'
        },
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            },
            schemas: {
                Usuario: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        nome: { type: 'string', example: 'Maria Souza' },
                        email: { type: 'string', example: 'maria@pizzaria.com' },
                        perfil: { type: 'string', enum: ['admin', 'atendente'], example: 'atendente' },
                        criado_em: { type: 'string', example: '2026-11-25 18:00:00' }
                    }
                },
                UsuarioInput: {
                    type: 'object',
                    required: ['nome', 'email', 'senha'],
                    properties: {
                        nome: { type: 'string', example: 'Maria Souza' },
                        email: { type: 'string', example: 'maria@pizzaria.com' },
                        senha: { type: 'string', example: '123456', description: 'Obrigatória ao criar; opcional ao atualizar' },
                        perfil: { type: 'string', enum: ['admin', 'atendente'], example: 'atendente' }
                    }
                },
                Cliente: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        nome: { type: 'string', example: 'João da Silva' },
                        telefone: { type: 'string', example: '(11) 98888-7777' },
                        cep: { type: 'string', example: '01001-000' },
                        logradouro: { type: 'string', example: 'Praça da Sé' },
                        numero: { type: 'string', example: '100' },
                        complemento: { type: 'string', example: 'Apto 12' },
                        bairro: { type: 'string', example: 'Sé' },
                        cidade: { type: 'string', example: 'São Paulo' },
                        uf: { type: 'string', example: 'SP' }
                    }
                },
                ClienteInput: {
                    type: 'object',
                    required: ['nome', 'telefone'],
                    properties: {
                        nome: { type: 'string', example: 'João da Silva' },
                        telefone: { type: 'string', example: '(11) 98888-7777' },
                        cep: { type: 'string', example: '01001-000' },
                        logradouro: { type: 'string', example: 'Praça da Sé' },
                        numero: { type: 'string', example: '100' },
                        complemento: { type: 'string', example: 'Apto 12' },
                        bairro: { type: 'string', example: 'Sé' },
                        cidade: { type: 'string', example: 'São Paulo' },
                        uf: { type: 'string', example: 'SP' }
                    }
                },
                Produto: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        nome: { type: 'string', example: 'Pizza Calabresa' },
                        descricao: { type: 'string', example: 'Molho, mussarela, calabresa e cebola' },
                        preco: { type: 'number', example: 49.9 },
                        categoria: { type: 'string', enum: ['Pizza', 'Bebida', 'Sobremesa'], example: 'Pizza' }
                    }
                },
                ProdutoInput: {
                    type: 'object',
                    required: ['nome', 'preco', 'categoria'],
                    properties: {
                        nome: { type: 'string', example: 'Pizza Calabresa' },
                        descricao: { type: 'string', example: 'Molho, mussarela, calabresa e cebola' },
                        preco: { type: 'number', example: 49.9 },
                        categoria: { type: 'string', enum: ['Pizza', 'Bebida', 'Sobremesa'], example: 'Pizza' }
                    }
                },
                PedidoItem: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        produto_id: { type: 'integer', example: 1 },
                        produto_nome: { type: 'string', example: 'Pizza Calabresa' },
                        quantidade: { type: 'integer', example: 2 },
                        preco_unitario: { type: 'number', example: 49.9 },
                        subtotal: { type: 'number', example: 99.8 }
                    }
                },
                Pedido: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        cliente_id: { type: 'integer', example: 1 },
                        cliente_nome: { type: 'string', example: 'João da Silva' },
                        status: { type: 'string', enum: ['Recebido', 'Em preparo', 'Saiu para entrega', 'Entregue', 'Cancelado'], example: 'Recebido' },
                        valor_total: { type: 'number', example: 99.8 },
                        data_hora: { type: 'string', example: '2026-11-25T20:30:00.000Z' },
                        observacao: { type: 'string', example: 'Sem cebola' },
                        itens: { type: 'array', items: { $ref: '#/components/schemas/PedidoItem' } }
                    }
                },
                PedidoInput: {
                    type: 'object',
                    required: ['cliente_id', 'itens'],
                    properties: {
                        cliente_id: { type: 'integer', example: 1 },
                        status: { type: 'string', enum: ['Recebido', 'Em preparo', 'Saiu para entrega', 'Entregue', 'Cancelado'], example: 'Recebido' },
                        data_hora: { type: 'string', example: '2026-11-25T20:30:00.000Z', description: 'Opcional, padrão = agora' },
                        observacao: { type: 'string', example: 'Sem cebola' },
                        itens: {
                            type: 'array',
                            description: 'O preço é buscado no cadastro do produto e o valor total é calculado pela API',
                            items: {
                                type: 'object',
                                required: ['produto_id', 'quantidade'],
                                properties: {
                                    produto_id: { type: 'integer', example: 1 },
                                    quantidade: { type: 'integer', example: 2 }
                                }
                            }
                        }
                    }
                },
                Erro: {
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'Mensagem de erro' }
                    }
                }
            }
        },
        security: [{ BearerAuth: [] }]
    },
    // Lê os blocos @swagger de todas as rotas - [Deyvidsk10]
    apis: [path.join(__dirname, '..', 'routes', '*.js')]
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = { swaggerUi, swaggerSpec };
