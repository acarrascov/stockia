const express = require("express"); // Importa el módulo express este sirve para crear rutas y manejar solicitudes HTTP
const router = express.Router(); // Crea una instancia del enrutador de express para definir las rutas de la API

const firebaseAuth = require("../middlewares/firebaseAuth.middleware"); // Importa el middleware firebaseAuth para autenticar las solicitudes usando Firebase
const { requireRole } = require("../middlewares/role.middleware"); // Importa el middleware requireRole para verificar los roles de usuario

const { auditLogsList } = require("../controllers/auditLogs.controller"); // Importa la función auditLogsList del controlador de auditLogs

// GET /api/audit-logs (solo admin)
router.get("/audit-logs", firebaseAuth, requireRole("admin"), auditLogsList); // Define la ruta GET /api/audit-logs que requiere autenticación y rol de admin para listar los registros de auditoría

module.exports = router; // Exporta el enrutador para que pueda ser utilizado en otras partes de la aplicación