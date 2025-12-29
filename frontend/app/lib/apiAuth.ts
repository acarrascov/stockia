// app/lib/apiAuth.ts
// Helpers para llamar al BACKEND protegido usando:
// Authorization: Bearer <idToken>

const API_URL = process.env.NEXT_PUBLIC_API_URL; // ej: http://localhost:3001/api

function assertApiUrl() {
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL no está definido");
  return API_URL;
}

/**
 * GET protegido con token
 */
export async function apiAuthGet(path: string, token: string) {
  const base = assertApiUrl();

  const res = await fetch(`${base}${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}

/**
 * POST protegido con token
 * body: objeto JS que se enviará como JSON
 */
export async function apiAuthPost(path: string, token: string, body: any) {
  const base = assertApiUrl();

  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let msg = String(res.status);
    try {
      const data = await res.json();
      msg = data?.message ?? msg;
    } catch {}
    throw new Error(msg);
  }

  return res.json();
}

/**
 * PUT protegido con token
 */
export async function apiAuthPut(path: string, token: string, body: any) {
  const base = assertApiUrl();

  const res = await fetch(`${base}${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let msg = `API error: ${res.status}`;
    try {
      const data = await res.json();
      msg = data?.message ?? msg;
    } catch {
      const text = await res.text().catch(() => "");
      if (text) msg = `${msg} ${text}`;
    }
    throw new Error(msg);
  }

  return res.json().catch(() => ({}));
}

/**
 * DELETE protegido con token
 */
export async function apiAuthDelete(path: string, token: string) {
  const base = assertApiUrl();

  const res = await fetch(`${base}${path}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message ?? `API error: ${res.status}`);
  return data;
}