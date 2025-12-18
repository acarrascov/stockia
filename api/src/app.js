const express = require("express");
const cors = require("cors");
require("dotenv").config();

const apiRoutes = require("./routes");
const logger = require("./middlewares/logger.middleware");
const errorMiddleware = require("./middlewares/error.middleware");

const app = express();

app.use(logger);
app.use(cors());
app.use(express.json());

// Rutas
app.use("/api", apiRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ ok: false, message: "Ruta no encontrada" });
});

// Errores
app.use(errorMiddleware);

module.exports = app;