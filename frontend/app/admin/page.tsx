"use client";

/**
 * AdminPage (Panel Admin)
 * ======================
 * - Página protegida por AdminGuard (solo admin)
 * - Lee el idToken desde Firebase Auth
 * - Consume backend protegido:
 *    GET    /products           -> listar
 *    POST   /products           -> crear
 *    PUT    /products/:id       -> editar / activar / desactivar
 *
 * Nota: UI simple, es funcional primero.
 */

import { useEffect, useState } from "react";
import AdminGuard from "../components/AdminGuard";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebaseClient";
import { apiAuthGet, apiAuthPost, apiAuthPut } from "../lib/apiAuth";

type Product = {
  id: string;
  name: string;
  sku: string;
  category?: string | null;
  price: number;
  stock: number;
  active: boolean;
};

export default function AdminPage() {
  // =========================
  // Estado general (tabla)
  // =========================
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Token para llamadas protegidas
  const [token, setToken] = useState<string>("");

  // =========================
  // Modal + formulario
  // =========================
  const [isOpen, setIsOpen] = useState(false);

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState<string>("");
  const [stock, setStock] = useState<string>("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  // =========================
  // Helpers
  // =========================
  function resetForm() {
    setName("");
    setSku("");
    setCategory("");
    setPrice("");
    setStock("");
    setEditingId(null);
  }

  function openCreate() {
    resetForm();
    setIsOpen(true);
  }

  function openEdit(p: Product) {
    setEditingId(p.id);
    setName(p.name ?? "");
    setSku(p.sku ?? "");
    setCategory(p.category ?? "");
    setPrice(String(p.price ?? ""));
    setStock(String(p.stock ?? ""));
    setIsOpen(true);
  }

  async function refreshProducts(t: string, includeInactive: boolean) {
    const url = includeInactive ? "/products?includeInactive=1" : "/products";
    const data = await apiAuthGet(url, t);
    const items: Product[] = Array.isArray(data) ? data : data.items ?? [];
    setProducts(items);
  }

  // Helper pro: traer token fresco (evita 401 por token viejo)
  async function getFreshToken(): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error("Sesión perdida. Vuelve a iniciar sesión.");
    const tokenResult = await user.getIdTokenResult(true);
    const t = tokenResult.token;
    setToken(t);
    return t;
  }

  // =========================
  // 1) Al montar: sesión + listar
  // =========================
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        setErr("");
        setLoading(true);

        if (!user) {
          setToken("");
          setProducts([]);
          return;
        }

        const tokenResult = await user.getIdTokenResult(true);
        const t = tokenResult.token;

        setToken(t);
        await refreshProducts(t, showInactive);
      } catch (e: any) {
        setProducts([]);
        setErr(e?.message ?? String(e));
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  // =========================
  // 2) Crear / Editar
  // =========================
  async function saveProduct() {
    try {
      setErr("");

      // token fresco para evitar 401
      const t = await getFreshToken();

      if (!name.trim()) throw new Error("Falta nombre.");
      if (!sku.trim()) throw new Error("Falta SKU.");
      if (!category.trim()) throw new Error("Falta categoría.");

      const priceNum = Number(price);
      const stockNum = Number(stock);

      if (!Number.isFinite(priceNum) || priceNum < 0)
        throw new Error("Precio inválido.");
      if (!Number.isFinite(stockNum) || stockNum < 0)
        throw new Error("Stock inválido.");

      const payload = {
        name: name.trim(),
        sku: sku.trim(),
        category: category.trim(),
        price: priceNum,
        stock: stockNum,
      };

      if (editingId) {
        await apiAuthPut(`/products/${editingId}`, t, payload);
      } else {
        await apiAuthPost("/products", t, payload);
      }

      await refreshProducts(t, showInactive);

      setIsOpen(false);
      resetForm();
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    }
  }

  // =========================
  // 3) Activar / Desactivar
  // =========================
  async function toggleActive(p: Product) {
    try {
      setErr("");

      // token fresco para evitar 401
      const t = await getFreshToken();

      const ok = confirm(
        p.active
          ? "¿Seguro que quieres desactivar este producto?"
          : "¿Seguro que quieres reactivar este producto?"
      );
      if (!ok) return;

      await apiAuthPut(`/products/${p.id}`, t, { active: !p.active });
      await refreshProducts(t, showInactive);
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    }
  }

  // =========================
  // Render
  // =========================
  return (
    <AdminGuard>
      <main className="p-8 text-white space-y-6">
        <a href="/demo" className="underline text-sm opacity-80">
          Ir a login (/demo)
        </a>

        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Panel de Administración</h1>

          <button
            onClick={openCreate}
            className="px-4 py-2 rounded bg-green-600 text-white"
          >
            + Agregar producto
          </button>
        </div>

        {loading && <p className="opacity-70">Cargando productos...</p>}

        {err && (
          <div className="bg-red-900/60 p-3 rounded text-sm break-words">
            API error: {err}
          </div>
        )}

        <label className="flex items-center gap-2 text-sm opacity-90">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={async (e) => {
              try {
                const v = e.target.checked;
                setShowInactive(v);

                const t = token ? token : await getFreshToken();
                await refreshProducts(t, v);
              } catch (e2: any) {
                setErr(e2?.message ?? String(e2));
              }
            }}
          />
          Mostrar inactivos
        </label>

        {!loading && !err && (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-white/20 text-sm">
              <thead className="bg-white/10">
                <tr>
                  <th className="px-3 py-2 border">Nombre</th>
                  <th className="px-3 py-2 border">SKU</th>
                  <th className="px-3 py-2 border">Categoría</th>
                  <th className="px-3 py-2 border">Precio (CLP)</th>
                  <th className="px-3 py-2 border">Stock</th>
                  <th className="px-3 py-2 border">Estado</th>
                  <th className="px-3 py-2 border">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="px-3 py-2 border">{p.name}</td>
                    <td className="px-3 py-2 border">{p.sku}</td>
                    <td className="px-3 py-2 border">{p.category ?? "-"}</td>
                    <td className="px-3 py-2 border">
                      ${Number(p.price ?? 0).toLocaleString("es-CL")}
                    </td>
                    <td className="px-3 py-2 border">{p.stock}</td>
                    <td className="px-3 py-2 border">
                      {p.active ? (
                        <span className="text-green-400">Activo</span>
                      ) : (
                        <span className="text-red-400">Inactivo</span>
                      )}
                    </td>

                    <td className="px-3 py-2 border">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(p)}
                          className="px-2 py-1 rounded bg-blue-600 text-white text-xs"
                        >
                          Editar
                        </button>

                        <button
                          onClick={() => toggleActive(p)}
                          className="px-2 py-1 rounded bg-red-600 text-white text-xs"
                        >
                          {p.active ? "Desactivar" : "Reactivar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {products.length === 0 && (
                  <tr>
                    <td className="px-3 py-2 border opacity-70" colSpan={7}>
                      Sin productos
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {isOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded bg-zinc-900 border border-white/10 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  {editingId ? "Editar producto" : "Agregar producto"}
                </h2>

                <button
                  onClick={() => {
                    setIsOpen(false);
                    resetForm();
                  }}
                  className="px-3 py-1 rounded bg-white/10 hover:bg-white/20"
                >
                  Cerrar
                </button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm opacity-80">Nombre</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-black/30 border border-white/10"
                    placeholder="Ej: Mouse Logitech"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm opacity-80">SKU</label>
                  <input
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-black/30 border border-white/10"
                    placeholder="Ej: SKU-001"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm opacity-80">Categoría</label>
                  <input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-black/30 border border-white/10"
                    placeholder="Ej: Periféricos"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-sm opacity-80">Precio (CLP)</label>
                    <input
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-black/30 border border-white/10"
                      placeholder="Ej: 9990"
                      inputMode="numeric"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm opacity-80">Stock</label>
                    <input
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-black/30 border border-white/10"
                      placeholder="Ej: 15"
                      inputMode="numeric"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      resetForm();
                    }}
                    className="px-4 py-2 rounded bg-white/10 hover:bg-white/20"
                  >
                    Cancelar
                  </button>

                  <button
                    onClick={saveProduct}
                    className="px-4 py-2 rounded bg-green-600 text-white"
                  >
                    {editingId ? "Guardar cambios" : "Guardar"}
                  </button>
                </div>

                <p className="text-xs opacity-60">
                  * Precio y stock se mandan como número al backend. Precio en
                  CLP.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </AdminGuard>
  );
}