const { admin, db } = require("../config/firebase");

// GET /api/users/me
async function me(req, res) {
  try {
    if (!req.user) return res.status(401).json({ ok: false, message: "No autenticado" });

    const uid = req.user.uid;
    const email = req.user.email || req.user.claims?.email || null;
    const role = req.user.role || req.user.claims?.role || "user";
    const name = req.user.claims?.name || null;
    const picture = req.user.claims?.picture || null;

    return res.json({
      ok: true,
      user: { uid, email, claims: { name, picture }, role },
    });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
}

// GET /api/users  (solo admin)
async function listUsers(req, res) {
  try {
    const role = req.user?.role || req.user?.claims?.role;
    if (role !== "admin") return res.status(403).json({ ok: false, message: "No autorizado" });

    const result = await admin.auth().listUsers(1000);
    const users = result.users.map((u) => ({
      uid: u.uid,
      email: u.email,
      role: u.customClaims?.role || "user",
      disabled: u.disabled,
    }));

    return res.json({ ok: true, items: users });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
}

// POST /api/users/set-admin (solo admin) body: { email }
async function setAdminRoleByEmail(req, res) {
  try {
    const role = req.user?.role || req.user?.claims?.role;
    if (role !== "admin") return res.status(403).json({ ok: false, message: "No autorizado" });

    const { email } = req.body;
    if (!email) return res.status(400).json({ ok: false, message: "Falta email" });

    const userRecord = await admin.auth().getUserByEmail(email);

    await admin.auth().setCustomUserClaims(userRecord.uid, { role: "admin" });

    // opcional: reflejar en Firestore si ya estás usando colección users
    await db.collection("users").doc(userRecord.uid).set(
      {
        uid: userRecord.uid,
        email: userRecord.email || email,
        role: "admin",
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return res.status(200).json({
      ok: true,
      message: `Rol 'admin' asignado al usuario con email ${email}`,
      uid: userRecord.uid,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "No se pudo asignar el rol",
      error: error.message,
    });
  }
}

// ✅ 3.6.6: POST /api/users/:uid/assign  (solo admin)
// body: { tenantId, planId }
async function assignTenantAndPlan(req, res) {
  try {
    const role = req.user?.role || req.user?.claims?.role;
    if (role !== "admin") return res.status(403).json({ ok: false, message: "No autorizado" });

    const { uid } = req.params;
    const { tenantId, planId } = req.body;

    if (!uid) return res.status(400).json({ ok: false, message: "Falta uid" });
    if (!tenantId || !planId) return res.status(400).json({ ok: false, message: "Falta tenantId o planId" });

    const now = new Date().toISOString();

    await db.collection("users").doc(uid).set(
      {
        uid,
        tenantId,
        planId,
        updatedAt: now,
      },
      { merge: true }
    );

    return res.json({ ok: true, uid, tenantId, planId });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
}

module.exports = {
  me,
  listUsers,
  setAdminRoleByEmail,
  assignTenantAndPlan,
};