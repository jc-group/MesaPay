"use client";

import { useRouter } from "next/navigation";
import {
  HomeAccessForm,
  HomeAccessInput,
  HomeAccessRoot,
  HomeAccessSubmit
} from "@/components/home-access";
import { HealthStatusCard, HealthStatusMessage, HealthStatusRoot } from "@/components/health-status";

export default function HomePage() {
  const router = useRouter();
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
