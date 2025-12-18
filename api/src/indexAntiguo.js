const express = require("express"); // Importamos express para crear la aplicación
const cors = require("cors"); // Importamos cors para manejar el acceso desde el frontend
require("dotenv").config(); // Cargamos variables de entorno

const apiRoutes = require("./routes"); // Importamos el router principal de la API

const app = express(); // Creamos la aplicación de Express

const logger = require("./middlewares/logger.middleware"); // Importamos el middleware de logger


// Usamos el middleware de logger en todas las rutas
app.use(logger); 

// Middlewares globales 
app.use(cors()); // Habilitamos CORS para todas las rutas
app.use(express.json()); // Habilitamos el parseo de JSON en las solicitudes entrantes. Parseo es convertir datos a un formato que podamos usar.

// Prefijo base de la API

app.use("/api", apiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    message: "Ruta no encontrada",
  });
});

const errorMiddleware = require("./middlewares/error.middleware"); // Importamos el middleware de manejo de errores
app.use(errorMiddleware); // Usamos el middleware de manejo de errores al final, para capturar errores de rutas anteriores

// Iniciamos el servidor en el puerto definido en las variables de entorno o el 3001 por defecto

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`✅ Stockia API corriendo en http://localhost:${PORT}`);
});