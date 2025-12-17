/**
 * Routes: health
 * Aquí definimos las rutas/URLs relacionadas a health
 */
const express = require("express");
const router = express.Router();

const { healthCheck } = require("../controllers/health.controller"); // Importamos el controller de health
const authMiddleware = require("../middlewares/auth.middleware"); // Importamos el middleware de auth
const { requireRole } = require("../middlewares/role.middleware"); // Importamos el middleware de roles
const firebaseAuth = require("../middlewares/firebaseAuth.middleware");

// Ruta GET /health protegida por Firebase Auth y rol admin
router.get("/health", firebaseAuth, requireRole("admin"), healthCheck);

module.exports = router; // Exportamos el router para usarlo en el servidor