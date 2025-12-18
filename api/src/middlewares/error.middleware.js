function errorMiddleware(err, req, res, next) {
  console.error("Unhandled error:", err);

  const status = err.statusCode || 500;

  return res.status(status).json({
    ok: false,
    message: err.message || "Error interno",
  });
}

module.exports = errorMiddleware;