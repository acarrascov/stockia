/**
 * Middleware de roles (reutilizable)
 * Uso: requireRole("admin") o requireRole("user")
 */
function requireRole(requiredRole) {
  return function (req, res, next) {
    // Si no hay usuario en req.user, es porque no pasó authMiddleware
    if (!req.user) {
      return res.status(401).json({ message: "No autenticado" });
    }

    // Si el rol no coincide, bloqueamos
    if (req.user.role !== requiredRole) {
      return res.status(403).json({ message: "No autorizado" });
    }

    // Si cumple, dejamos pasar
    next();
  };
}

module.exports = { requireRole }; // Exportamos la función para usarla en rutas