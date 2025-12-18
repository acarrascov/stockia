/**
 * Products Controller (CRUD)
 * - Admin only (por rutas)
 * - Firestore: colección "products"
 */
const { db } = require("../config/firebase");


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

// POST /api/products  -> crear producto
async function createProduct(req, res) {
  try {
    const { ok, errors, normalized } = validateProductPayload(req.body);
    if (!ok) return res.status(400).json({ ok: false, errors });

    const { name, sku, category, price, stock } = normalized;

    const now = new Date().toISOString();

    const docRef = await db.collection("products").add({
      name: name.trim(),
      sku: sku.trim(),
      category: category ? category.trim() : null,
      price,
      currency: "CLP",
      stock,
      active: true,
      createdAt: now,
      updatedAt: now,
    });

    return res.status(201).json({ ok: true, id: docRef.id });
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message });
  }
}

// GET /api/products
async function productsList(req, res) {
  try {
    const limitNum = Math.min(parseInt(req.query.limit || "20", 10), 50); // max 50
    const cursor = req.query.cursor || null;
    const all = req.query.all === "true";

    let q = db.collection("products").orderBy("createdAt", "desc").limit(limitNum);

    // por defecto solo activos
    if (!all) q = q.where("active", "==", true);

    // cursor: buscamos el doc del último id y usamos startAfter(doc)
    if (cursor) {
      const lastDoc = await db.collection("products").doc(cursor).get();
      if (lastDoc.exists) {
        q = q.startAfter(lastDoc);
      }
    }

    const snap = await q.get();

    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const nextCursor = snap.docs.length ? snap.docs[snap.docs.length - 1].id : null;

    return res.json({ ok: true, items, nextCursor, limit: limitNum, all });
  } catch (err) {
    return res.status(500).json({ ok: false, message: "Error listando productos", error: err.message });
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

    const allowed = ["name", "sku", "category", "price", "stock", "active"];

    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ ok: false, message: "No hay campos para actualizar" });
    }

    const { ok, errors, normalized } = validateProductPayload(updates, { partial: true });
    if (!ok) return res.status(400).json({ ok: false, errors });

    Object.assign(updates, normalized);

    // CLP: solo si se está tocando precio (o si venía currency)
    if (updates.price !== undefined || updates.currency !== undefined) {
      updates.currency = "CLP";
    } else {
      delete updates.currency;
    }

    updates.updatedAt = new Date().toISOString();

    const ref = db.collection("products").doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ ok: false, message: "Producto no encontrado" });

    await ref.update(updates);

    const updated = await ref.get();
    return res.json({ ok: true, id, item: { id: updated.id, ...updated.data() } });
  } catch (err) {
    console.error("updateProduct error:", err);
    return res.status(500).json({ ok: false, message: "Error actualizando producto" });
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