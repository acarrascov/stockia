"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  title?: string;
  children: React.ReactNode;
};

export default function AppShell({ title = "Stockia", children }: Props) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href ? "text-white" : "text-white/70 hover:text-white";

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <div className="font-semibold">{title}</div>

          <nav className="flex gap-4 text-sm">
            <Link className={isActive("/demo")} href="/demo">Demo</Link>
            <Link className={isActive("/user")} href="/user">Usuario</Link>
            <Link className={isActive("/admin")} href="/admin">Admin</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-6">{children}</main>
    </div>
  );
}