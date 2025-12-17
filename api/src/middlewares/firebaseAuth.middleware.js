/**
 * Middleware Firebase Auth
 * - Lee el token desde: Authorization: Bearer <ID_TOKEN>
 * - Verifica token con Firebase Admin
 * - Deja info lista en req.user (uid, email, claims)
 */
const { admin } = require("../config/firebase");

async function firebaseAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

    if (!token) {
      return res.status(401).json({ message: "No autenticado (sin token)" });
    }

    const decoded = await admin.auth().verifyIdToken(token);

    // Reutilizable: dejamos un objeto estándar para el resto del backend
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      claims: decoded, // aquí vienen custom claims como decoded.admin (si existe)
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
}

module.exports = firebaseAuth;