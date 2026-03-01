"use client";

import type { ReactNode } from "react";
import { createContext, use, useEffect, useMemo, useState } from "react";

import { getBackendHealth } from "@/lib/api";

type HealthState =
  | { status: "loading" }
  | { status: "success"; service: string }
  | { status: "error"; message: string };

type HealthStatusContextValue = {
  state: HealthState;
};

const HealthStatusContext = createContext<HealthStatusContextValue | null>(null);

function useHealthStatusContext() {
  const context = use(HealthStatusContext);
  if (!context) {
    throw new Error("HealthStatus components must be used within HealthStatusRoot.");
  }
  return context;
}

export function HealthStatusRoot({ children }: { children: ReactNode }) {
  const [state, setState] = useState<HealthState>({ status: "loading" });

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const data = await getBackendHealth();
        setState({ status: "success", service: data.service });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Error desconocido";
        setState({ status: "error", message });
      }
    };

    checkHealth();
  }, []);

  const value = useMemo<HealthStatusContextValue>(() => ({ state }), [state]);

  return <HealthStatusContext.Provider value={value}>{children}</HealthStatusContext.Provider>;
}

export function HealthStatusCard({ children }: { children: ReactNode }) {
  return (
    <div className="fade-in-up-delay-2 mt-4 rounded-2xl border border-[var(--line)] bg-[var(--paper)]/80 p-4">
      <h2 className="text-xl text-[var(--ink-950)]">Estado del backend</h2>
      {children}
    </div>
  );
}

export function HealthStatusMessage() {
  const { state } = useHealthStatusContext();

  if (state.status === "loading") {
    return <p className="mt-2 font-semibold text-[var(--ink-700)]">Validando conexion...</p>;
  }

  if (state.status === "success") {
    return (
      <p className="mt-2 inline-flex items-center font-semibold text-[var(--accent-jade)]">
        <span className="pulse-dot" />
        Backend conectado ({state.service})
      </p>
    );
  }

  return <p className="mt-2 font-semibold text-[var(--accent-red)]">Error: {state.message}</p>;
}
