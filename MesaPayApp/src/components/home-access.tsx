"use client";

import type { FormEvent, ReactNode } from "react";
import { createContext, use, useCallback, useMemo, useState } from "react";

type HomeAccessContextValue = {
  qrToken: string;
  setQrToken: (value: string) => void;
  submitToken: () => void;
};

const HomeAccessContext = createContext<HomeAccessContextValue | null>(null);

function useHomeAccessContext() {
  const context = use(HomeAccessContext);
  if (!context) {
    throw new Error("HomeAccess components must be used within HomeAccessRoot.");
  }
  return context;
}

type HomeAccessRootProps = {
  defaultToken: string;
  onSubmit: (token: string) => void;
  children: ReactNode;
};

export function HomeAccessRoot({ defaultToken, onSubmit, children }: HomeAccessRootProps) {
  const [qrToken, setQrToken] = useState(defaultToken);

  const submitToken = useCallback(() => {
    const trimmed = qrToken.trim();
    if (!trimmed) {
      return;
    }
    onSubmit(trimmed);
  }, [qrToken, onSubmit]);

  const value = useMemo<HomeAccessContextValue>(
    () => ({
      qrToken,
      setQrToken,
      submitToken
    }),
    [qrToken, submitToken]
  );

  return <HomeAccessContext.Provider value={value}>{children}</HomeAccessContext.Provider>;
}

export function HomeAccessForm({ children }: { children: ReactNode }) {
  const { submitToken } = useHomeAccessContext();

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitToken();
  };

  return (
    <form
      className="mt-3 rounded-2xl border border-[var(--line)] bg-[var(--paper)]/75 p-4"
      onSubmit={onSubmit}
    >
      <h2 className="text-2xl text-[var(--ink-950)]">Entrar a una mesa</h2>
      <p className="mt-1 text-sm text-[var(--ink-700)]">
        Escribe el token QR para abrir el menu y unirte a la mesa virtual.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">{children}</div>
    </form>
  );
}

export function HomeAccessInput() {
  const { qrToken, setQrToken } = useHomeAccessContext();
  return (
    <input
      type="text"
      value={qrToken}
      onChange={(event) => setQrToken(event.target.value)}
      placeholder="Ejemplo: mesa-12-demo"
      className="w-full rounded-xl border border-[var(--line)] bg-white/90 px-3 py-3 text-[var(--ink-950)] outline-none transition focus:border-[var(--accent-jade)]"
    />
  );
}

export function HomeAccessSubmit() {
  return (
    <button
      type="submit"
      className="raise-hover min-h-11 rounded-xl bg-[var(--accent-jade)] px-4 py-3 font-semibold text-white"
    >
      Ver menu
    </button>
  );
}
