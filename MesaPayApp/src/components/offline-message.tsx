import type { ReactNode } from "react";

export function OfflineShell({ children }: { children: ReactNode }) {
  return (
    <main className="ambient-shell flex min-h-screen items-center px-4 py-10">
      <section className="glass-panel mx-auto w-full max-w-md rounded-3xl p-6 text-center">
        {children}
      </section>
    </main>
  );
}

export function OfflineLabel() {
  return <p className="section-label">Modo sin conexion</p>;
}

export function OfflineTitle() {
  return <h1 className="mt-3 text-4xl text-[var(--ink-950)]">MesaPay</h1>;
}

export function OfflineBody() {
  return (
    <p className="mt-3 text-sm text-[var(--ink-700)]">
      No detectamos internet en este momento. Cuando vuelvas a estar en linea, podras consultar el menu y unirte a
      la mesa virtual.
    </p>
  );
}
