"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function logout() {
    setIsLoading(true);
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={isLoading}
      className="min-h-11 rounded-full border border-border px-5 text-sm font-semibold transition-colors hover:bg-muted disabled:opacity-60"
    >
      {isLoading ? "Saliendo…" : "Cerrar sesión"}
    </button>
  );
}
