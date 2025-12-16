/**
 * Controller de prueba Firestore
 * Objetivo: confirmar que la API se puede conectar a la DB.
 */
const { db } = require("../config/firebase");

async function firestorePing(req, res) {
  try {
    // Intentamos leer un "timestamp" del servidor
    const now = new Date().toISOString();

    // Escribimos un doc de prueba (colección: _health)
    const ref = db.collection("_health").doc("ping");
    await ref.set({ ok: true, updatedAt: now }, { merge: true });

    // Leemos el doc para confirmar lectura
    const snap = await ref.get();

    return res.status(200).json({
      ok: true,
      data: snap.data(),
    });
  } catch (error) {
    // Si hay error de credenciales/ruta/etc, lo veremos aquí
    return res.status(500).json({
      ok: false,
      message: "Firestore connection failed",
      error: error.message,
    });
  }
}

module.exports = { firestorePing };