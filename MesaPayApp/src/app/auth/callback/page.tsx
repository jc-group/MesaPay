"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase-client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Procesando inicio de sesion…");

  useEffect(() => {
    const exchange = async () => {
      if (!isSupabaseConfigured) {
        setMessage("Supabase no esta configurado.");
        return;
      }
      const supabase = getSupabaseClient();
      if (!supabase) {
        setMessage("Supabase no esta configurado.");
        return;
      }
      const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
      if (error) {
        setMessage("No fue posible iniciar sesion. Intenta de nuevo.");
        return;
      }
      router.replace("/");
    };

    exchange();
  }, [router]);

  return (
    <main className="ambient-shell flex min-h-screen items-center px-4 py-10">
      <section className="glass-panel mx-auto w-full max-w-md rounded-3xl p-6 text-center">
        <p className="section-label">MesaPay</p>
        <h1 className="mt-3 text-3xl text-[var(--ink-950)] text-balance">Inicio de sesion</h1>
        <p className="mt-3 text-sm text-[var(--ink-700)]">{message}</p>
      </section>
    </main>
  );
}
