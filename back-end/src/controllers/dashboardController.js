const db = require('../config/database');

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

// 2. Previsão de Demanda Integrada (com base no histórico e tendências)
exports.getForecast = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const numDays = Number(days) || 30;

    const records = await db.query('SELECT product_sku, date, units_sold FROM demand_records ORDER BY date ASC');
    const products = await db.query('SELECT id_prod, descricao, categoria, estoque FROM produto');

    const bySku = {};
    (records || []).forEach(r => {
      const sku = r.product_sku;
      if (!bySku[sku]) bySku[sku] = [];
      bySku[sku].push({
        date: typeof r.date === 'string' ? r.date.slice(0, 10) : new Date(r.date).toISOString().slice(0, 10),
        units_sold: Number(r.units_sold)
      });
    });

    const forecasts = {};

    (products || []).forEach(p => {
      const recs = bySku[p.id_prod] || [];
      if (!recs.length) {
        forecasts[p.id_prod] = { total: 0, daily: 0, trend: 'estável' };
        return;
      }

      const values = recs.map(r => r.units_sold);
      const n = values.length;
      const sumX = n * (n - 1) / 2;
      const sumY = values.reduce((sum, v) => sum + v, 0);
      const sumXY = values.reduce((sum, v, idx) => sum + idx * v, 0);
      const sumXX = values.reduce((sum, _, idx) => sum + idx * idx, 0);

      const slope = n > 1 ? (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX || 1) : 0;
      const intercept = (sumY - slope * sumX) / n;
      const daily = Math.max(0, (intercept + slope * (n + numDays / 2)) / 7);

      forecasts[p.id_prod] = {
        total: Math.round(daily * numDays),
        daily: Math.round(daily * 10) / 10,
        trend: slope > 0.05 ? 'alta' : (slope < -0.05 ? 'baixa' : 'estável')
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
