// Conexão com o SQLite, criação das tabelas e funções auxiliares com Promise - [Deyvidsk10]
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

// Caminho absoluto para o arquivo do banco (funciona independente da pasta de onde o servidor é iniciado) - [Deyvidsk10]
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'pizzaria.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco:', err.message);
    } else {
        console.log('Banco SQLite conectado em', DB_PATH);
    }
});

// Executa INSERT/UPDATE/DELETE e devolve lastID e changes - [Deyvidsk10]
function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) return reject(err);
            resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
}

// Busca uma única linha - [Deyvidsk10]
function get(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
    });
}

// Busca várias linhas - [Deyvidsk10]
function all(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
    });
}

// Executa um bloco de operações dentro de uma transação (tudo ou nada) - [Deyvidsk10]
let filaTransacao = Promise.resolve();
function transaction(callback) {
    // Encadeia as transações para que nunca rodem ao mesmo tempo na mesma conexão - [Deyvidsk10]
    const execucao = filaTransacao.then(async () => {
        await run('BEGIN TRANSACTION');
        try {
            const resultado = await callback();
            await run('COMMIT');
            return resultado;
        } catch (err) {
            await run('ROLLBACK');
            throw err;
        }
    });
    filaTransacao = execucao.catch(() => {});
    return execucao;
}

// Bancos criados antes das categorias personalizadas tinham um CHECK que só aceitava
// Pizza/Bebida/Sobremesa. O SQLite não remove CHECK, então a tabela é recriada sem ele,
// mantendo todos os produtos e os mesmos IDs (os pedidos continuam apontando certo) - [Deyvidsk10]
async function migrarProdutosSemCheckDeCategoria() {
    const tabela = await get("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'produtos'");
    if (!tabela || !/CHECK\s*\(\s*categoria\s+IN/i.test(tabela.sql)) return;

    console.log('Migrando tabela produtos para aceitar novas categorias...');
    // Chaves estrangeiras desligadas durante a troca da tabela (procedimento oficial do SQLite) - [Deyvidsk10]
    await run('PRAGMA foreign_keys = OFF');
    try {
        await transaction(async () => {
            await run(`
                CREATE TABLE produtos_nova (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nome TEXT NOT NULL,
                    descricao TEXT,
                    preco REAL NOT NULL CHECK (preco >= 0),
                    categoria TEXT NOT NULL,
                    criado_em TEXT NOT NULL DEFAULT (datetime('now'))
                )
            `);
            await run('INSERT INTO produtos_nova (id, nome, descricao, preco, categoria, criado_em) SELECT id, nome, descricao, preco, categoria, criado_em FROM produtos');
            await run('DROP TABLE produtos');
            await run('ALTER TABLE produtos_nova RENAME TO produtos');
        });
    } finally {
        await run('PRAGMA foreign_keys = ON');
    }
    console.log('Migração concluída');
}

// Bancos antigos só aceitavam os perfis admin/atendente. Recria a tabela "usuarios"
// com o perfil "cliente" liberado, mantendo todos os usuários e IDs - [Deyvidsk10]
async function migrarUsuariosComPerfilCliente() {
    const tabela = await get("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'usuarios'");
    if (!tabela || tabela.sql.includes("'cliente'")) return;

    console.log('Migrando tabela usuarios para aceitar o perfil cliente...');
    await transaction(async () => {
        await run(`
            CREATE TABLE usuarios_nova (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                senha TEXT NOT NULL,
                perfil TEXT NOT NULL DEFAULT 'cliente' CHECK (perfil IN ('admin', 'atendente', 'cliente')),
                criado_em TEXT NOT NULL DEFAULT (datetime('now'))
            )
        `);
        await run('INSERT INTO usuarios_nova (id, nome, email, senha, perfil, criado_em) SELECT id, nome, email, senha, perfil, criado_em FROM usuarios');
        await run('DROP TABLE usuarios');
        await run('ALTER TABLE usuarios_nova RENAME TO usuarios');
    });
    console.log('Migração concluída');
}

// Cria as tabelas (se ainda não existirem) e o usuário administrador padrão - [Deyvidsk10]
async function initDatabase() {
    await run('PRAGMA foreign_keys = ON');

    await run(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            senha TEXT NOT NULL,
            perfil TEXT NOT NULL DEFAULT 'cliente' CHECK (perfil IN ('admin', 'atendente', 'cliente')),
            criado_em TEXT NOT NULL DEFAULT (datetime('now'))
        )
    `);

    await run(`
        CREATE TABLE IF NOT EXISTS clientes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            telefone TEXT NOT NULL,
            cep TEXT,
            logradouro TEXT,
            numero TEXT,
            complemento TEXT,
            bairro TEXT,
            cidade TEXT,
            uf TEXT,
            criado_em TEXT NOT NULL DEFAULT (datetime('now'))
        )
    `);

    // Categorias de produtos (Pizza, Bebida, Sobremesa e as criadas pelo usuário) - [Deyvidsk10]
    // COLLATE NOCASE impede duplicar "pizza" e "Pizza" - [Deyvidsk10]
    await run(`
        CREATE TABLE IF NOT EXISTS categorias (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL UNIQUE COLLATE NOCASE,
            criado_em TEXT NOT NULL DEFAULT (datetime('now'))
        )
    `);

    await run(`
        CREATE TABLE IF NOT EXISTS produtos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            descricao TEXT,
            preco REAL NOT NULL CHECK (preco >= 0),
            categoria TEXT NOT NULL,
            criado_em TEXT NOT NULL DEFAULT (datetime('now'))
        )
    `);

    await run(`
        CREATE TABLE IF NOT EXISTS pedidos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
            status TEXT NOT NULL DEFAULT 'Recebido',
            valor_total REAL NOT NULL DEFAULT 0,
            data_hora TEXT NOT NULL,
            observacao TEXT
        )
    `);

    // Itens do pedido guardam o preço do momento da venda (se o produto mudar de preço, o pedido antigo não muda) - [Deyvidsk10]
    await run(`
        CREATE TABLE IF NOT EXISTS pedido_itens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
            produto_id INTEGER NOT NULL REFERENCES produtos(id) ON DELETE RESTRICT,
            quantidade INTEGER NOT NULL CHECK (quantidade > 0),
            preco_unitario REAL NOT NULL,
            subtotal REAL NOT NULL
        )
    `);

    await migrarProdutosSemCheckDeCategoria();
    await migrarUsuariosComPerfilCliente();

    // Categorias padrão + qualquer categoria que já exista nos produtos - [Deyvidsk10]
    // (só insere o que falta, para não "gastar" IDs a cada reinício) - [Deyvidsk10]
    for (const nome of ['Pizza', 'Bebida', 'Sobremesa']) {
        await run('INSERT INTO categorias (nome) SELECT ? WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nome = ?)', [nome, nome]);
    }
    await run(`
        INSERT INTO categorias (nome)
        SELECT DISTINCT p.categoria FROM produtos p
        WHERE NOT EXISTS (SELECT 1 FROM categorias c WHERE c.nome = p.categoria)
    `);

    // Garante que exista ao menos um administrador para o primeiro login - [Deyvidsk10]
    const totalUsuarios = await get('SELECT COUNT(*) AS total FROM usuarios');
    if (totalUsuarios.total === 0) {
        const nome = process.env.ADMIN_NOME || 'Administrador';
        const email = process.env.ADMIN_EMAIL || 'admin@pizzaria.com';
        const senha = process.env.ADMIN_SENHA || 'admin123';
        const hash = await bcrypt.hash(senha, 10);
        await run('INSERT INTO usuarios (nome, email, senha, perfil) VALUES (?, ?, ?, ?)', [nome, email, hash, 'admin']);
        console.log(`Usuário admin criado: ${email}`);
    }

    // Cardápio inicial para o sistema não começar vazio (só roda com a tabela vazia) - [Deyvidsk10]
    const totalProdutos = await get('SELECT COUNT(*) AS total FROM produtos');
    if (totalProdutos.total === 0) {
        const cardapio = [
            ['Pizza Margherita', 'Molho de tomate, mussarela, tomate e manjericão', 54.9, 'Pizza'],
            ['Pizza Calabresa', 'Molho de tomate, mussarela, calabresa e cebola', 49.9, 'Pizza'],
            ['Pizza Quatro Queijos', 'Mussarela, provolone, parmesão e gorgonzola', 59.9, 'Pizza'],
            ['Pizza Portuguesa', 'Presunto, ovos, cebola, ervilha e azeitona', 57.9, 'Pizza'],
            ['Refrigerante 2L', 'Coca-Cola, Guaraná ou Fanta', 14.0, 'Bebida'],
            ['Suco Natural 500ml', 'Laranja, limão ou maracujá', 9.5, 'Bebida'],
            ['Pizza de Chocolate', 'Chocolate ao leite com morangos', 44.9, 'Sobremesa'],
            ['Petit Gâteau', 'Bolo de chocolate com sorvete de creme', 22.0, 'Sobremesa']
        ];
        for (const [nome, descricao, preco, categoria] of cardapio) {
            await run('INSERT INTO produtos (nome, descricao, preco, categoria) VALUES (?, ?, ?, ?)', [nome, descricao, preco, categoria]);
        }
        console.log('Cardápio inicial cadastrado');
    }

    console.log('Tabelas verificadas/criadas com sucesso');
}

module.exports = { db, run, get, all, transaction, initDatabase };
