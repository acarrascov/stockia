// api/src/middlewares/tenantPlan.middleware.js
const { db } = require("../config/firebase");

async function tenantPlanMiddleware(req, res, next) {
  try {
    // 1) tenantId viene del header
    const tenantId = req.headers["x-tenant-id"];
    if (!tenantId) {
      return res.status(400).json({ ok: false, message: "Falta header x-tenant-id" });
    }

    // 2) leer tenant
    const tenantRef = db.collection("tenants").doc(String(tenantId));
    const tenantSnap = await tenantRef.get();

    if (!tenantSnap.exists) {
      return res.status(404).json({ ok: false, message: "Tenant no encontrado" });
    }

    const tenant = { id: tenantSnap.id, ...tenantSnap.data() };

    // 3) leer plan
    const planId = tenant.planId;
    if (!planId) {
      return res.status(400).json({ ok: false, message: "Tenant no tiene planId" });
    }

    const planRef = db.collection("plans").doc(String(planId));
    const planSnap = await planRef.get();

    if (!planSnap.exists) {
      return res.status(404).json({ ok: false, message: "Plan no encontrado" });
    }

    const plan = { id: planSnap.id, ...planSnap.data() };

    // 4) dejar disponible en req
    req.tenantId = tenant.id;
    req.tenant = tenant;
    req.plan = plan;

    return next();
  } catch (err) {
    console.error("tenantPlanMiddleware error:", err);
    return res.status(500).json({ ok: false, message: "Error cargando tenant/plan" });
  }
}

module.exports = tenantPlanMiddleware;