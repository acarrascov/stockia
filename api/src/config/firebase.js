const admin = require("firebase-admin");
const path = require("path");
require("dotenv").config();

if (!admin.apps.length) {
  // Construimos una ruta absoluta al archivo (más seguro)
  const serviceAccountPath = path.join(
    process.cwd(), // apunta a la carpeta raíz donde ejecutas node (api/)
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  );

  const serviceAccount = require(serviceAccountPath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

module.exports = { admin, db };