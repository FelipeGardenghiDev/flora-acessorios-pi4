const db = require('../config/database');
const { predictProductDemand } = require('../services/mlpService');

// 1. Listar registros históricos de demanda
exports.listDemandRecords = async (req, res) => {
  try {
    const rows = await db.query('SELECT * FROM demand_records ORDER BY date ASC');
    const result = (rows || []).map(r => ({
      id: r.id,
      product_sku: r.product_sku,
      date: typeof r.date === 'string' ? r.date.slice(0, 10) : new Date(r.date).toISOString().slice(0, 10),
      units_sold: Number(r.units_sold)
    }));
    return res.json(result);
  } catch (err) {
    console.error('Erro ao buscar registros de demanda:', err);
    return res.status(500).json({ error: 'Erro ao buscar registros de demanda.' });
  }
};

// 2. Previsão de Demanda Integrada com Rede Neural MLP (PyTorch)
exports.getForecast = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const numDays = Number(days) || 30;

    const products = await db.query('SELECT id_prod, descricao, categoria, estoque FROM produto');

    const forecasts = {};

    (products || []).forEach(p => {
      const mlp = predictProductDemand(p.id_prod);
      forecasts[p.id_prod] = {
        total: Math.round(mlp.daily * numDays),
        daily: mlp.daily,
        trend: mlp.trend,
        next7Days: mlp.next7Days,
        model: 'PyTorch-MLP (17-256-128-64-32-16-7)'
      };
    });

    return res.json(forecasts);
  } catch (err) {
    console.error('Erro ao gerar previsões:', err);
    return res.status(500).json({ error: 'Erro ao gerar previsões.' });
  }
};

// 3. Inserir registros de demanda (em lote ou individual)
exports.createDemandRecords = async (req, res) => {
  try {
    const records = Array.isArray(req.body) ? req.body : [req.body];
    for (const r of records) {
      if (r.product_sku && r.date && r.units_sold !== undefined) {
        await db.query(
          'INSERT INTO demand_records (product_sku, date, units_sold) VALUES (?, ?, ?)',
          [r.product_sku, r.date, Number(r.units_sold)]
        );
      }
    }
    return res.status(201).json({ success: true, count: records.length });
  } catch (err) {
    console.error('Erro ao inserir registros de demanda:', err);
    return res.status(500).json({ error: 'Erro ao salvar registros de demanda.' });
  }
};
