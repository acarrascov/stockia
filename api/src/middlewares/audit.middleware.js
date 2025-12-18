const AuditService = require("../services/audit.service");
const auditService = new AuditService();

module.exports = function audit(actionName = "unknown") {
  return (req, res, next) => {
    const startedAt = Date.now();

    res.on("finish", async () => {
      try {
        if (req.method === "GET" && (actionName === "unknown" || !actionName)) return;

        await auditService.logAction({
          action: actionName,
          userId: req.user ? req.user.uid : null,
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
          method: req.method,
          path: req.originalUrl,
          query: req.query,
          statusCode: res.statusCode,
          durationMs: Date.now() - startedAt,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error("Audit log error:", error);
      }
    });

    next();
  };
};