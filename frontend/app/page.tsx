"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "./lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/demo");
        return;
      }

      const tokenResult = await user.getIdTokenResult(true);
      const role = tokenResult.claims.role;

      if (role === "admin") router.push("/admin");
      else router.push("/app");
    });

    return () => unsub();
  }, [router]);

  return <p className="p-6 text-white">Redirigiendo...</p>;
}
