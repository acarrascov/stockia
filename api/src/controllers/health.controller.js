/**
 * Controller: health
 * Aquí va la lógica que responde a la ruta /health
 * Un controller recibe (req, res) y devuelve una respuesta
 */
function healthCheck(req, res) {
  return res.status(200).json({
    status: "ok",
    service: "stockia-api",
  });
}

module.exports = { healthCheck }; // Exportamos la función para usarla en las rutas