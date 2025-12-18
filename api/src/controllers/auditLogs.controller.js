const { db } = require("../config/firebase");

// GET /api/audit-logs
async function auditLogsList(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit || "50", 10), 100);

    const snap = await db
      .collection("audit_logs")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    const items = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    return res.json({ ok: true, items, limit });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Error listando auditoría",
    });
  }
}

module.exports = { auditLogsList };