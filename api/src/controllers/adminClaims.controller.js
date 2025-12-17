/**
 * DEV ONLY: asignar rol usando Firebase Custom Claims
 * - Esto NO va en producción tal cual.
 * - Sirve para aprender y para bootstrapping del sistema.
 */

const { admin } = require("../config/firebase"); // Reutilizamos la instancia ya inicializada

/**
 * Asigna un rol a un usuario en Firebase Auth usando Custom Claims
 * - Ruta protegida: solo admin puede asignar roles
 * - Parámetros esperados en el body:
 *    - uid: string (UID del usuario al que se le asigna el rol)
 *    - role: string (rol a asignar, ej: "admin", "usuario", etc)
 */

async function setAdminRoleByEmail(req, res) {
    try {
        const { email } = req.body; // Extraemos email del body de la petición y buscamos el UID del usuario por email. req.body debe venir en formato JSON y trae los datos enviados por el cliente

        // Validación mínima
        if (!email) {
            return res.status(400).json({ message: "Falta email"});
        }

        // 1) Buscar usuario en Firebase Auth por email
        const userRecord = await admin.auth().getUserByEmail(email);
        
        // 2) Asignar custom claim (role=admin)
        await admin.auth().setCustomUserClaims(userRecord.uid, { role: "admin"});

        return res.status(200).json({
            ok: true,
            message: `Rol 'admin' asignado al usuario con email ${email}`,
            uid: userRecord.uid,
        });
    } catch (error) {
        return res.status(500).json({
            ok: false,
            message: "No se pudo asignar el rol",
            error: error.message,
        });
    }      
}

module.exports = { setAdminRoleByEmail};