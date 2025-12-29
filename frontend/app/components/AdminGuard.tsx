"use client";

/**
 * AdminGuard
 * ----------
 * Envuelve páginas que SOLO debe ver un admin.
 * Usa Firebase Auth + custom claims (role).
 */

import { useEffect, useState } from "react";
import { auth } from "../lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";

export default function AdminGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      const tokenResult = await user.getIdTokenResult(true);
      setRole((tokenResult.claims.role as string) || "user");
      setLoading(false);
    });

    return () => unsub();
  }, []);

  if (loading) {
    return <p className="p-6 text-white">Cargando…</p>;
  }

  if (role !== "admin") {
    return (
      <div className="p-6 text-white">
        <h2 className="text-xl font-semibold">Acceso restringido</h2>
        <p>No tienes permisos para ver esta sección.</p>
      </div>
    );
  }

  return <>{children}</>;
}