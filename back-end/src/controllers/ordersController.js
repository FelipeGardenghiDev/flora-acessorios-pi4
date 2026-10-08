const db = require('../config/database');

// 1. Listar Vendedores (Funcionários)
exports.listVendedores = async (req, res) => {
  try {
    const rows = await db.query('SELECT * FROM funcionario ORDER BY nome ASC');
    const result = (rows || []).map(f => ({
      ID: f.id_func,
      id_func: f.id_func,
      NOME_COMPLETO: `${f.nome} ${f.sobrenome || ''}`.trim(),
      CPF: f.cpf,
      ADMISSAO: f.admissao,
      DESLIGAMENTO: f.desligamento
    }));
    return res.json(result);
  } catch (err) {
    console.error('Erro ao listar vendedores:', err);
    return res.status(500).json({ error: 'Erro ao listar vendedores.' });
  }
};

// 2. Listar Produtos para Formulário
exports.listProdutosForm = async (req, res) => {
  try {
    const rows = await db.query('SELECT id_prod, categoria, descricao, valor FROM produto ORDER BY id_prod ASC');
    const result = (rows || []).map(p => ({
      ID: p.id_prod,
      id_prod: p.id_prod,
      CATEGORIA: p.categoria,
      DESCRICAO: p.descricao,
      VALOR: Number(p.valor)
    }));
    return res.json(result);
  } catch (err) {
    console.error('Erro ao listar produtos do form:', err);
    return res.status(500).json({ error: 'Erro ao listar produtos do formulário.' });
  }
};

// 3. Listar Anos com Vendas
exports.listAnosVendas = async (req, res) => {
  try {
    const rows = await db.query('SELECT data_venda FROM venda_cab');
    const anosSet = new Set((rows || []).map(v => new Date(v.data_venda).getFullYear()));
    const result = Array.from(anosSet)
      .sort((a, b) => b - a)
      .map(ANO => ({ ANO }));
    return res.json(result);
  } catch (err) {
    console.error('Erro ao listar anos de vendas:', err);
    return res.status(500).json({ error: 'Erro ao listar anos de vendas.' });
  }
};

// 4. Vendas Agrupadas por Mês
exports.listVendasPorMes = async (req, res) => {
  try {
    const { ano } = req.query;
    const rows = await db.query('SELECT data_venda, valor_total FROM venda_cab');

    const targetYear = ano ? Number(ano) : null;
    const agrupado = {};

    (rows || []).forEach(v => {
      const dt = new Date(v.data_venda);
      if (targetYear && dt.getFullYear() !== targetYear) return;

      const mes = dt.getUTCMonth() + 1;
      if (!agrupado[mes]) agrupado[mes] = 0;
      agrupado[mes] += Number(v.valor_total || 0);
    });

    const result = Object.keys(agrupado)
      .map(mes => ({
        MES: Number(mes),
        TOTAL: agrupado[mes]
      }))
      .sort((a, b) => a.MES - b.MES);

    return res.json(result);
  } catch (err) {
    console.error('Erro ao listar vendas por mês:', err);
    return res.status(500).json({ error: 'Erro ao listar vendas por mês.' });
  }
};

// 5. Vendas Recentes (Últimas 4)
exports.listVendasRecentes = async (req, res) => {
  try {
    const vendas = await db.query('SELECT * FROM venda_cab ORDER BY data_venda DESC, id_venda DESC');
    const funcs = await db.query('SELECT * FROM funcionario');
    const produtos = await db.query('SELECT * FROM produto');
    const itens = await db.query('SELECT * FROM venda_item');

    const funcMap = new Map((funcs || []).map(f => [f.id_func, `${f.nome} ${f.sobrenome || ''}`.trim()]));
    const prodMap = new Map((produtos || []).map(p => [p.id_prod, p]));

    const slice = (vendas || []).slice(0, 4);

    const result = slice.map(v => {
      const item = (itens || []).find(i => i.id_venda === v.id_venda);
      const prod = item ? prodMap.get(item.id_prod) : null;

      return {
        ID: v.id_venda,
        VENDEDOR: funcMap.get(v.id_func) || 'Vendedor Padrão',
        CATEGORIA: prod ? prod.categoria : 'Acessórios',
        NOME: prod ? prod.descricao : 'Item de Venda',
        VALOR: Number(v.valor_total),
        DATA_VENDA: v.data_venda
      };
    });

    return res.json(result);
  } catch (err) {
    console.error('Erro ao listar vendas recentes:', err);
    return res.status(500).json({ error: 'Erro ao listar vendas recentes.' });
  }
};

// 6. Salvar Venda Completa
exports.salvarVenda = async (req, res) => {
  try {
    const { vendedor, codigo_produto, valor_venda, mes_venda, ano_venda } = req.body;

    if (!vendedor || !codigo_produto || !valor_venda || !mes_venda || !ano_venda) {
      return res.status(400).json({ error: 'Dados incompletos! Preencha todos os campos.' });
    }

    const funcs = await db.query('SELECT * FROM funcionario');
    const func = (funcs || []).find(f => `${f.nome} ${f.sobrenome || ''}`.trim().toLowerCase() === vendedor.trim().toLowerCase());

    const id_func = func ? func.id_func : 1; // Default fallback para o 1º vendedor

    const diaAtual = String(new Date().getDate()).padStart(2, '0');
    const mesFormatado = String(mes_venda).padStart(2, '0');
    const data_venda = `${ano_venda}-${mesFormatado}-${diaAtual}`;
    const valorTotal = Number(valor_venda);

    // Insere cabeçalho
    const cabResult = await db.query(
      'INSERT INTO venda_cab (id_func, data_venda, valor_total) VALUES (?, ?, ?)',
      [id_func, data_venda, valorTotal]
    );

    const id_venda = cabResult.insertId;

    // Insere item
    await db.query(
      'INSERT INTO venda_item (id_venda, id_prod, quantidade, valor_unit) VALUES (?, ?, ?, ?)',
      [id_venda, codigo_produto, 1, valorTotal]
    );

    // Registra demanda
    await db.query(
      'INSERT INTO demand_records (product_sku, date, units_sold) VALUES (?, ?, ?)',
      [codigo_produto, data_venda, 1]
    );

    return res.status(201).json({ status: 'ok', id_venda });
  } catch (err) {
    console.error('Erro ao salvar venda:', err);
    return res.status(500).json({ error: 'Erro ao registrar venda: ' + err.message });
  }
};

// 7. Leaderboard de Vendedores
exports.getLeaderboard = async (req, res) => {
  try {
    const vendas = await db.query('SELECT id_func, valor_total FROM venda_cab');
    const funcs = await db.query('SELECT * FROM funcionario');

    const funcMap = new Map((funcs || []).map(f => [f.id_func, `${f.nome} ${f.sobrenome || ''}`.trim()]));
    const totais = {};

    (vendas || []).forEach(v => {
      const nome = funcMap.get(v.id_func);
      if (!nome) return;
      if (!totais[nome]) totais[nome] = 0;
      totais[nome] += Number(v.valor_total || 0);
    });

    const ranking = Object.keys(totais)
      .map(nome => ({
        nome,
        total: totais[nome]
      }))
      .sort((a, b) => b.total - a.total);

    return res.json(ranking);
  } catch (err) {
    console.error('Erro no leaderboard:', err);
    return res.status(500).json({ error: 'Erro ao gerar ranking de vendedores.' });
  }
};

// 8. Histórico Completo de Transações
exports.getHistorico = async (req, res) => {
  try {
    const vendas = await db.query('SELECT * FROM venda_cab ORDER BY data_venda DESC, id_venda DESC');
    const funcs = await db.query('SELECT * FROM funcionario');
    const produtos = await db.query('SELECT * FROM produto');
    const itens = await db.query('SELECT * FROM venda_item');

    const funcMap = new Map((funcs || []).map(f => [f.id_func, `${f.nome} ${f.sobrenome || ''}`.trim()]));
    const prodMap = new Map((produtos || []).map(p => [p.id_prod, p]));

    const result = (vendas || []).map(v => {
      const item = (itens || []).find(i => i.id_venda === v.id_venda);
      const prod = item ? prodMap.get(item.id_prod) : null;

      return {
        id: v.id_venda,
        data: v.data_venda,
        vendedor: funcMap.get(v.id_func) || 'Vendedor Padrão',
        produto: prod ? prod.descricao : 'Item de Venda',
        sku: prod ? prod.id_prod : '-',
        categoria: prod ? prod.categoria : 'Acessórios',
        quantidade: item ? item.quantidade : 1,
        valor: Number(v.valor_total)
      };
    });

    return res.json(result);
  } catch (err) {
    console.error('Erro no histórico:', err);
    return res.status(500).json({ error: 'Erro ao gerar histórico.' });
  }
};
