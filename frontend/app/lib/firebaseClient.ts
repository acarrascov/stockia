// app/lib/firebaseClient.ts
// Firebase SDK (cliente) para el FRONTEND (Next.js)
// - Aquí NO usamos serviceAccountKey.json (eso es solo backend).
// - Esto se inicializa con variables NEXT_PUBLIC_...

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Config del proyecto Firebase (del frontend)
// OJO: en Next.js, para que existan en el browser deben empezar con NEXT_PUBLIC_
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!, // clave pública del proyecto
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!, // dominio auth del proyecto
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!, // id del proyecto
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!, // bucket de storage del proyecto
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!, // id emisor mensajería
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!, // id app del proyecto
};

// Evita reinicializar Firebase en hot reload (Next dev)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Auth de Firebase para usar login/logout y obtener ID token
export const firebaseAuth = getAuth(app);

// ✅ Alias para que funcione: import { auth } from "../lib/firebaseClient"
export const auth = firebaseAuth;