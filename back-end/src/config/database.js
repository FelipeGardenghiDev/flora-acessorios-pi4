const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

let pool = null;
let useFallback = false;
let fallbackData = null;
const fallbackFilePath = process.env.VERCEL 
  ? path.join('/tmp', 'flora_store.json') 
  : path.join(__dirname, '../../data/flora_store.json');

// Dados iniciais para o modo fallback / Render
const defaultSeed = {
  usuarios: [
    {
      id: 1,
      nome: 'Administrador Flora',
      email: 'admin@flora.com',
      senha: '$2b$10$W4dieZ6iwgaKsJLSmh5bN.flTCvTHSuzvUHnCqeoKn5P8PhCFQx9a',
      is_verified: 1,
      token_verificacao: null,
      token_reset: null,
      criado_em: new Date().toISOString()
    }
  ],
  funcionario: [
    { id_func: 1, nome: 'Mariana', sobrenome: 'Silva', cpf: '123.456.789-01', admissao: '2025-01-15', desligamento: null },
    { id_func: 2, nome: 'Lucas', sobrenome: 'Oliveira', cpf: '234.567.890-12', admissao: '2025-02-01', desligamento: null },
    { id_func: 3, nome: 'Beatriz', sobrenome: 'Santos', cpf: '345.678.901-23', admissao: '2025-03-10', desligamento: null },
    { id_func: 4, nome: 'Felipe', sobrenome: 'Gardenghi', cpf: '456.789.012-34', admissao: '2025-01-10', desligamento: null }
  ],
  categorias: [
    { id: 1, nome: 'Anéis', slug: 'aneis' },
    { id: 2, nome: 'Brincos', slug: 'brincos' },
    { id: 3, nome: 'Colares', slug: 'colares' },
    { id: 4, nome: 'Pulseiras', slug: 'pulseiras' },
    { id: 5, nome: 'Braceletes', slug: 'braceletes' }
  ],
  produto: [
    { id_prod: 'ANE-001', categoria: 'Anéis', descricao: 'Anel Solitário Prata 925 com Zircônia', valor: 129.90, estoque: 42, estoque_minimo: 10 },
    { id_prod: 'ANE-002', categoria: 'Anéis', descricao: 'Anel Falange Regulável Dourado', valor: 79.90, estoque: 18, estoque_minimo: 12 },
    { id_prod: 'ANE-003', categoria: 'Anéis', descricao: 'Anel Três Fios Folheado a Ouro 18k', valor: 159.00, estoque: 8, estoque_minimo: 10 },
    { id_prod: 'BRI-001', categoria: 'Brincos', descricao: 'Brinco Argola Cravejada Zircônias', valor: 89.90, estoque: 65, estoque_minimo: 15 },
    { id_prod: 'BRI-002', categoria: 'Brincos', descricao: 'Brinco Ponto de Luz Prata 925', valor: 49.90, estoque: 80, estoque_minimo: 20 },
    { id_prod: 'BRI-003', categoria: 'Brincos', descricao: 'Brinco Cascata Pérolas Barrocas', valor: 119.50, estoque: 14, estoque_minimo: 10 },
    { id_prod: 'COL-001', categoria: 'Colares', descricao: 'Colar Gravatinha com Zircônias', valor: 149.90, estoque: 31, estoque_minimo: 10 },
    { id_prod: 'COL-002', categoria: 'Colares', descricao: 'Colar Choker Elos Dourados', valor: 189.00, estoque: 25, estoque_minimo: 8 },
    { id_prod: 'PUL-001', categoria: 'Pulseiras', descricao: 'Pulseira Riviera Cristal Regulável', valor: 139.90, estoque: 38, estoque_minimo: 12 },
    { id_prod: 'BRA-001', categoria: 'Braceletes', descricao: 'Bracelete Rígido Minimalista Prata', valor: 169.00, estoque: 19, estoque_minimo: 10 },
    { id_prod: 'BRA-002', categoria: 'Braceletes', descricao: 'Bracelete Folheado Ondulado', valor: 199.90, estoque: 6, estoque_minimo: 8 }
  ],
  venda_cab: [
    { id_venda: 1, id_func: 1, data_venda: '2026-09-01', valor_total: 219.80 },
    { id_venda: 2, id_func: 2, data_venda: '2026-09-05', valor_total: 189.00 },
    { id_venda: 3, id_func: 3, data_venda: '2026-09-12', valor_total: 338.90 },
    { id_venda: 4, id_func: 4, data_venda: '2026-09-18', valor_total: 299.80 },
    { id_venda: 5, id_func: 1, data_venda: '2026-09-25', valor_total: 129.90 },
    { id_venda: 6, id_func: 2, data_venda: '2026-10-01', valor_total: 278.90 },
    { id_venda: 7, id_func: 3, data_venda: '2026-10-03', valor_total: 149.90 },
    { id_venda: 8, id_func: 4, data_venda: '2026-10-06', valor_total: 418.80 }
  ],
  venda_item: [
    { id_item: 1, id_venda: 1, id_prod: 'ANE-001', quantidade: 1, valor_unit: 129.90 },
    { id_item: 2, id_venda: 1, id_prod: 'BRI-001', quantidade: 1, valor_unit: 89.90 },
    { id_item: 3, id_venda: 2, id_prod: 'COL-002', quantidade: 1, valor_unit: 189.00 },
    { id_item: 4, id_venda: 3, id_prod: 'PUL-001', quantidade: 1, valor_unit: 139.90 },
    { id_item: 5, id_venda: 3, id_prod: 'BRA-002', quantidade: 1, valor_unit: 199.90 },
    { id_item: 6, id_venda: 4, id_prod: 'COL-001', quantidade: 2, valor_unit: 149.90 },
    { id_item: 7, id_venda: 5, id_prod: 'ANE-001', quantidade: 1, valor_unit: 129.90 },
    { id_item: 8, id_venda: 6, id_prod: 'BRI-001', quantidade: 1, valor_unit: 89.90 },
    { id_item: 9, id_venda: 6, id_prod: 'COL-002', quantidade: 1, valor_unit: 189.00 },
    { id_item: 10, id_venda: 7, id_prod: 'COL-001', quantidade: 1, valor_unit: 149.90 },
    { id_item: 11, id_venda: 8, id_prod: 'BRA-001', quantidade: 1, valor_unit: 169.00 },
    { id_item: 12, id_venda: 8, id_prod: 'ANE-003', quantidade: 1, valor_unit: 159.00 },
    { id_item: 13, id_venda: 8, id_prod: 'BRI-001', quantidade: 1, valor_unit: 89.90 }
  ],
  demand_records: [
    { id: 1, product_sku: 'ANE-001', date: '2026-09-10', units_sold: 4 },
    { id: 2, product_sku: 'ANE-001', date: '2026-09-15', units_sold: 5 },
    { id: 3, product_sku: 'ANE-001', date: '2026-09-20', units_sold: 6 },
    { id: 4, product_sku: 'ANE-001', date: '2026-09-25', units_sold: 5 },
    { id: 5, product_sku: 'ANE-001', date: '2026-09-30', units_sold: 7 },
    { id: 6, product_sku: 'ANE-001', date: '2026-10-05', units_sold: 8 },
    { id: 7, product_sku: 'BRI-001', date: '2026-09-10', units_sold: 8 },
    { id: 8, product_sku: 'BRI-001', date: '2026-09-15', units_sold: 7 },
    { id: 9, product_sku: 'BRI-001', date: '2026-09-20', units_sold: 10 },
    { id: 10, product_sku: 'BRI-001', date: '2026-09-25', units_sold: 9 },
    { id: 11, product_sku: 'BRI-001', date: '2026-09-30', units_sold: 11 },
    { id: 12, product_sku: 'BRI-001', date: '2026-10-05', units_sold: 12 },
    { id: 13, product_sku: 'COL-001', date: '2026-09-10', units_sold: 3 },
    { id: 14, product_sku: 'COL-001', date: '2026-09-15', units_sold: 4 },
    { id: 15, product_sku: 'COL-001', date: '2026-09-20', units_sold: 5 },
    { id: 16, product_sku: 'COL-001', date: '2026-09-25', units_sold: 4 },
    { id: 17, product_sku: 'COL-001', date: '2026-09-30', units_sold: 6 },
    { id: 18, product_sku: 'COL-001', date: '2026-10-05', units_sold: 7 },
    { id: 19, product_sku: 'PUL-001', date: '2026-09-10', units_sold: 2 },
    { id: 20, product_sku: 'PUL-001', date: '2026-09-15', units_sold: 3 },
    { id: 21, product_sku: 'PUL-001', date: '2026-09-20', units_sold: 4 },
    { id: 22, product_sku: 'PUL-001', date: '2026-09-25', units_sold: 5 },
    { id: 23, product_sku: 'PUL-001', date: '2026-09-30', units_sold: 4 },
    { id: 24, product_sku: 'PUL-001', date: '2026-10-05', units_sold: 6 },
    { id: 25, product_sku: 'BRA-001', date: '2026-09-10', units_sold: 1 },
    { id: 26, product_sku: 'BRA-001', date: '2026-09-15', units_sold: 2 },
    { id: 27, product_sku: 'BRA-001', date: '2026-09-20', units_sold: 3 },
    { id: 28, product_sku: 'BRA-001', date: '2026-09-25', units_sold: 2 },
    { id: 29, product_sku: 'BRA-001', date: '2026-09-30', units_sold: 4 },
    { id: 30, product_sku: 'BRA-001', date: '2026-10-05', units_sold: 5 }
  ],
  messages: [
    { id: 1, user_name: 'Coordenação Flora', user_email: 'coordenacao@flora.com', text: 'Boas-vindas à versão 4.0 do sistema Flora Acessórios! Estoque e dashboard sincronizados.', created_at: '2026-09-01 09:00:00' },
    { id: 2, user_name: 'Mariana Silva', user_email: 'mariana@flora.com', text: 'Aviso: Anel Solitário ANE-001 com alta saída na última semana.', created_at: '2026-10-02 14:30:00' },
    { id: 3, user_name: 'Lucas Oliveira', user_email: 'lucas@flora.com', text: 'Reposição de brincos e colares recebida no estoque central.', created_at: '2026-10-06 11:15:00' }
  ],
  favourites: []
};

function initFallback() {
  useFallback = true;
  const dataDir = path.dirname(fallbackFilePath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(fallbackFilePath)) {
    fs.writeFileSync(fallbackFilePath, JSON.stringify(defaultSeed, null, 2), 'utf-8');
    fallbackData = JSON.parse(JSON.stringify(defaultSeed));
  } else {
    try {
      fallbackData = JSON.parse(fs.readFileSync(fallbackFilePath, 'utf-8'));
    } catch {
      fallbackData = JSON.parse(JSON.stringify(defaultSeed));
    }
  }
}

function saveFallback() {
  if (useFallback && fallbackData) {
    try {
      fs.writeFileSync(fallbackFilePath, JSON.stringify(fallbackData, null, 2), 'utf-8');
    } catch (e) {
      console.error('[Fallback DB] Erro ao persistir dados:', e.message);
    }
  }
}

async function connectDatabase() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = Number(process.env.DB_PORT) || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '';
  const database = process.env.DB_NAME || 'flora_acessorios';

  try {
    const tempPool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 2000
    });

    // Testar conexão
    const conn = await tempPool.getConnection();
    conn.release();
    pool = tempPool;
    useFallback = false;
    console.log(`[Database] Conectado com sucesso ao MySQL (${host}:${port}/${database}).`);
  } catch (err) {
    console.warn(`[Database] MySQL não disponível em ${host}:${port} (${err.code || err.message}).`);
    console.log('[Database] Ativando modo de dados integrado e resiliente (persistência em JSON local/nuvem).');
    initFallback();
  }
}

async function query(sql, params = []) {
  if (!useFallback && pool) {
    try {
      const [rows] = await pool.query(sql, params);
      return rows;
    } catch (err) {
      console.error('[MySQL Error]', err.message);
      throw err;
    }
  }

  // Fallback engine para quando não houver MySQL (Render ou máquina sem XAMPP ligado)
  return executeFallbackQuery(sql, params);
}

// Simulador de consultas SQL essenciais para o modo Fallback
function executeFallbackQuery(sql, params = []) {
  const lower = sql.trim().toLowerCase();

  // SELECT * FROM usuarios WHERE email = ?
  if (lower.startsWith('select') && lower.includes('from usuarios')) {
    if (lower.includes('email = ?')) {
      const email = params[0];
      return fallbackData.usuarios.filter(u => u.email.toLowerCase() === String(email).toLowerCase());
    }
    if (lower.includes('token_verificacao = ?')) {
      return fallbackData.usuarios.filter(u => u.token_verificacao === params[0]);
    }
    if (lower.includes('token_reset = ?')) {
      return fallbackData.usuarios.filter(u => u.token_reset === params[0]);
    }
    if (lower.includes('id = ?')) {
      return fallbackData.usuarios.filter(u => Number(u.id) === Number(params[0]));
    }
    return fallbackData.usuarios;
  }

  // INSERT INTO usuarios
  if (lower.startsWith('insert into usuarios')) {
    const [nome, email, senha, is_verified, token_verificacao] = params;
    const newId = fallbackData.usuarios.length ? Math.max(...fallbackData.usuarios.map(u => u.id)) + 1 : 1;
    const newUser = {
      id: newId,
      nome,
      email,
      senha,
      is_verified: is_verified !== undefined ? is_verified : 0,
      token_verificacao: token_verificacao || null,
      token_reset: null,
      criado_em: new Date().toISOString()
    };
    fallbackData.usuarios.push(newUser);
    saveFallback();
    return { insertId: newId, affectedRows: 1 };
  }

  // UPDATE usuarios
  if (lower.startsWith('update usuarios')) {
    if (lower.includes('is_verified = 1')) {
      const token = params[params.length - 1];
      const user = fallbackData.usuarios.find(u => u.token_verificacao === token);
      if (user) {
        user.is_verified = 1;
        user.token_verificacao = null;
        saveFallback();
        return { affectedRows: 1 };
      }
    }
    if (lower.includes('token_verificacao = ?')) {
      const [token, email] = params;
      const user = fallbackData.usuarios.find(u => u.email.toLowerCase() === String(email).toLowerCase());
      if (user) {
        user.token_verificacao = token;
        saveFallback();
        return { affectedRows: 1 };
      }
    }
    if (lower.includes('senha = ?')) {
      const [senha, token] = params;
      const user = fallbackData.usuarios.find(u => u.token_reset === token);
      if (user) {
        user.senha = senha;
        user.token_reset = null;
        saveFallback();
        return { affectedRows: 1 };
      }
    }
    return { affectedRows: 0 };
  }

  // PRODUTOS
  if (lower.startsWith('select') && lower.includes('from produto')) {
    return fallbackData.produto;
  }
  if (lower.startsWith('insert into produto')) {
    const [id_prod, categoria, descricao, valor, estoque, estoque_minimo] = params;
    const prod = {
      id_prod,
      categoria,
      descricao,
      valor: Number(valor),
      estoque: Number(estoque || 0),
      estoque_minimo: Number(estoque_minimo || 10)
    };
    fallbackData.produto.push(prod);
    saveFallback();
    return { insertId: id_prod, affectedRows: 1 };
  }
  if (lower.startsWith('update produto')) {
    const id = params[params.length - 1];
    const prod = fallbackData.produto.find(p => p.id_prod === id);
    if (prod) {
      if (lower.includes('estoque = ?')) prod.estoque = Number(params[0]);
      if (lower.includes('descricao = ?')) prod.descricao = params[0];
      if (lower.includes('valor = ?')) prod.valor = Number(params[1]);
      saveFallback();
      return { affectedRows: 1 };
    }
    return { affectedRows: 0 };
  }
  if (lower.startsWith('delete from produto')) {
    const id = params[0];
    fallbackData.produto = fallbackData.produto.filter(p => p.id_prod !== id);
    saveFallback();
    return { affectedRows: 1 };
  }

  // CATEGORIAS
  if (lower.startsWith('select') && lower.includes('from categorias')) {
    return fallbackData.categorias;
  }
  if (lower.startsWith('insert into categorias')) {
    const [nome, slug] = params;
    const newId = fallbackData.categorias.length ? Math.max(...fallbackData.categorias.map(c => c.id)) + 1 : 1;
    const cat = { id: newId, nome, slug: slug || nome.toLowerCase() };
    fallbackData.categorias.push(cat);
    saveFallback();
    return { insertId: newId, affectedRows: 1 };
  }
  if (lower.startsWith('delete from categorias')) {
    const id = Number(params[0]);
    fallbackData.categorias = fallbackData.categorias.filter(c => c.id !== id);
    saveFallback();
    return { affectedRows: 1 };
  }

  // FUNCIONARIOS
  if (lower.startsWith('select') && lower.includes('from funcionario')) {
    return fallbackData.funcionario;
  }

  // VENDAS
  if (lower.startsWith('select') && lower.includes('from venda_cab')) {
    return fallbackData.venda_cab;
  }
  if (lower.startsWith('insert into venda_cab')) {
    const [id_func, data_venda, valor_total] = params;
    const newId = fallbackData.venda_cab.length ? Math.max(...fallbackData.venda_cab.map(v => v.id_venda)) + 1 : 1;
    const venda = { id_venda: newId, id_func: Number(id_func), data_venda, valor_total: Number(valor_total) };
    fallbackData.venda_cab.push(venda);
    saveFallback();
    return { insertId: newId, affectedRows: 1 };
  }
  if (lower.startsWith('insert into venda_item')) {
    const [id_venda, id_prod, quantidade, valor_unit] = params;
    const newId = fallbackData.venda_item.length ? Math.max(...fallbackData.venda_item.map(i => i.id_item)) + 1 : 1;
    const item = { id_item: newId, id_venda: Number(id_venda), id_prod, quantidade: Number(quantidade), valor_unit: Number(valor_unit) };
    fallbackData.venda_item.push(item);

    // Atualiza estoque do produto
    const prod = fallbackData.produto.find(p => p.id_prod === id_prod);
    if (prod) {
      prod.estoque = Math.max(0, prod.estoque - Number(quantidade));
    }
    saveFallback();
    return { insertId: newId, affectedRows: 1 };
  }

  // DEMAND RECORDS
  if (lower.startsWith('select') && lower.includes('from demand_records')) {
    return fallbackData.demand_records;
  }
  if (lower.startsWith('insert into demand_records')) {
    const [product_sku, date, units_sold] = params;
    const newId = fallbackData.demand_records.length ? Math.max(...fallbackData.demand_records.map(d => d.id)) + 1 : 1;
    const rec = { id: newId, product_sku, date, units_sold: Number(units_sold) };
    fallbackData.demand_records.push(rec);
    saveFallback();
    return { insertId: newId, affectedRows: 1 };
  }

  // MESSAGES
  if (lower.startsWith('select') && lower.includes('from messages')) {
    return fallbackData.messages;
  }
  if (lower.startsWith('insert into messages')) {
    const [user_name, user_email, text] = params;
    const newId = fallbackData.messages.length ? Math.max(...fallbackData.messages.map(m => m.id)) + 1 : 1;
    const msg = { id: newId, user_name, user_email, text, created_at: new Date().toISOString() };
    fallbackData.messages.push(msg);
    saveFallback();
    return { insertId: newId, affectedRows: 1 };
  }

  // FAVOURITES
  if (lower.startsWith('select') && lower.includes('from favourites')) {
    if (params.length > 0) {
      return fallbackData.favourites.filter(f => f.user_email === params[0]);
    }
    return fallbackData.favourites;
  }
  if (lower.startsWith('insert into favourites')) {
    const [user_email, product_sku] = params;
    if (!fallbackData.favourites.some(f => f.user_email === user_email && f.product_sku === product_sku)) {
      const newId = fallbackData.favourites.length ? Math.max(...fallbackData.favourites.map(f => f.id)) + 1 : 1;
      fallbackData.favourites.push({ id: newId, user_email, product_sku, created_at: new Date().toISOString() });
      saveFallback();
    }
    return { affectedRows: 1 };
  }
  if (lower.startsWith('delete from favourites')) {
    const [user_email, product_sku] = params;
    fallbackData.favourites = fallbackData.favourites.filter(f => !(f.user_email === user_email && f.product_sku === product_sku));
    saveFallback();
    return { affectedRows: 1 };
  }

  return [];
}

module.exports = {
  connectDatabase,
  query,
  isFallback: () => useFallback
};
