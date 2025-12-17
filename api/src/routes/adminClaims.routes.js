/**
 * DEV ONLY routes: custom claims
 */
const express = require("express");
const router = express.Router();

const { setAdminRoleByEmail } = require("../controllers/adminClaims.controller"); // Importa el controlador para establecer el rol de admin
const devOnly = require("../middlewares/devOnly.middleware");

// POST /api/dev/set-admin
router.post("/dev/set-admin", devOnly, setAdminRoleByEmail);

module.exports = router;