"use client";

import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebaseClient";
import { apiAuthGet, apiAuthPost } from "../lib/apiAuth";

type Product = {
  id: string;
  name: string;
  sku: string;
  category?: string | null;
  price: number;
  stock: number;
  active: boolean;
};

type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
};

export default function UserPage() {
  const [token, setToken] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        setErr("");
        setLoading(true);

        // Si NO hay sesión, igual mostraremos la tienda “pública” SIN token
        if (!user) {
          setToken("");
          // Ojo: si tu backend requiere token incluso para listar,
          // me dices y lo ajustamos.
          const data = await apiAuthGet("/products", ""); // puede fallar si backend exige token
          const items: Product[] = Array.isArray(data) ? data : data.items ?? [];
          setProducts(items.filter((p) => p.active));
          return;
        }

        const tokenResult = await user.getIdTokenResult(true);
        const t = tokenResult.token;
        setToken(t);

        const data = await apiAuthGet("/products", t);
        const items: Product[] = Array.isArray(data) ? data : data.items ?? [];
        setProducts(items.filter((p) => p.active));
      } catch (e: any) {
        setProducts([]);
        setErr(e?.message ?? String(e));
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  function addToCart(p: Product) {
    setCart((prev) => {
      const found = prev.find((x) => x.id === p.id);
      if (found) {
        return prev.map((x) => (x.id === p.id ? { ...x, qty: x.qty + 1 } : x));
      }
      return [...prev, { id: p.id, name: p.name, price: p.price, qty: 1 }];
    });
  }

  function removeFromCart(id: string) {
    setCart((prev) => prev.filter((x) => x.id !== id));
  }

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

async function handlePay() {
  try {
    if (cart.length === 0) {
      alert("El carrito está vacío");
      return;
    }

    if (!token) {
      alert("Debes iniciar sesión para pagar");
      return;
    }

    const orderPayload = {
      items: cart.map((i) => ({
        productId: i.id,
        name: i.name,
        price: i.price,
        qty: i.qty,
      })),
      total,
      currency: "CLP",
      customer: { name: "Cliente demo", email: "cliente@demo.cl" },
    };

    const data = await apiAuthPost("/orders", token, orderPayload);

    console.log("Orden creada:", data);
    alert("Orden creada correctamente (estado: pendiente)");

    // 1) Limpia carrito
    setCart([]);

    // 2) Refresca productos
    const dataProducts = await apiAuthGet("/products", token);
    const items: Product[] = Array.isArray(dataProducts)
      ? dataProducts
      : dataProducts.items ?? [];
    setProducts(items.filter((p) => p.active));
  } catch (err: any) {
    console.error(err);
    alert(err.message || "Error en el pago");
  }
}

  return (
    <AppShell title="Stockia - Tienda">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold">Productos</h1>
          <a href="/demo" className="text-sm underline opacity-80">
            Ir a login (/demo)
          </a>
        </div>

        {loading && <p className="text-white/70">Cargando...</p>}

        {err && (
          <div className="bg-red-900/60 p-3 rounded text-sm break-words">
            Error: {err}
          </div>
        )}

        {!loading && !err && (
          <div className="grid md:grid-cols-2 gap-3">
            {products.map((p) => (
              <div
                key={p.id}
                className="border border-white/10 rounded p-4 bg-black/20 flex items-start justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-xs opacity-70">{p.category ?? "Sin categoría"}</div>
                  <div className="text-sm">
                    ${Number(p.price ?? 0).toLocaleString("es-CL")} CLP
                  </div>
                  <div className="text-xs opacity-70">Stock: {p.stock}</div>
                </div>

                <button
                  onClick={() => addToCart(p)}
                  className="px-3 py-2 rounded bg-green-600 text-white text-sm"
                  disabled={p.stock <= 0}
                >
                  Agregar
                </button>
              </div>
            ))}

            {products.length === 0 && (
              <p className="text-white/70">No hay productos activos.</p>
            )}
          </div>
        )}

        {/* Carrito simple */}
        <div className="border border-white/10 rounded p-4 bg-black/20">
          <h2 className="text-lg font-semibold">Carrito</h2>

          {cart.length === 0 ? (
            <p className="text-white/70 mt-2">Vacío</p>
          ) : (
            <div className="mt-3 space-y-2">
              {cart.map((i) => (
                <div key={i.id} className="flex items-center justify-between gap-4">
                  <div className="text-sm">
                    {i.name} <span className="opacity-70">x{i.qty}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm">
                      ${Number(i.price * i.qty).toLocaleString("es-CL")}
                    </div>
                    <button
                      onClick={() => removeFromCart(i.id)}
                      className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-xs"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ))}

              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <div className="font-semibold">Total</div>
                <div className="font-semibold">${total.toLocaleString("es-CL")} CLP</div>
              </div>

              <button
                className="mt-2 px-4 py-2 rounded bg-blue-600 text-white text-sm w-full"
                onClick={handlePay}
              >
                Pagar
              </button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}