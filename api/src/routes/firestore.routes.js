/**
 * Rutas de prueba Firestore
 */
const express = require("express");
const router = express.Router();

const { firestorePing } = require("../controllers/firestore.controller");

// GET /firestore/ping
router.get("/firestore/ping", firestorePing);

module.exports = router;