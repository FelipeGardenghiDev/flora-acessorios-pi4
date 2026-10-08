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

const DEFAULT_DEMAND = [
  { id: 1, product_sku: 'ANE-001', date: '2026-09-10', units_sold: 4 },
  { id: 2, product_sku: 'ANE-001', date: '2026-09-15', units_sold: 5 },
  { id: 3, product_sku: 'ANE-001', date: '2026-09-20', units_sold: 6 },
  { id: 4, product_sku: 'ANE-001', date: '2026-09-25', units_sold: 5 },
  { id: 5, product_sku: 'ANE-001', date: '2026-09-30', units_sold: 7 },
  { id: 6, product_sku: 'ANE-001', date: '2026-10-05', units_sold: 8 },
  { id: 7, product_sku: 'BRI-001', date: '2026-09-10', units_sold: 8 },
  { id: 8, product_sku: 'BRI-001', date: '2026-09-15', units_sold: 7 },
  { id: 9, product_sku: 'BRI-001', date: '2026-09-20', units_sold: 10 },
  { id: 10, product_sku: 'BRI-001', date: '2026-09-25', units_sold: 9 },
  { id: 11, product_sku: 'BRI-001', date: '2026-09-30', units_sold: 11 },
  { id: 12, product_sku: 'BRI-001', date: '2026-10-05', units_sold: 12 },
  { id: 13, product_sku: 'COL-001', date: '2026-09-10', units_sold: 3 },
  { id: 14, product_sku: 'COL-001', date: '2026-09-15', units_sold: 4 },
  { id: 15, product_sku: 'COL-001', date: '2026-09-20', units_sold: 5 },
  { id: 16, product_sku: 'COL-001', date: '2026-09-25', units_sold: 4 },
  { id: 17, product_sku: 'COL-001', date: '2026-09-30', units_sold: 6 },
  { id: 18, product_sku: 'COL-001', date: '2026-10-05', units_sold: 7 },
  { id: 19, product_sku: 'PUL-001', date: '2026-09-10', units_sold: 2 },
  { id: 20, product_sku: 'PUL-001', date: '2026-09-15', units_sold: 3 },
  { id: 21, product_sku: 'PUL-001', date: '2026-09-20', units_sold: 4 },
  { id: 22, product_sku: 'PUL-001', date: '2026-09-25', units_sold: 5 },
  { id: 23, product_sku: 'PUL-001', date: '2026-09-30', units_sold: 4 },
  { id: 24, product_sku: 'PUL-001', date: '2026-10-05', units_sold: 6 },
  { id: 25, product_sku: 'BRA-001', date: '2026-09-10', units_sold: 1 },
  { id: 26, product_sku: 'BRA-001', date: '2026-09-15', units_sold: 2 },
  { id: 27, product_sku: 'BRA-001', date: '2026-09-20', units_sold: 3 },
  { id: 28, product_sku: 'BRA-001', date: '2026-09-25', units_sold: 2 },
  { id: 29, product_sku: 'BRA-001', date: '2026-09-30', units_sold: 4 },
  { id: 30, product_sku: 'BRA-001', date: '2026-10-05', units_sold: 5 }
];

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

      let finalProducts = (resProd || []).map(normalizeProduct);
      let finalCategories = resCat || [];
      let finalDemand = (resDemand && resDemand.length > 0) ? resDemand.map(normalizeDemandRecord) : DEFAULT_DEMAND;

      // Sincronização e persistência no navegador para ambientes serverless
      try {
        const localOverrides = JSON.parse(localStorage.getItem('flora_local_products') || '{}');
        const deletedIds = JSON.parse(localStorage.getItem('flora_deleted_products') || '[]');

        // Remove deletados
        finalProducts = finalProducts.filter(p => !deletedIds.includes(p.id));

        // Aplica alterações/novos produtos locais
        Object.values(localOverrides).forEach(localP => {
          const idx = finalProducts.findIndex(p => p.id === localP.id);
          if (idx >= 0) {
            finalProducts[idx] = { ...finalProducts[idx], ...localP };
          } else if (!deletedIds.includes(localP.id)) {
            finalProducts.push(normalizeProduct(localP));
          }
        });

        // Categorias locais
        const localCats = JSON.parse(localStorage.getItem('flora_local_categories') || '[]');
        const deletedCats = JSON.parse(localStorage.getItem('flora_deleted_categories') || '[]');
        finalCategories = finalCategories.filter(c => !deletedCats.includes(c.id));
        localCats.forEach(lc => {
          if (!finalCategories.some(c => c.id === lc.id) && !deletedCats.includes(lc.id)) {
            finalCategories.push(lc);
          }
        });
      } catch (e) {
        console.warn('Erro ao sincronizar cache local:', e);
      }

      setProducts(finalProducts);
      setCategories(finalCategories);
      setDemandRecords(finalDemand);
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
    let created = null;
    try {
      const res = await fetch('/api/v1/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      if (res.ok) created = await res.json();
    } catch (e) {
      console.warn('Falha na API ao adicionar produto, usando persistência resiliente:', e);
    }

    const normalized = normalizeProduct(created || {
      id: productData.id_prod || productData.sku || `PROD-${Date.now()}`,
      sku: productData.id_prod || productData.sku || `PROD-${Date.now()}`,
      name: productData.descricao || productData.name,
      category: productData.categoria || productData.category,
      unit_price: Number(productData.valor || productData.unit_price || 0),
      stock: Number(productData.estoque || productData.stock || 0),
      minimum_stock: Number(productData.estoque_minimo || productData.minimum_stock || 10)
    });

    try {
      const localOverrides = JSON.parse(localStorage.getItem('flora_local_products') || '{}');
      localOverrides[normalized.id] = normalized;
      localStorage.setItem('flora_local_products', JSON.stringify(localOverrides));
    } catch {}

    setProducts((prev) => [...prev, normalized]);
    return normalized;
  };

  const updateProduct = async (id, productData) => {
    let updated = null;
    try {
      const res = await fetch(`/api/v1/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      if (res.ok) updated = await res.json();
    } catch (e) {
      console.warn('Falha na API ao atualizar produto, usando persistência resiliente:', e);
    }

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const merged = normalizeProduct({ ...p, ...(updated || productData) });
          try {
            const localOverrides = JSON.parse(localStorage.getItem('flora_local_products') || '{}');
            localOverrides[id] = merged;
            localStorage.setItem('flora_local_products', JSON.stringify(localOverrides));
          } catch {}
          return merged;
        }
        return p;
      })
    );
  };

  const deleteProduct = async (id) => {
    try {
      await fetch(`/api/v1/products/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Falha na API ao deletar produto:', e);
    }

    try {
      const deletedIds = JSON.parse(localStorage.getItem('flora_deleted_products') || '[]');
      if (!deletedIds.includes(id)) {
        deletedIds.push(id);
        localStorage.setItem('flora_deleted_products', JSON.stringify(deletedIds));
      }
      const localOverrides = JSON.parse(localStorage.getItem('flora_local_products') || '{}');
      delete localOverrides[id];
      localStorage.setItem('flora_local_products', JSON.stringify(localOverrides));
    } catch {}

    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const addCategory = async (categoryData) => {
    let created = null;
    try {
      const res = await fetch('/api/v1/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData)
      });
      if (res.ok) created = await res.json();
    } catch (e) {
      console.warn('Falha na API ao adicionar categoria:', e);
    }

    const finalCat = created || {
      id: Date.now(),
      name: categoryData.nome || categoryData.name,
      nome: categoryData.nome || categoryData.name,
      slug: (categoryData.slug || categoryData.nome || categoryData.name || '').toLowerCase()
    };

    try {
      const localCats = JSON.parse(localStorage.getItem('flora_local_categories') || '[]');
      localCats.push(finalCat);
      localStorage.setItem('flora_local_categories', JSON.stringify(localCats));
    } catch {}

    setCategories((prev) => [...prev, finalCat]);
    return finalCat;
  };

  const deleteCategory = async (id) => {
    try {
      await fetch(`/api/v1/categories/${id}`, { method: 'DELETE' });
    } catch (e) {}

    try {
      const deletedCats = JSON.parse(localStorage.getItem('flora_deleted_categories') || '[]');
      deletedCats.push(id);
      localStorage.setItem('flora_deleted_categories', JSON.stringify(deletedCats));
    } catch {}

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