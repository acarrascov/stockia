/**
 * Routes: /me (protegida)
 */
const express = require("express");
const router = express.Router();

const { me } = require("../controllers/me.controller");
const firebaseAuth = require("../middlewares/firebaseAuth.middleware");

// GET /api/me
router.get("/me", firebaseAuth, me);

module.exports = router;