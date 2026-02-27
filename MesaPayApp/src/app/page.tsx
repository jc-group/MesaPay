"use client";

import { useEffect, useState } from "react";
import { getBackendHealth } from "@/lib/api";

type HealthState =
  | { status: "loading" }
  | { status: "success"; service: string }
  | { status: "error"; message: string };

export default function HomePage() {
  const [healthState, setHealthState] = useState<HealthState>({
    status: "loading"
  });

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const data = await getBackendHealth();
        setHealthState({ status: "success", service: data.service });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Error desconocido";
        setHealthState({ status: "error", message });
      }
    };

    checkHealth();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-6 text-slate-900">
      <section className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-2xl place-items-center">
        <div className="w-full rounded-2xl bg-white p-7 shadow-2xl shadow-slate-500/20 md:p-10">
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">MesaPay</h1>
          <p className="mt-2 text-lg text-slate-600">
            Divide la cuenta. Paga desde tu celular.
          </p>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 md:p-5">
            <h2 className="text-base font-semibold text-slate-800">Estado del backend</h2>
          {healthState.status === "loading" && (
            <p className="mt-2 font-bold text-slate-800">Validando conexion...</p>
          )}
          {healthState.status === "success" && (
            <p className="mt-2 font-bold text-teal-700">
              Backend conectado ({healthState.service})
            </p>
          )}
          {healthState.status === "error" && (
            <p className="mt-2 font-bold text-red-700">Error: {healthState.message}</p>
          )}
        </div>
        </div>
      </section>
    </main>
  );
}
