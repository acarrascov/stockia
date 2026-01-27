/**
 * Products Controller (CRUD)
 * - Admin only (por rutas)
 * - Firestore: colección "products"
 */
const { db } = require("../config/firebase");
const { getTenantAndPlan } = require("../services/tenantPlan.service");

function nowISO() {
  return new Date().toISOString();
}

// Valida payload de producto (crear o actualizar). Payload es el body de la request.
// esta función se usa tanto para crear como para actualizar (parcial) y valida los campos necesarios
// Retorna { ok: boolean, errors: [string], normalized: object }
function validateProductPayload(body, { partial = false } = {}) {
  const errors = [];

  const isDefined = (v) => v !== undefined;
  const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;
  const isInt = (v) => Number.isInteger(v);
  const toInt = (v) => (typeof v === "string" && v.trim() !== "" ? Number(v) : v);

  // Normalizamos números si vienen como string (Thunder a veces manda "24990")
  const normalized = { ...body };
  if (isDefined(normalized.price)) normalized.price = toInt(normalized.price);
  if (isDefined(normalized.stock)) normalized.stock = toInt(normalized.stock);

  // name
  if (!partial || isDefined(normalized.name)) {
    if (!isNonEmptyString(normalized.name)) errors.push("name requerido (string)");
  }

  // sku
  if (!partial || isDefined(normalized.sku)) {
    if (!isNonEmptyString(normalized.sku)) errors.push("sku requerido (string)");
  }

  // category
  if (!partial || isDefined(normalized.category)) {
    if (!isNonEmptyString(normalized.category)) errors.push("category requerido (string)");
  }

  // price (CLP -> entero, sin decimales)
  if (!partial || isDefined(normalized.price)) {
    if (!isInt(normalized.price) || normalized.price < 0)
      errors.push("price debe ser entero >= 0 (CLP)");
  }

  // stock
  if (!partial || isDefined(normalized.stock)) {
    if (!isInt(normalized.stock) || normalized.stock < 0)
      errors.push("stock debe ser entero >= 0");
  }

  // currency: fijo CLP (si viene y no es CLP -> error)
  if (isDefined(normalized.currency) && normalized.currency !== "CLP") {
    errors.push("currency debe ser 'CLP'");
  }

  // active
  if (isDefined(normalized.active) && typeof normalized.active !== "boolean") {
    errors.push("active debe ser boolean");
  }

  return { ok: errors.length === 0, errors, normalized };
}

async function assertSkuUnique(sku, excludeId = null) { 
  const snap = await db
    .collection("products")
    .where("sku", "==", sku)
    .limit(5)
    .get();

  if (snap.empty) return;

  // Si estamos editando, permitimos el mismo SKU solo si es el mismo documento
  const existsOther = snap.docs.some((d) => d.id !== excludeId);
  if (existsOther) {
    const err = new Error("SKU ya existe");
    err.statusCode = 409;
    throw err;
  }
}



// POST /products
async function createProduct(req, res) {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ ok: false, message: "No autorizado" });

    // ✅ Tenant + Plan
    const { tenantId, planId, plan } = await getTenantAndPlan(req);

    // ✅ Límite de productos según plan
    const maxProducts = Number(plan?.limits?.products ?? 0); // basic=200, pro=2000, full=0/undefined (ilimitado)
    if (Number.isFinite(maxProducts) && maxProducts > 0) {
      // Contamos SOLO productos activos del tenant
      const countSnap = await db
        .collection("products")
        .where("tenantId", "==", tenantId)
        .where("active", "==", true)
        .count()
        .get();

      const current = Number(countSnap.data()?.count ?? 0);

      if (current >= maxProducts) {
        return res.status(403).json({
          ok: false,
          message: `Límite de productos alcanzado (${current}/${maxProducts}) para el plan ${planId}.`,
        });
      }
    }

    // ✅ Validación payload (tu lógica existente)
    const { ok, errors, normalized } = validateProductPayload(req.body, { partial: false });
    if (!ok) return res.status(400).json({ ok: false, errors });

    // Normalizado: name, sku, category, price, stock, active?, currency?
    const now = nowISO();

    // Asegurar SKU único (tu helper)
    await assertSkuUnique(normalized.sku);

    const doc = {
      tenantId,
      planId, // opcional pero útil para auditoría
      ...normalized,
      currency: "CLP",
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    const ref = await db.collection("products").add(doc);

    return res.status(201).json({ ok: true, id: ref.id, item: { id: ref.id, ...doc } });
  } catch (err) {
    console.error("createProduct error:", err);
    return res.status(400).json({ ok: false, message: err.message || "Error creando producto" });
  }
}


// GET /api/products
async function productsList(req, res) {
  try {
    // ✅ Solo admin puede pedir inactivos
    const includeInactive =
      (req.query.includeInactive === "1" || req.query.includeInactive === "true") &&
      req.user?.claims?.role === "admin";

    let query = db.collection("products");

    // ✅ Por defecto: solo activos
    if (!includeInactive) {
      query = query.where("active", "==", true);
    }

    // (si ya tienes paginación/orden, déjalo como lo tenías)
    const snap = await query.get();

    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    return res.json({ ok: true, items });
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message });
  }
}

// GET /api/products/:id
async function getProductById(req, res) {
  try {
    const { id } = req.params;

    const ref = db.collection("products").doc(id);
    const snap = await ref.get();

    if (!snap.exists) {
      return res.status(404).json({ ok: false, message: "Producto no encontrado" });
    }

    return res.json({ ok: true, item: { id: snap.id, ...snap.data() } });
  } catch (err) {
    return res.status(500).json({ ok: false, message: "Error al obtener producto", error: err.message });
  }
}

// PUT /api/products/:id
async function updateProduct(req, res) {
  try {
    const { id } = req.params;

    // Campos permitidos a actualizar
    const allowed = ["name", "sku", "category", "price", "stock", "active"];

    // Construir objeto updates solo con campos enviados
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        ok: false,
        message: "No hay campos para actualizar",
      });
    }

    // Validación parcial
    const { ok, errors, normalized } = validateProductPayload(updates, {
      partial: true,
    });
    if (!ok) {
      return res.status(400).json({ ok: false, errors });
    }

    // Aplicar valores normalizados
    Object.assign(updates, normalized);

    const ref = db.collection("products").doc(id);
    const snap = await ref.get();

    if (!snap.exists) {
      return res.status(404).json({
        ok: false,
        message: "Producto no encontrado",
      });
    }

    // 👉 Paso 3: validar SKU único (solo si se está modificando)
    if (updates.sku !== undefined) {
      await assertSkuUnique(updates.sku, id); // lanza 409 si existe otro
    }

    // Forzar CLP si se toca el precio
    if (updates.price !== undefined) {
      updates.currency = "CLP";
    } else {
      delete updates.currency;
    }

    updates.updatedAt = new Date().toISOString();

    // Actualizar
    await ref.update(updates);

    const updated = await ref.get();

    return res.json({
      ok: true,
      id,
      item: {
        id: updated.id,
        ...updated.data(),
      },
    });
  } catch (err) {
    console.error("updateProduct error:", err);

    // SKU duplicado
    if (err.status === 409) {
      return res.status(409).json({
        ok: false,
        message: err.message,
      });
    }

    return res.status(500).json({
      ok: false,
      message: "Error actualizando producto",
    });
  }
}

// DELETE (soft) /api/products/:id
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const ref = db.collection("products").doc(id);
    const snap = await ref.get();

    if (!snap.exists) {
      return res.status(404).json({ ok: false, message: "Producto no existe" });
    }

    await ref.update({
      active: false,
      updatedAt: new Date().toISOString(),
    });

    return res.json({
      ok: true,
      message: "Producto desactivado",
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Error al desactivar",
      error: error.message,
    });
  }
};


module.exports = { createProduct, productsList, getProductById, updateProduct, deleteProduct};