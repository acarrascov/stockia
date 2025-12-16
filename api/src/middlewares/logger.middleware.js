/**
 * Logger middleware
 * Registra método, URL y hora de cada request
 * Reutilizable en toda la API
 */

function logger(req, res, next) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
}
/**
 * function logger realiza el registro de cada request entrante
 * Imprime en consola la fecha y hora actual, el método HTTP y la URL solicitada
 * Luego llama a next() para pasar al siguiente middleware o ruta
 */
module.exports = logger; // Exportamos el middleware para usarlo en otros archivos