// app/lib/firebase.ts
// Inicializa Firebase SOLO en el frontend

import { initializeApp, getApps } from "firebase/app"; // SDK principal de Firebase viene de archivo modulartq que esta ubicado en node_modules/firebase/app
import { getAuth } from "firebase/auth";

// Configuración pública (segura) tomada desde .env.local
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// Evita reinicializar en hot-reload (Next)
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Exportamos Auth para login
export const auth = getAuth(app);