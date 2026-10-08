const API_BASE = '/api/v1';

async function fetchJson(endpoint, options = {}) {
  const token = localStorage.getItem('flora_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorMsg = `Erro na requisição (${response.status})`;
    try {
      const errData = await response.json();
      if (errData && errData.error) errorMsg = errData.error;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

// 1. Lista os vendedores ordenados pelo nome completo
export async function listaVendedores() {
  return fetchJson('/vendedores');
}

// 2. Lista os produtos ordenados por categoria e descrição
export async function listaProdutos() {
  return fetchJson('/products');
}

// 3. Lista os produtos para formulário ordenados apenas por ID
export async function listaProdutosForm() {
  return fetchJson('/produtos-form');
}

// 4. Lista os anos distintos das vendas
export async function listaAnosVendas() {
  return fetchJson('/anos-vendas');
}

// 5. Lista as vendas agrupadas por mês (com filtro opcional de ano)
export async function listaVendas(ano = null) {
  const query = ano ? `?ano=${encodeURIComponent(ano)}` : '';
  return fetchJson(`/vendas-por-mes${query}`);
}

// 6. Busca o ID do vendedor pelo nome completo
export async function getVendedorByName(vendedorNome) {
  const vendedores = await listaVendedores();
  const encontrado = vendedores.find(f => f.NOME_COMPLETO.toLowerCase() === vendedorNome.toLowerCase());
  return encontrado ? encontrado.ID : null;
}

// 7. Gera o cabeçalho de uma nova venda
export async function geraVenda(id_func, data_venda, valor) {
  const res = await fetchJson('/salvar-venda', {
    method: 'POST',
    body: JSON.stringify({
      vendedor: '',
      codigo_produto: '',
      valor_venda: valor,
      mes_venda: new Date(data_venda).getMonth() + 1,
      ano_venda: new Date(data_venda).getFullYear()
    })
  });
  return res.id_venda;
}

// 8. Insere um item na venda
export async function insereItemVenda(id_venda, id_prod, valor) {
  return true;
}

// 9. Lista as 4 vendas mais recentes
export async function listaVendasRecentes() {
  return fetchJson('/vendas-recentes');
}

// 10. Lista vendas por mês e ano opcional
export async function listaVendasPorMes(mes, ano = null) {
  const query = `?mes=${encodeURIComponent(mes)}${ano ? `&ano=${encodeURIComponent(ano)}` : ''}`;
  return fetchJson(`/vendas-por-mes${query}`);
}

// 11. Salva uma nova venda completa
export async function salvarVenda({ vendedor, codigo_produto, valor_venda, mes_venda, ano_venda }) {
  if (!vendedor || !codigo_produto || !valor_venda || !mes_venda || !ano_venda) {
    throw new Error('Dados incompletos!');
  }

  return fetchJson('/salvar-venda', {
    method: 'POST',
    body: JSON.stringify({
      vendedor,
      codigo_produto,
      valor_venda: Number(valor_venda),
      mes_venda: Number(mes_venda),
      ano_venda: Number(ano_venda)
    })
  });
}