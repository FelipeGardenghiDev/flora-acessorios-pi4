import { runMLPInference } from './mlpInference';

/**
 * Previsão de Demanda utilizando a Rede Neural Artificial MLP (PyTorch)
 * com fallback estatístico se o produto não tiver SKU mapeado.
 */
export function forecastDemand(records, days = 30, sku = null) {
  // Inferência através do modelo de Deep Learning MLP
  if (sku) {
    try {
      const lastRecordDate = records.length ? records[records.length - 1].date : new Date();
      const next7Days = runMLPInference(sku, lastRecordDate);
      const weeklySum = next7Days.reduce((acc, v) => acc + v, 0);
      const daily = Math.round((weeklySum / 7) * 10) / 10;
      return {
        total: Math.round(daily * days),
        daily,
        next7Days,
        model: 'MLP-PyTorch'
      };
    } catch (e) {
      console.warn('Fallback para projeção linear:', e);
    }
  }

  // Fallback caso não haja SKU informado
  const values = [...records].sort((a, b) => a.date.localeCompare(b.date)).map(r => Number(r.units_sold));
  if (!values.length) return { total: 0, daily: 0 };
  const n = values.length;
  const sumX = n * (n - 1) / 2;
  const sumY = values.reduce((sum, value) => sum + value, 0);
  const sumXY = values.reduce((sum, value, index) => sum + index * value, 0);
  const sumXX = values.reduce((sum, _, index) => sum + index * index, 0);
  const slope = n > 1 ? (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX || 1) : 0;
  const intercept = (sumY - slope * sumX) / n;
  const daily = Math.max(0, (intercept + slope * (n + days / 2)) / 7);
  return { total: Math.round(daily * days), daily: Math.round(daily * 10) / 10 };
}

/**
 * Constrói a série temporal do gráfico integrando histórico real
 * e os 7 pontos projetados pela Rede Neural MLP.
 */
export function buildForecastSeries(records, days = 30, sku = null) {
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
  if (!sorted.length && !sku) return { slope: 0, points: [] };

  const byDate = {};
  sorted.forEach(r => { byDate[r.date] = (byDate[r.date] || 0) + r.units_sold; });
  const dates = Object.keys(byDate).sort();
  const values = dates.map(d => byDate[d]);
  const n = values.length;

  // Pontos históricos reais
  const points = dates.map((date, i) => ({
    date: new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    actual: values[i],
    forecast: null
  }));

  const lastDateStr = dates.length ? dates[dates.length - 1] : new Date().toISOString().slice(0, 10);
  const lastDate = new Date(`${lastDateStr}T12:00:00`);

  // Conecta o último ponto real ao primeiro ponto previsto para manter a continuidade visual
  if (points.length > 0) {
    points[points.length - 1].forecast = points[points.length - 1].actual;
  }

  // Previsões dos 7 dias no futuro geradas pela Rede Neural MLP (t+1 a t+7)
  let slope = 0;
  if (sku) {
    const mlp7Days = runMLPInference(sku, lastDate);
    for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
      const futureDate = new Date(lastDate.getTime() + dayOffset * 86400000);
      const predictedValue = mlp7Days[dayOffset - 1];
      points.push({
        date: futureDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        actual: null,
        forecast: predictedValue
      });
    }

    // Calcula a inclinação (tendência) dos 7 dias previstos
    const firstHalfAvg = (mlp7Days[0] + mlp7Days[1] + mlp7Days[2]) / 3;
    const secondHalfAvg = (mlp7Days[4] + mlp7Days[5] + mlp7Days[6]) / 3;
    slope = secondHalfAvg - firstHalfAvg;
  } else {
    // Fallback linear caso não tenha SKU
    const sumX = n * (n - 1) / 2;
    const sumY = values.reduce((s, v) => s + v, 0);
    const sumXY = values.reduce((s, v, i) => s + i * v, 0);
    const sumXX = values.reduce((s, _, i) => s + i * i, 0);
    slope = n > 1 ? (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX || 1) : 0;
    const intercept = (sumY - slope * sumX) / n;

    const steps = 7;
    for (let s = 1; s <= steps; s++) {
      const d = new Date(lastDate.getTime() + s * 86400000);
      points.push({
        date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        actual: null,
        forecast: Math.max(0, Math.round(intercept + slope * (n + s)))
      });
    }
  }

  return { slope, points, model: 'MLP' };
}

export function buildChartData(records) {
  const totals = records.reduce((acc, item) => ({ ...acc, [item.date]: (acc[item.date] || 0) + item.units_sold }), {});
  return Object.entries(totals).sort(([a], [b]) => a.localeCompare(b)).map(([date, demand]) => ({
    date: new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    demand
  }));
}