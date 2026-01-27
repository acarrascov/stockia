// src/controllers/orders.controller.js
const { db } = require("../config/firebase");
const { getTenantAndPlan } = require("../services/tenantPlan.service");

// Helpers
function nowISO() {
  return new Date().toISOString();
}

// GET /orders
// Lista pedidos del tenant, ordenados por createdAt desc
// Query opcional: ?limit=20&cursor=2025-12-30T00:00:00.000Z
async function listOrders(req, res) {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ ok: false, message: "No autorizado" });

    const { tenantId } = await getTenantAndPlan(req);

    const limitRaw = Number(req.query.limit ?? 20);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 50) : 20;

    const cursor = req.query.cursor ? String(req.query.cursor) : null;

    let q = db
      .collection("orders")
      .where("tenantId", "==", tenantId)
      .orderBy("createdAt", "desc")
      .limit(limit);

    if (cursor) q = q.startAfter(cursor);

    const snap = await q.get();
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const nextCursor = items.length > 0 ? items[items.length - 1].createdAt : null;

    return res.json({ ok: true, items, nextCursor });
  } catch (err) {
    console.error("listOrders error:", err);
    return res.status(400).json({ ok: false, message: err.message || "Error listando pedidos" });
  }
}

// POST /orders
// body esperado: { items: [{ productId, name, price, qty }], total }
async function createOrder(req, res) {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ ok: false, message: "No autorizado" });

    const { tenantId, planId, plan } = await getTenantAndPlan(req);

    const { items, total } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ ok: false, message: "Items inválidos" });
    }

    const totalNum = Number(total);
    if (!Number.isFinite(totalNum) || totalNum < 0) {
      return res.status(400).json({ ok: false, message: "Total inválido" });
    }

    const normItems = items.map((it) => ({
      productId: String(it.productId || ""),
      name: String(it.name || ""),
      price: Number(it.price || 0),
      qty: Number(it.qty || 0),
    }));

    for (const it of normItems) {
      if (!it.productId) return res.status(400).json({ ok: false, message: "productId faltante" });
      if (!Number.isFinite(it.price) || it.price < 0) return res.status(400).json({ ok: false, message: "price inválido" });
      if (!Number.isFinite(it.qty) || it.qty <= 0) return res.status(400).json({ ok: false, message: "qty inválido" });
    }

    const now = nowISO();
    const monthKey = now.slice(0, 7); // "YYYY-MM"
    const usageDocId = `${tenantId}_${monthKey}`;

    const orderDoc = {
      tenantId,
      planId,
      userId: uid,
      items: normItems,
      total: totalNum,
      currency: "CLP",
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };

    const maxOrdersPerMonth = Number(plan?.limits?.ordersPerMonth ?? 0);

    const result = await db.runTransaction(async (tx) => {
      // ===== READS primero =====
      const productRefs = normItems.map((it) => db.collection("products").doc(it.productId));
      const usageRef = db.collection("usage").doc(usageDocId);

      const [usageSnap, ...productSnaps] = await Promise.all([
        tx.get(usageRef),
        ...productRefs.map((ref) => tx.get(ref)),
      ]);

      // ===== Validar usage mensual =====
      const currentOrdersUsed = usageSnap.exists ? Number(usageSnap.data()?.ordersUsed ?? 0) : 0;

      if (!Number.isFinite(currentOrdersUsed) || currentOrdersUsed < 0) {
        throw new Error("Contador mensual inválido (usage.ordersUsed)");
      }

      if (Number.isFinite(maxOrdersPerMonth) && maxOrdersPerMonth > 0) {
        if (currentOrdersUsed >= maxOrdersPerMonth) {
          throw new Error(`Límite mensual de pedidos alcanzado (${currentOrdersUsed}/${maxOrdersPerMonth})`);
        }
      }

      // ===== Validar stock + tenant =====
      for (let i = 0; i < normItems.length; i++) {
        const it = normItems[i];
        const snap = productSnaps[i];

        if (!snap.exists) throw new Error(`Producto no encontrado: ${it.productId}`);

        const data = snap.data() || {};

        // Multi-tenant
        if (data.tenantId && data.tenantId !== tenantId) {
          throw new Error(`Producto no pertenece al tenant: ${it.productId}`);
        }

        const currentStock = Number(data.stock ?? 0);
        if (!Number.isFinite(currentStock)) throw new Error(`Stock inválido en producto: ${it.productId}`);

        if (currentStock < it.qty) {
          throw new Error(
            `Stock insuficiente para "${data.name ?? it.productId}" (stock: ${currentStock}, pedido: ${it.qty})`
          );
        }
      }

      // ===== WRITES =====

      // Descontar stock
      for (let i = 0; i < normItems.length; i++) {
        const it = normItems[i];
        const ref = productRefs[i];
        const currentStock = Number(productSnaps[i].data()?.stock ?? 0);
        tx.update(ref, { stock: currentStock - it.qty, updatedAt: now });
      }

      // Incrementar usage mensual
      tx.set(
        usageRef,
        {
          tenantId,
          month: monthKey,
          ordersUsed: currentOrdersUsed + 1,
          updatedAt: now,
        },
        { merge: true }
      );

      // Crear orden
      const orderRef = db.collection("orders").doc();
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