const db = require('../config/database');

// Listar Favoritos
exports.listFavourites = async (req, res) => {
  try {
    const userEmail = req.query.email || (req.user ? req.user.email : 'admin@flora.com');
    const rows = await db.query('SELECT * FROM favourites WHERE user_email = ?', [userEmail]);
    const skus = (rows || []).map(f => f.product_sku);

    const prods = await db.query('SELECT * FROM produto');
    const favProducts = (prods || [])
      .filter(p => skus.includes(p.id_prod))
      .map(p => ({
        id: p.id_prod,
        sku: p.id_prod,
        name: p.descricao,
        category: p.categoria,
        unit_price: Number(p.valor),
        stock: Number(p.estoque),
        minimum_stock: Number(p.estoque_minimo)
      }));

    return res.json({ skus, products: favProducts });
  } catch (err) {
    console.error('Erro ao listar favoritos:', err);
    return res.status(500).json({ error: 'Erro ao listar favoritos.' });
  }
};

// Alternar Favorito (Toggle)
exports.toggleFavourite = async (req, res) => {
  try {
    const { product_sku, email } = req.body;
    const userEmail = email || (req.user ? req.user.email : 'admin@flora.com');

    if (!product_sku) {
      return res.status(400).json({ error: 'Código do produto é obrigatório.' });
    }

    const existing = await db.query('SELECT * FROM favourites WHERE user_email = ? AND product_sku = ?', [userEmail, product_sku]);

    if (existing && existing.length > 0) {
      await db.query('DELETE FROM favourites WHERE user_email = ? AND product_sku = ?', [userEmail, product_sku]);
      return res.json({ favorited: false, product_sku });
    } else {
      await db.query('INSERT INTO favourites (user_email, product_sku) VALUES (?, ?)', [userEmail, product_sku]);
      return res.json({ favorited: true, product_sku });
    }
  } catch (err) {
    console.error('Erro ao alternar favorito:', err);
    return res.status(500).json({ error: 'Erro ao processar favorito.' });
  }
};
