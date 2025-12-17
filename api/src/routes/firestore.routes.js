/**
 * Rutas de prueba Firestore
 */
const express = require("express");
const router = express.Router();
const firebaseAuth = require("../middlewares/firebaseAuth.middleware");
const { requireRole } = require("../middlewares/role.middleware");

const { firestorePing } = require("../controllers/firestore.controller");

// GET /firestore/ping
router.get("/firestore/ping", firebaseAuth, requireRole("admin"), firestorePing);

module.exports = router;