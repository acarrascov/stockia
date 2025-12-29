"use client";

import { useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    sku: string;
    category: string;
    price: number;
    stock: number;
    active: boolean;
  }) => void;
};

export default function AddProductModal({ open, onClose, onSubmit }: Props) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [active, setActive] = useState(true);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ name, sku, category, price, stock, active });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />

      {/* modal */}
      <div className="relative w-full max-w-lg rounded-xl border border-white/15 bg-black/80 p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Agregar producto</h2>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-white/10 hover:bg-white/20"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="text-sm opacity-80">Nombre</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded bg-white/10 border border-white/15 px-3 py-2"
              placeholder="Mouse Logitech"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm opacity-80">SKU</label>
              <input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="mt-1 w-full rounded bg-white/10 border border-white/15 px-3 py-2"
                placeholder="MOU-LOG-001"
                required
              />
            </div>

            <div>
              <label className="text-sm opacity-80">Categoría</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded bg-white/10 border border-white/15 px-3 py-2"
                placeholder="Periféricos"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm opacity-80">Precio (CLP)</label>
              <input
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="mt-1 w-full rounded bg-white/10 border border-white/15 px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="text-sm opacity-80">Stock</label>
              <input
                type="number"
                min={0}
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className="mt-1 w-full rounded bg-white/10 border border-white/15 px-3 py-2"
                required
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            Activo
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-white/10 hover:bg-white/20"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-green-600 hover:bg-green-500"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}