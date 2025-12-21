"use client";

/**
 * AuthPanel
 * =========
 * Este componente sirve SOLO para:
 * 1) Iniciar sesión con Google (Firebase Auth)
 * 2) Mostrar el usuario autenticado
 * 3) Obtener y mostrar el idToken (JWT)
 * 4) Probar una ruta protegida del backend (/products)
 *
 * ⚠️ Esto es un PANEL DE DEBUG, no UI final
 */

import { useEffect, useState } from "react";
import { auth } from "../lib/firebaseClient";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { apiAuthGet } from "../lib/apiAuth";

export default function AuthPanel() {
  // Estado del usuario
  const [email, setEmail] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);

  // Token JWT de Firebase
  const [token, setToken] = useState<string>("");

  // Resultado de la API
  const [products, setProducts] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Se ejecuta una sola vez:
   * - Escucha login / logout
   * - Obtiene el idToken real del usuario
   */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // Usuario no logueado
        setEmail(null);
        setUid(null);
        setToken("");
        return;
      }

      // Usuario logueado
      setEmail(user.email);
      setUid(user.uid);

      // 🔐 ESTE ES EL TOKEN QUE EL BACKEND VERIFICA
      const idToken = await user.getIdToken(true);
      setToken(idToken);
    });

    return () => unsub();
  }, []);

  /**
   * Login con Google
   */
  async function loginGoogle() {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }

  /**
   * Logout
   */
  async function logout() {
    await signOut(auth);
    setProducts(null);
    setError(null);
  }

  /**
   * PRUEBA REAL:
   * Llama a /products usando Authorization: Bearer <idToken>
   */
  async function loadProducts() {
    setError(null);

    try {
      const data = await apiAuthGet("/products", token);
      setProducts(data);
    } catch (err: any) {
      setProducts(null);
      setError(err.message);
    }
  }

  return (
    <div className="p-6 text-white space-y-4">
      <h1 className="text-xl font-semibold">Stockia Frontend (Auth Debug)</h1>

      <p>Estado: {email ? "Logueado" : "Sin sesión"}</p>
      <p>Email: {email ?? "(no logueado)"}</p>
      <p>UID: {uid ?? "(no logueado)"}</p>

      {/* Token */}
      <div>
        <p className="text-sm opacity-80">idToken (debug):</p>
        <pre className="text-xs bg-black/40 p-3 rounded max-h-32 overflow-auto break-all">
          {token || "(sin token aún)"}
        </pre>
      </div>

      {/* Acciones */}
      {!email ? (
        <button
          onClick={loginGoogle}
          className="px-4 py-2 rounded bg-white text-black"
        >
          Iniciar sesión con Google
        </button>
      ) : (
        <div className="space-x-2">
          <button
            onClick={logout}
            className="px-4 py-2 rounded bg-white text-black"
          >
            Cerrar sesión
          </button>

          <button
            onClick={loadProducts}
            className="px-4 py-2 rounded bg-green-600 text-white"
          >
            Cargar productos (ruta protegida)
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-900/60 p-3 rounded text-sm">
          API error: {error}
        </div>
      )}

      {/* Resultado */}
      {products && (
        <pre className="text-xs bg-black/40 p-3 rounded max-h-96 overflow-auto">
          {JSON.stringify(products, null, 2)}
        </pre>
      )}
    </div>
  );
}