/**
 * Auth middleware (placeholder)
 * - Se ejecuta antes del controller
 * - Más adelante validará Firebase Auth
 * - Por ahora solo deja pasar y deja rastro
 */
function authMiddleware(req, res, next) {
  // Aquí más adelante leeremos el token (Authorization header)
  console.log("🔐 Auth middleware ejecutado");

  // Simulación: Usuario autenticado (después vendrá desde Firebase)
  req.user = {
    uid: "demo-uid-123", // ID del usuario
    role: "admin", // cambia a "user" para probar permisos
    tenantId: "demo-tenant-001", // ID del tenant (simulación). tenant es como una organización o grupo de usuarios, que permite separar datos y permisos.
  };

  // next() permite que la request continúe
  next();
}

module.exports = authMiddleware;