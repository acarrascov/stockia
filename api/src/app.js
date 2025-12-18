const express = require("express");
const cors = require("cors");
require("dotenv").config({
  path: process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.development",
});

const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por IP
  standardHeaders: true,
  legacyHeaders: false,
});

const apiRoutes = require("./routes");
const logger = require("./middlewares/logger.middleware");
const errorMiddleware = require("./middlewares/error.middleware");

const app = express();

app.use(logger);
app.use(cors());
app.use(helmet());

// Limitador de peticiones
app.use(express.json());

// Rutas
app.use("/api", apiLimiter);
app.use("/api", apiRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ ok: false, message: "Ruta no encontrada" });
});

// Errores
app.use(errorMiddleware);

module.exports = app;