/**
 * Serviço de Inferência de Inteligência Artificial — Rede Neural MLP
 * 
 * Implementação pura em JavaScript da arquitetura PyTorch treinada no Colab:
 * - Camada de Entrada: 17 neurônios (One-Hot SKU + 6 features temporais cíclicas)
 * - Camadas Ocultas: 256 -> 128 -> 64 -> 32 -> 16 com ativação ReLU
 * - Camada de Saída: 7 neurônios (Previsão de demanda diária para os próximos 7 dias t+1 a t+7)
 * - Escala: Desnormalização via MinMaxScaler (fator max 76.0)
 * 
 * Executa em < 1ms por produto, 100% serverless e compatível com Vercel.
 */

const model = require('../config/pesos_mlp.json');

// Mapeamento dos SKUs do catálogo para os IDs (1 a 11) do modelo treinado
const SKU_TO_ID = {
  'ANE-001': 1,  // Anel Solitário
  'ANE-002': 2,  // Anel Falange Regulável
  'BRA-001': 3,  // Bracelete Rígido
  'BRA-002': 4,  // Bracelete Folheado
  'ANE-003': 5,  // Anel Três Fios / Pedra
  'BRI-002': 6,  // Brinco Ponto de Luz
  'COL-001': 7,  // Colar Gravatinha
  'PUL-001': 8,  // Pulseira Riviera
  'COL-002': 9,  // Colar Choker Elos
  'BRI-001': 10, // Brinco Argola Cravejada
  'BRI-003': 11  // Brinco Cascata Pérolas
};

function getProductIdFromSku(sku) {
  if (SKU_TO_ID[sku]) return SKU_TO_ID[sku];
  // Fallback determinístico para novos SKUs cadastrados
  let hash = 0;
  for (let i = 0; i < (sku || '').length; i++) {
    hash = (hash << 5) - hash + sku.charCodeAt(i);
  }
  return (Math.abs(hash) % 11) + 1;
}

/**
 * Executa a passagem direta (forward pass) da rede neural MLP
 * @param {string} sku - Código do produto (ex: 'ANE-001')
 * @param {Date|string} [baseDate] - Data base para a previsão
 * @returns {Array<number>} - 7 valores previstos de demanda (t+1 a t+7)
 */
function forwardMLP(sku, baseDate = new Date()) {
  const d = new Date(baseDate);
  const dayOfWeek = (d.getDay() + 6) % 7; // Segunda=0 ... Domingo=6 (compatível com pandas dt.dayofweek)
  const dayOfMonth = d.getDate();
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 1 .. 12
  const daysInMonth = new Date(year, month, 0).getDate();

  const productId = getProductIdFromSku(sku);

  // Vetor de entrada com 17 atributos
  const x = new Array(17).fill(0);
  const pIdx = Math.max(0, Math.min(10, productId - 1));
  x[pIdx] = 1; // One-Hot encoding do produto

  // Sazonalidades temporais cíclicas (seno e cosseno)
  x[11] = Math.sin((2 * Math.PI * dayOfWeek) / 7);
  x[12] = Math.cos((2 * Math.PI * dayOfWeek) / 7);
  x[13] = Math.sin((2 * Math.PI * dayOfMonth) / daysInMonth);
  x[14] = Math.cos((2 * Math.PI * dayOfMonth) / daysInMonth);
  x[15] = Math.sin((2 * Math.PI * month) / 12);
  x[16] = Math.cos((2 * Math.PI * month) / 12);

  let current = x;
  for (const layer of model.layers) {
    const next = new Array(layer.out);
    for (let i = 0; i < layer.out; i++) {
      let sum = layer.bias[i];
      const wRow = layer.weights[i];
      for (let j = 0; j < layer.in; j++) {
        sum += current[j] * wRow[j];
      }
      next[i] = Math.max(0, sum); // Ativação ReLU
    }
    current = next;
  }

  // Desnormalização com o fator do MinMaxScaler (scale_y = 76.0)
  return current.map(val => Math.round(val * model.scale_y * 10) / 10);
}

/**
 * Retorna métricas analíticas e previsões para um produto
 */
function predictProductDemand(sku, baseDate = new Date()) {
  const next7Days = forwardMLP(sku, baseDate);
  const totalWeekly = Math.round(next7Days.reduce((acc, v) => acc + v, 0));
  const dailyAverage = Math.round((totalWeekly / 7) * 10) / 10;

  // Análise de tendência baseada nos primeiros vs últimos dias
  const firstHalf = next7Days.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
  const secondHalf = next7Days.slice(4).reduce((a, b) => a + b, 0) / 3;
  const trend = secondHalf > firstHalf * 1.05 ? 'alta' : (secondHalf < firstHalf * 0.95 ? 'baixa' : 'estável');

  return {
    sku,
    next7Days,
    daily: dailyAverage,
    total: Math.round(dailyAverage * 30), // Projeção mensal estimada
    trend,
    modelName: 'PyTorch-MLP (17-256-128-64-32-16-7)'
  };
}

module.exports = {
  forwardMLP,
  predictProductDemand,
  SKU_TO_ID
};
