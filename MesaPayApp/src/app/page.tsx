"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  HomeAccessForm,
  HomeAccessInput,
  HomeAccessRoot,
  HomeAccessSubmit
} from "@/components/home-access";
import { HealthStatusCard, HealthStatusMessage, HealthStatusRoot } from "@/components/health-status";
import { useAuth } from "@/components/auth-provider";

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const onGoToTable = (token: string) => {
    router.push(`/mesa/${encodeURIComponent(token)}`);
  };

  return (
    <main className="ambient-shell min-h-screen px-4 pb-6 pt-7 md:px-8 md:py-10">
      <section className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-5xl items-start gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="fade-in-up">
          <p className="section-label">Experiencia de mesa inteligente</p>
          <h1 className="mt-3 text-[2.7rem] leading-[0.98] text-[var(--ink-950)] md:text-[4.5rem]">
            MesaPay
          </h1>
          <p className="mt-4 max-w-lg text-lg text-[var(--ink-700)] md:text-xl">
            Divide la cuenta. Paga desde tu celular.
          </p>
          <p className="mt-4 max-w-lg text-sm text-[var(--ink-700)]/90">
            Escanea el QR, entra a la mesa virtual y empieza a pedir sin esperar al mesero.
          </p>
        </div>

        <div className="glass-panel fade-in-up-delay rounded-3xl p-5 md:p-8">
          <p className="section-label">Acceso rapido</p>

          <div className="mt-3 rounded-2xl border border-[var(--line)] bg-white/80 p-4">
            <p className="text-sm font-semibold text-[var(--ink-950)]">Cuenta MesaPay</p>
            {isLoading ? (
              <p className="mt-2 text-sm text-[var(--ink-700)]">Verificando sesion…</p>
            ) : user ? (
              <div className="mt-2 flex items-center justify-between gap-2 text-sm text-[var(--ink-700)]">
                <span className="truncate">{user.email ?? user.id}</span>
                <Link
                  className="font-semibold text-[var(--accent-jade)] hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-jade)] focus-visible:ring-offset-2"
                  href="/login"
                >
                  Gestionar
                </Link>
              </div>
            ) : (
              <div className="mt-2 flex items-center justify-between gap-2 text-sm text-[var(--ink-700)]">
                <span>Inicia sesion para guardar favoritos.</span>
                <Link
                  className="font-semibold text-[var(--accent-jade)] hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-jade)] focus-visible:ring-offset-2"
                  href="/login"
                >
                  Iniciar sesion
                </Link>
              </div>
            )}
          </div>

          <HomeAccessRoot defaultToken="mesa-12-demo" onSubmit={onGoToTable}>
            <HomeAccessForm>
              <HomeAccessInput />
              <HomeAccessSubmit />
            </HomeAccessForm>
          </HomeAccessRoot>

          <HealthStatusRoot>
            <HealthStatusCard>
              <HealthStatusMessage />
            </HealthStatusCard>
          </HealthStatusRoot>
        </div>
      </section>
    </main>
  );
}
