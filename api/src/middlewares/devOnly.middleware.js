/**
 * Middleware: permite la ruta solo en desarrollo
 * Si NODE_ENV !== "development" => bloquea
 */
function devOnly(req, res, next) {
  if (process.env.NODE_ENV !== "development") {
    return res.status(403).json({ message: "Ruta disponible solo en desarrollo" });
  }
  next();
}

module.exports = devOnly;