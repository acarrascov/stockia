// app/lib/apiAuth.ts

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function apiAuthGet(path: string, token?: string) {
  if (!token) {
    throw new Error("No hay token de autenticación");
  }

  const res = await fetch(`${API_URL}${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Error en API");
  }

  return res.json();
}