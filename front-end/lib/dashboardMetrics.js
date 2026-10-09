import { forecastDemand } from './forecast';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function computeInventoryMetrics(products, demandRecords) {
  const value = products.reduce((sum, p) => sum + Number(p.stock) * Number(p.unit_price), 0);
  const alerts = products.filter(p => Number(p.stock) <= Number(p.minimum_stock)).length;
  const health = products.length ? Math.round((100 * (products.length - alerts)) / products.length) : 100;
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  // Proxy: cada registro de demanda no mês corrente conta como um "pedido" (não há tabela de pedidos no schema novo).
  const orders = demandRecords.filter(r => r.date.startsWith(monthKey)).length;
  return { value, alerts, health, products: products.length, orders, valueDelta: null, ordersDelta: null };
}

export function buildLevelChartData(products, limit = 8) {
  return [...products]
    .sort((a, b) => b.stock - a.stock)
    .slice(0, limit)
    .map(p => ({ short: p.name.length > 10 ? `${p.name.slice(0, 9)}…` : p.name, stock: p.stock, minimum_stock: p.minimum_stock }));
}

export function buildForecasts(products, demandRecords) {
  const bySku = {};
  products.forEach(p => {
    bySku[p.sku] = forecastDemand(demandRecords.filter(r => r.product_sku === p.sku), 30, p.sku);
  });
  return bySku;
}

export function buildMonthlyUnits(demandRecords, months = 6) {
  const now = new Date();
  const buckets = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, month: MONTH_LABELS[d.getMonth()], value: 0 });
  }
  const byKey = Object.fromEntries(buckets.map(b => [b.key, b]));
  demandRecords.forEach(r => {
    const bucket = byKey[r.date.slice(0, 7)];
    if (bucket) bucket.value += Number(r.units_sold);
  });
  return buckets.map(({ month, value }) => ({ month, value }));
}

export function buildWeeklyFulfilment(demandRecords, weeks = 6) {
  const dayMs = 86400000;
  const now = new Date();
  const buckets = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const end = new Date(now.getTime() - i * 7 * dayMs);
    buckets.push({ label: end.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), start: new Date(end.getTime() - 6 * dayMs), end, demand: 0 });
  }
  demandRecords.forEach(r => {
    const d = new Date(`${r.date}T12:00:00`);
    const bucket = buckets.find(b => d >= b.start && d <= b.end);
    if (bucket) bucket.demand += Number(r.units_sold);
  });
  const data = buckets.map((b, i) => ({ date: b.label, demand: b.demand, prev: i > 0 ? buckets[i - 1].demand : null }));
  return {
    data,
    current: buckets[buckets.length - 1]?.demand || 0,
    previous: buckets[buckets.length - 2]?.demand || 0,
  };
}
