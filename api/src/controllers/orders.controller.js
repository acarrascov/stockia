// src/controllers/orders.controller.js
const { db } = require("../config/firebase");

// Helpers
function nowISO() {
  return new Date().toISOString();
}

// GET /orders
// - admin: ve todos
// - user: ve solo los suyos
async function listOrders(req, res) {
  try {
    const uid = req.user?.uid;
    const role = req.user?.role || req.user?.claims?.role; // según cómo lo guardes

    let q = db.collection("orders");

    if (role !== "admin") {
      q = q.where("userId", "==", uid);
    }

    const snap = await q.orderBy("createdAt", "desc").get();
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return res.json({ ok: true, items });
  } catch (err) {
    console.error("listOrders error:", err);
    return res.status(500).json({ ok: false, message: "Error listando pedidos" });
  }
}

// POST /orders
// Crea un pedido simple desde el carrito (items + total)
// body esperado:
// { items: [{ productId, name, price, qty }], total }
async function createOrder(req, res) {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ ok: false, message: "No autorizado" });

    const { items, total } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ ok: false, message: "Items inválidos" });
    }

    const totalNum = Number(total);
    if (!Number.isFinite(totalNum) || totalNum < 0) {
      return res.status(400).json({ ok: false, message: "Total inválido" });
    }

    // Normalización mínima
    const normItems = items.map((it) => ({
      productId: String(it.productId || ""),
      name: String(it.name || ""),
      price: Number(it.price || 0),
      qty: Number(it.qty || 0),
    }));

    // Validación mínima por item
    for (const it of normItems) {
      if (!it.productId) {
        return res.status(400).json({ ok: false, message: "productId faltante" });
      }
      if (!Number.isFinite(it.price) || it.price < 0) {
        return res.status(400).json({ ok: false, message: "price inválido" });
      }
      if (!Number.isFinite(it.qty) || it.qty <= 0) {
        return res.status(400).json({ ok: false, message: "qty inválido" });
      }
    }

    const now = nowISO();

    // Documento base de la orden
    const orderDoc = {
      userId: uid,
      items: normItems,
      total: totalNum,
      currency: "CLP",
      status: "pending", // pending | paid | cancelled
      createdAt: now,
      updatedAt: now,
    };

    // ✅ Transacción: valida y descuenta stock + crea la orden
    const result = await db.runTransaction(async (tx) => {
      // 1) Leer y validar stock de todos los productos
      const productRefs = normItems.map((it) => db.collection("products").doc(it.productId));
      const productSnaps = await Promise.all(productRefs.map((ref) => tx.get(ref)));

      for (let i = 0; i < normItems.length; i++) {
        const it = normItems[i];
        const snap = productSnaps[i];

        if (!snap.exists) {
          throw new Error(`Producto no encontrado: ${it.productId}`);
        }

        const data = snap.data() || {};
        const currentStock = Number(data.stock ?? 0);

        if (!Number.isFinite(currentStock)) {
          throw new Error(`Stock inválido en producto: ${it.productId}`);
        }

        if (currentStock < it.qty) {
          throw new Error(`Stock insuficiente para "${data.name ?? it.productId}" (stock: ${currentStock}, pedido: ${it.qty})`);
        }
      }

      // 2) Descontar stock
      for (let i = 0; i < normItems.length; i++) {
        const it = normItems[i];
        const ref = productRefs[i];
        const currentStock = Number(productSnaps[i].data().stock ?? 0);
        tx.update(ref, { stock: currentStock - it.qty, updatedAt: now });
      }

      // 3) Crear la orden
      const orderRef = db.collection("orders").doc(); // id generado
      tx.set(orderRef, orderDoc);

      return { orderId: orderRef.id };
    });

    return res.status(201).json({
      ok: true,
      id: result.orderId,
      item: { id: result.orderId, ...orderDoc },
    });
  } catch (err) {
    console.error("createOrder error:", err);
    // Mensaje “amigable” con la causa (stock insuficiente, etc.)
    return res.status(400).json({ ok: false, message: err.message || "Error creando pedido" });
  }
}

// PUT /orders/:id/status (solo admin)
// body esperado: { status: "pending" | "paid" | "cancelled" }
async function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ["pending", "paid", "cancelled"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ ok: false, message: "Estado inválido" });
    }

    const ref = db.collection("orders").doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ ok: false, message: "Pedido no encontrado" });

    await ref.update({ status, updatedAt: nowISO() });

    const updated = await ref.get();
    return res.json({ ok: true, id, item: { id: updated.id, ...updated.data() } });
  } catch (err) {
    console.error("updateOrderStatus error:", err);
    return res.status(500).json({ ok: false, message: "Error actualizando pedido" });
  }
}

module.exports = {
  listOrders,
  createOrder,
  updateOrderStatus,
};