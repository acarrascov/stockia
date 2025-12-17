/**
 * Router principal de la API
 * Todas las rutas del sistema cuelgan desde aquí
 */
const express = require("express"); // Importamos express para crear el router
const router = express.Router(); // Creamos el router principal de la API.

// Importamos rutas por módulo
const healthRoutes = require("./health.routes"); // Ruta de health check. Sirve para comprobar que la API está viva.
const firestoreRoutes = require("./firestore.routes"); // Rutas para operaciones con Firestore. Sirven para gestionar datos en la base de datos.
const meRoutes = require("./me.routes"); // Rutas para el usuario autenticado. Sirven para que el usuario gestione su propia información.
const adminClaimsRoutes = require("./adminClaims.routes"); // Rutas para gestión de custom claims de admin. Sirven para asignar roles de administrador a usuarios.


// Montamos rutas
router.use(healthRoutes);
router.use(firestoreRoutes);
router.use(meRoutes);
router.use(adminClaimsRoutes);

module.exports = router;