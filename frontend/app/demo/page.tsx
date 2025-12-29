import AppShell from "../components/AppShell";
import AuthPanel from "../components/AuthPanel";

export default function DemoPage() {
  return (
    <AppShell title="Stockia - Demo">
      <h1 className="text-2xl font-semibold">Demo pública</h1>
      <p className="text-white/70 mt-2">
        Acceso público. Para funciones avanzadas, inicia sesión.
      </p>

      {/* PANEL DE LOGIN (Firebase Auth) */}
      <div className="mt-6">
        <AuthPanel />
      </div>
    </AppShell>
  );
}