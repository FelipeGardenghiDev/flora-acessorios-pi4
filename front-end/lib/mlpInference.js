/**
 * Inferência da Rede Neural MLP (PyTorch) no Front-End / Edge
 * 
 * Executa a previsão dos próximos 7 dias (t+1 a t+7) utilizando
 * os mesmos pesos treinados em deep learning no Google Colab.
 */

import modelData from './pesos_mlp.json';

const SKU_TO_ID = {
  'ANE-001': 1,
  'ANE-002': 2,
  'BRA-001': 3,
  'BRA-002': 4,
  'ANE-003': 5,
  'BRI-002': 6,
  'COL-001': 7,
  'PUL-001': 8,
  'COL-002': 9,
  'BRI-001': 10,
  'BRI-003': 11
};

export function getProductId(sku) {
  if (SKU_TO_ID[sku]) return SKU_TO_ID[sku];
  let hash = 0;
  for (let i = 0; i < (sku || '').length; i++) {
    hash = (hash << 5) - hash + sku.charCodeAt(i);
  }
  return (Math.abs(hash) % 11) + 1;
}

export function runMLPInference(sku, baseDate = new Date()) {
  const d = new Date(baseDate);
  const dayOfWeek = (d.getDay() + 6) % 7; // Segunda=0 .. Domingo=6
  const dayOfMonth = d.getDate();
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const daysInMonth = new Date(year, month, 0).getDate();

  const productId = getProductId(sku);

  // 17 features: 11 One-Hot do produto + 6 cíclicas de data
  const x = new Array(17).fill(0);
  const pIdx = Math.max(0, Math.min(10, productId - 1));
  x[pIdx] = 1;

  x[11] = Math.sin((2 * Math.PI * dayOfWeek) / 7);
  x[12] = Math.cos((2 * Math.PI * dayOfWeek) / 7);
  x[13] = Math.sin((2 * Math.PI * dayOfMonth) / daysInMonth);
  x[14] = Math.cos((2 * Math.PI * dayOfMonth) / daysInMonth);
  x[15] = Math.sin((2 * Math.PI * month) / 12);
  x[16] = Math.cos((2 * Math.PI * month) / 12);

  let current = x;
  for (const layer of modelData.layers) {
    const next = new Array(layer.out);
    for (let i = 0; i < layer.out; i++) {
      let sum = layer.bias[i];
      const wRow = layer.weights[i];
      for (let j = 0; j < layer.in; j++) {
        sum += current[j] * wRow[j];
      }
      next[i] = Math.max(0, sum); // ReLU
    }
    current = next;
  }

  // Desnormaliza com escala do MinMaxScaler (76.0)
  return current.map(val => Math.round(val * modelData.scale_y * 10) / 10);
}
