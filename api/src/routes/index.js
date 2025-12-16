/**
 * Router principal de la API
 * Todas las rutas del sistema cuelgan desde aquí
 */
const express = require("express"); // Importamos express para crear el router
const router = express.Router(); // Creamos el router principal de la API.

// Importamos rutas por módulo
const healthRoutes = require("./health.routes");

// Montamos rutas
router.use(healthRoutes);

module.exports = router;