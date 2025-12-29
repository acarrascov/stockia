// src/routes/orders.routes.js
const express = require("express");
const router = express.Router();

const {
  listOrders,
  createOrder,
  updateOrderStatus,
} = require("../controllers/orders.controller");

const firebaseAuth = require("../middlewares/firebaseAuth.middleware");
const { requireRole } = require("../middlewares/role.middleware");

// ✅ Todas las rutas de orders requieren login
router.use(firebaseAuth);

// GET /api/orders
router.get("/", listOrders);

// POST /api/orders
router.post("/", createOrder);

// PUT /api/orders/:id/status  (solo admin)
router.put("/:id/status", requireRole("admin"), updateOrderStatus);

module.exports = router;