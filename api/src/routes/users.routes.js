const express = require("express");
const router = express.Router();

const firebaseAuth = require("../middlewares/firebaseAuth.middleware");
const { requireRole } = require("../middlewares/role.middleware");

const {
  me,
  listUsers,
  setAdminRoleByEmail,
  assignTenantAndPlan,
} = require("../controllers/users.controller");

router.use(firebaseAuth);

// GET /api/users/me
router.get("/me", me);

// GET /api/users (solo admin)
router.get("/", requireRole("admin"), listUsers);

// POST /api/users/set-admin (solo admin)
router.post("/set-admin", requireRole("admin"), setAdminRoleByEmail);

// ✅ 3.6.6: asignar tenant+plan (solo admin)
router.post("/:uid/assign", requireRole("admin"), assignTenantAndPlan);

module.exports = router;