const express = require("express");
const router = express.Router();

const {
  listOrders,
  createOrder,
  updateOrderStatus,
} = require("../controllers/orders.controller");

const firebaseAuth = require("../middlewares/firebaseAuth.middleware");
const { requireRole } = require("../middlewares/role.middleware");

// 🔐 Todas las rutas de orders requieren autenticación
router.use(firebaseAuth);

// GET /api/orders → listar pedidos del tenant
router.get("/", listOrders);

// POST /api/orders → crear pedido
router.post("/", createOrder);

// PUT /api/orders/:id/status → cambiar estado (solo admin)
router.put("/:id/status", requireRole("admin"), updateOrderStatus);

module.exports = router;