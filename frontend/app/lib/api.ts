// app/lib/api.ts
// Helpers para llamar a tu API desde el frontend.
//
// - apiGet: llamadas públicas (sin token)
// - apiAuthGet: llamadas protegidas (con Authorization: Bearer <token>)
//
// IMPORTANTE:
// - apiAuthGet usa localStorage, por eso debe ejecutarse desde componentes "use client".

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Validación mínima para evitar "undefined/..."
if (!API_URL) {
  throw new Error(
    "Falta NEXT_PUBLIC_API_URL en .env.local (ej: http://localhost:3001/api)"
  );
}

/**
 * GET público (sin autenticación)
 */
export async function apiGet(path: string) {
  const res = await fetch(`${API_URL}${path}`);

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}

/**
 * GET protegido (requiere Firebase ID token)
 * Lee el token desde localStorage (debug_token).
 */
export async function apiAuthGet(path: string) {
  // 1) Sacamos el token guardado por el AuthPanel
  const token = localStorage.getItem("debug_token");

  // 2) Si no hay token, no tiene sentido llamar al backend protegido
  if (!token) {
    throw new Error(
      "No hay token en localStorage (debug_token). Inicia sesión con Google primero."
    );
  }

  // 3) Llamamos a la API con Authorization Bearer
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}