"use client";

import Link from "next/link";
import { useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { isSupabaseConfigured } from "@/lib/supabase-client";

export default function LoginPage() {
  const { user, isLoading, signInWithProvider, signOut } = useAuth();
  const [message, setMessage] = useState("");

  const onSignIn = async (provider: "google" | "apple") => {
    setMessage("");
    try {
      await signInWithProvider(provider);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Error desconocido";
      setMessage(`No fue posible iniciar sesion: ${detail}`);
    }
  };

  const onSignOut = async () => {
    setMessage("");
    try {
      await signOut();
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Error desconocido";
      setMessage(`No fue posible cerrar sesion: ${detail}`);
    }
  };

  return (
    <main className="ambient-shell flex min-h-screen items-center px-4 py-10">
      <section className="glass-panel mx-auto w-full max-w-md rounded-3xl p-6">
        <p className="section-label">Cuenta MesaPay</p>
        <h1 className="mt-3 text-3xl text-[var(--ink-950)] text-balance">Inicia sesion</h1>
        <p className="mt-3 text-sm text-[var(--ink-700)]">
          Guarda favoritos, tarjetas y acceso rapido a tus mesas.
        </p>

        {isLoading && <p className="mt-4 text-sm text-[var(--ink-700)]">Cargando sesion…</p>}

        {!isLoading && user && (
          <div className="mt-4 rounded-2xl border border-[var(--line)] bg-white/80 p-4">
            <p className="text-sm font-semibold text-[var(--ink-950)]">Sesion activa</p>
            <p className="mt-1 text-sm text-[var(--ink-700)]">{user.email ?? user.id}</p>
            <button
              type="button"
              onClick={onSignOut}
              className="raise-hover mt-3 min-h-10 rounded-xl border border-[var(--line)] px-4 text-sm font-semibold text-[var(--ink-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-jade)] focus-visible:ring-offset-2"
            >
              Cerrar sesion
            </button>
          </div>
        )}

        {!isLoading && !user && !isSupabaseConfigured && (
          <div className="mt-4 rounded-2xl border border-[var(--line)] bg-white/80 p-4">
            <p className="text-sm font-semibold text-[var(--ink-950)]">Falta configurar Supabase</p>
            <p className="mt-1 text-sm text-[var(--ink-700)]">
              Agrega <code>NEXT_PUBLIC_SUPABASE_URL</code> y <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
            </p>
          </div>
        )}

        {!isLoading && !user && isSupabaseConfigured && (
          <div className="mt-4 grid gap-2">
            <button
              type="button"
              onClick={() => onSignIn("google")}
              className="raise-hover min-h-11 rounded-xl bg-[var(--accent-jade)] px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-jade)] focus-visible:ring-offset-2"
            >
              Continuar con Google
            </button>
            <button
              type="button"
              onClick={() => onSignIn("apple")}
              className="raise-hover min-h-11 rounded-xl bg-[var(--ink-950)] px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink-950)] focus-visible:ring-offset-2"
            >
              Continuar con Apple
            </button>
          </div>
        )}

        {message && (
          <p aria-live="polite" className="mt-3 text-sm font-semibold text-[var(--accent-red)]">
            {message}
          </p>
        )}

        <div className="mt-6 flex items-center justify-between text-sm text-[var(--ink-700)]">
          <Link
            className="font-semibold text-[var(--accent-jade)] hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-jade)] focus-visible:ring-offset-2"
            href="/"
          >
            Volver al inicio
          </Link>
          <Link
            className="font-semibold text-[var(--ink-700)] hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink-700)] focus-visible:ring-offset-2"
            href="/mesa/mesa-12-demo"
          >
            Entrar a mesa demo
          </Link>
        </div>
      </section>
    </main>
  );
}
