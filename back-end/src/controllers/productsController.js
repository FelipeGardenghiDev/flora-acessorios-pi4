const db = require('../config/database');

function formatProduct(p) {
  return {
    id: p.id_prod || p.id,
    sku: p.id_prod || p.sku,
    id_prod: p.id_prod || p.sku,
    name: p.descricao || p.name,
    descricao: p.descricao || p.name,
    category: p.categoria || p.category,
    categoria: p.categoria || p.category,
    unit_price: Number(p.valor !== undefined ? p.valor : p.unit_price),
    valor: Number(p.valor !== undefined ? p.valor : p.unit_price),
    stock: Number(p.estoque !== undefined ? p.estoque : p.stock),
    estoque: Number(p.estoque !== undefined ? p.estoque : p.stock),
    minimum_stock: Number(p.estoque_minimo !== undefined ? p.estoque_minimo : p.minimum_stock || 10),
    estoque_minimo: Number(p.estoque_minimo !== undefined ? p.estoque_minimo : p.minimum_stock || 10)
  };
}

// 1. Listar todos os produtos
exports.listProducts = async (req, res) => {
  try {
    const rows = await db.query('SELECT * FROM produto ORDER BY categoria ASC, id_prod ASC');
    return res.json((rows || []).map(formatProduct));
  } catch (err) {
    console.error('Erro ao listar produtos:', err);
    return res.status(500).json({ error: 'Erro ao listar produtos.' });
  }
};

// 2. Criar Produto
exports.createProduct = async (req, res) => {
  try {
    const { id_prod, sku, name, descricao, category, categoria, unit_price, valor, stock, estoque, minimum_stock, estoque_minimo } = req.body;
    
    const finalSku = (id_prod || sku || '').trim().toUpperCase();
    const finalName = (descricao || name || '').trim();
    const finalCat = (categoria || category || '').trim();
    const finalPrice = Number(valor !== undefined ? valor : unit_price) || 0;
    const finalStock = Number(estoque !== undefined ? estoque : stock) || 0;
    const finalMinStock = Number(estoque_minimo !== undefined ? estoque_minimo : minimum_stock) || 10;

    if (!finalSku || !finalName || !finalCat) {
      return res.status(400).json({ error: 'Código (SKU), descrição e categoria são obrigatórios.' });
    }

    await db.query(
      'INSERT INTO produto (id_prod, categoria, descricao, valor, estoque, estoque_minimo) VALUES (?, ?, ?, ?, ?, ?)',
      [finalSku, finalCat, finalName, finalPrice, finalStock, finalMinStock]
    );

    const created = formatProduct({
      id_prod: finalSku,
      categoria: finalCat,
      descricao: finalName,
      valor: finalPrice,
      estoque: finalStock,
      estoque_minimo: finalMinStock
    });

    return res.status(201).json(created);
  } catch (err) {
    console.error('Erro ao criar produto:', err);
    return res.status(500).json({ error: 'Erro ao cadastrar produto.' });
  }
};

// 3. Atualizar Produto (ex: ajuste rápido de estoque)
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock, estoque, unit_price, valor, name, descricao, category, categoria } = req.body;

    const existing = await db.query('SELECT * FROM produto WHERE id_prod = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    const current = existing[0];
    const newStock = stock !== undefined ? Number(stock) : (estoque !== undefined ? Number(estoque) : current.estoque);
    const newPrice = unit_price !== undefined ? Number(unit_price) : (valor !== undefined ? Number(valor) : current.valor);
    const newName = descricao !== undefined ? descricao : (name !== undefined ? name : current.descricao);
    const newCat = categoria !== undefined ? categoria : (category !== undefined ? category : current.categoria);

    await db.query(
      'UPDATE produto SET estoque = ?, valor = ?, descricao = ?, categoria = ? WHERE id_prod = ?',
      [newStock, newPrice, newName, newCat, id]
    );

    const updated = formatProduct({
      id_prod: id,
      categoria: newCat,
      descricao: newName,
      valor: newPrice,
      estoque: newStock,
      estoque_minimo: current.estoque_minimo
    });

    return res.json(updated);
  } catch (err) {
    console.error('Erro ao atualizar produto:', err);
    return res.status(500).json({ error: 'Erro ao atualizar produto.' });
  }
};

// 4. Excluir Produto
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM produto WHERE id_prod = ?', [id]);
    return res.json({ success: true, message: 'Produto excluído com sucesso.' });
  } catch (err) {
    console.error('Erro ao excluir produto:', err);
    return res.status(500).json({ error: 'Erro ao excluir produto.' });
  }
};

// 5. Listar Categorias
exports.listCategories = async (req, res) => {
  try {
    const rows = await db.query('SELECT * FROM categorias ORDER BY nome ASC');
    const formatted = (rows || []).map(c => ({
      id: c.id,
      name: c.nome,
      nome: c.nome,
      slug: c.slug
    }));
    return res.json(formatted);
  } catch (err) {
    console.error('Erro ao listar categorias:', err);
    return res.status(500).json({ error: 'Erro ao listar categorias.' });
  }
};

// 6. Criar Categoria
exports.createCategory = async (req, res) => {
  try {
    const { name, nome, slug } = req.body;
    const finalName = (nome || name || '').trim();
    if (!finalName) {
      return res.status(400).json({ error: 'Nome da categoria é obrigatório.' });
    }
    const finalSlug = (slug || finalName.toLowerCase().replace(/\s+/g, '-')).trim();

    const result = await db.query('INSERT INTO categorias (nome, slug) VALUES (?, ?)', [finalName, finalSlug]);
    return res.status(201).json({
      id: result.insertId,
      name: finalName,
      nome: finalName,
      slug: finalSlug
    });
  } catch (err) {
    console.error('Erro ao criar categoria:', err);
    return res.status(500).json({ error: 'Erro ao criar categoria.' });
  }
};

// 7. Excluir Categoria
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM categorias WHERE id = ?', [id]);
    return res.json({ success: true });
  } catch (err) {
    console.error('Erro ao excluir categoria:', err);
    return res.status(500).json({ error: 'Erro ao excluir categoria.' });
  }
};
