// api/src/services/tenantPlan.service.js
const { db } = require("../config/firebase");

/**
 * Lee tenant por header x-tenant-id (ej: "demo")
 * y luego lee su plan en /plans/{planId}
 */
async function getTenantAndPlan(req) {
  const tenantId = (req.headers["x-tenant-id"] || "").toString().trim();

  if (!tenantId) {
    return { tenantId: null, tenant: null, planId: null, plan: null };
  }

  // 1) Tenant
  const tenantSnap = await db.collection("tenants").doc(tenantId).get();
  if (!tenantSnap.exists) {
    return { tenantId, tenant: null, planId: null, plan: null };
  }

  const tenant = { id: tenantSnap.id, ...tenantSnap.data() };
  const planId = tenant.planId || null;

  // 2) Plan
  let plan = null;
  if (planId) {
    const planSnap = await db.collection("plans").doc(planId).get();
    if (planSnap.exists) {
      plan = { id: planSnap.id, ...planSnap.data() };
    }
  }

  return { tenantId, tenant, planId, plan };
}

module.exports = { getTenantAndPlan };