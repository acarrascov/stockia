const express = require("express");
const router = express.Router();

const firebaseAuth = require("../middlewares/firebaseAuth.middleware");
const { requireRole } = require("../middlewares/role.middleware");
const { createProduct, productsList, getProductById, updateProduct, deleteProduct } = require("../controllers/products.controller");
const audit = require("../middlewares/audit.middleware");

// POST /api/products (solo admin)
router.post("/products", firebaseAuth, requireRole("admin"), audit("product.create"), createProduct);

router.get("/products", firebaseAuth, audit("product.list"), productsList);
router.get("/products/:id", firebaseAuth, audit("product.read"), getProductById);

router.put("/products/:id", firebaseAuth, requireRole("admin"), audit("product.update"), updateProduct);

router.delete("/products/:id", firebaseAuth, requireRole("admin"), audit("product.deactivate"), deleteProduct);

module.exports = router;