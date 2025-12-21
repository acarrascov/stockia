/**
 * Routes: health
 * - /health      => protegida (solo admin)
 * - /public/health => pública (para ping desde frontend / tests)
 */

const express = require("express");
const router = express.Router();

const { healthCheck } = require("../controllers/health.controller");

// Middlewares de auth/roles (solo para la ruta protegida)
const firebaseAuth = require("../middlewares/firebaseAuth.middleware");
const { requireRole } = require("../middlewares/role.middleware");

// ✅ Ruta pública: sirve para probar conectividad desde el frontend SIN token
// GET /api/public/health
router.get("/public/health", healthCheck);

// 🔒 Ruta protegida: requiere token Firebase + rol admin
// GET /api/health
router.get("/health", firebaseAuth, requireRole("admin"), healthCheck);

module.exports = router;