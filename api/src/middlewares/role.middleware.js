/**
 * Middleware de roles basado en Custom Claims (Firebase)
 * Uso: requireRole("admin")
 */
function requireRole(requiredRole) {
  return function (req, res, next) {
    // Debe existir usuario autenticado
    if (!req.user || !req.user.claims) {
      return res.status(401).json({ message: "No autenticado" });
    }

    // El rol vive en los custom claims
    const role = req.user.claims.role;

    if (role !== requiredRole) {
      return res.status(403).json({ message: "No autorizado" });
    }

    next();
  };
}

module.exports = { requireRole };