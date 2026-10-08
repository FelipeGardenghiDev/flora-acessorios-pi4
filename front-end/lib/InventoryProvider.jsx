import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { computeInventoryMetrics } from './dashboardMetrics';

const InventoryContext = createContext();

const normalizeProduct = (p) => ({
  ...p,
  id: p.id || p.id_prod || p.sku,
  sku: p.sku || p.id_prod || p.id,
  name: p.name || p.descricao,
  category: p.category || p.categoria,
  stock: Number(p.stock !== undefined ? p.stock : p.estoque),
  minimum_stock: Number(p.minimum_stock !== undefined ? p.minimum_stock : (p.estoque_minimo || 10)),
  unit_price: Number(p.unit_price !== undefined ? p.unit_price : p.valor)
});

const normalizeDemandRecord = (r) => ({
  ...r,
  units_sold: Number(r.units_sold)
});

export function InventoryProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [demandRecords, setDemandRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const [resProd, resCat, resDemand] = await Promise.all([
        fetch('/api/v1/products').then(r => r.json()).catch(() => []),
        fetch('/api/v1/categories').then(r => r.json()).catch(() => []),
        fetch('/api/v1/demand-records').then(r => r.json()).catch(() => [])
      ]);

      setProducts((resProd || []).map(normalizeProduct));
      setCategories(resCat || []);
      setDemandRecords((resDemand || []).map(normalizeDemandRecord));
    } catch (err) {
      console.error('Erro ao buscar inventário:', err);
    } finally {
      setLoading(false);
    }
  };

  const metrics = useMemo(() => computeInventoryMetrics(products, demandRecords), [products, demandRecords]);

  useEffect(() => {
    fetchInventory();
  }, []);

  const addProduct = async (productData) => {
    const res = await fetch('/api/v1/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao adicionar produto');
    }
    const created = await res.json();
    const normalized = normalizeProduct(created);
    setProducts((prev) => [...prev, normalized]);
    return normalized;
  };

  const updateProduct = async (id, productData) => {
    const res = await fetch(`/api/v1/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao atualizar produto');
    }
    const updated = await res.json();
    const normalized = normalizeProduct(updated);
    setProducts((prev) => prev.map((p) => (p.id === id ? normalized : p)));
    return normalized;
  };

  const deleteProduct = async (id) => {
    const res = await fetch(`/api/v1/products/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erro ao excluir produto');
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const addCategory = async (categoryData) => {
    const res = await fetch('/api/v1/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(categoryData)
    });
    if (!res.ok) throw new Error('Erro ao adicionar categoria');
    const created = await res.json();
    setCategories((prev) => [...prev, created]);
    return created;
  };

  const deleteCategory = async (id) => {
    const res = await fetch(`/api/v1/categories/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erro ao excluir categoria');
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <InventoryContext.Provider
      value={{
        products,
        categories,
        demandRecords,
        metrics,
        loading,
        addProduct,
        updateProduct,
        deleteProduct,
        addCategory,
        deleteCategory,
        refreshInventory: fetchInventory
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory deve ser usado dentro de um InventoryProvider');
  }
  return context;
}