"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LockKeyhole, Mail } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(Array.isArray(result.message) ? result.message[0] : result.message ?? "Revisá tus datos e intentá de nuevo.");
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("No se pudo conectar. Intentá de nuevo en unos segundos.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-background px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-9">
        <div className="mb-8">
          <span className="inline-flex rounded-full bg-brand-pink px-3 py-1 text-xs font-bold tracking-wide text-brand-red">PANEL PRIVADO</span>
          <h1 className="mt-4 text-3xl font-black tracking-tight">Hola de nuevo</h1>
          <p className="mt-2 text-sm text-muted-foreground">Ingresá con las credenciales de administrador.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block text-sm font-medium">
            Email
            <span className="relative mt-2 block">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@marianaduran.com"
                className="h-12 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-base outline-none transition focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
              />
            </span>
          </label>

          <label className="block text-sm font-medium">
            Contraseña
            <span className="relative mt-2 block">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                type="password"
                autoComplete="current-password"
                required
                minLength={12}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Tu contraseña"
                className="h-12 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-base outline-none transition focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
              />
            </span>
          </label>

          {error && <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-brand-red px-4 font-semibold text-white transition hover:bg-[#c40808] disabled:cursor-wait disabled:opacity-60"
          >
            {isLoading ? "Ingresando…" : "Iniciar sesión"}
          </button>
        </form>

        <Link href="/" className="mt-6 inline-block text-sm text-muted-foreground underline-offset-4 hover:underline">Volver al sitio</Link>
      </section>
    </main>
  );
}
