"use client";

import type { ReactNode } from "react";
import { createContext, use, useEffect, useMemo, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type PwaInstallContextValue = {
  showIosHint: boolean;
  showInstallCta: boolean;
  dismiss: () => void;
  install: () => Promise<void>;
};

const PwaInstallContext = createContext<PwaInstallContextValue | null>(null);

function usePwaInstallContext() {
  const context = use(PwaInstallContext);
  if (!context) {
    throw new Error("PwaInstall components must be used within PwaInstallRoot.");
  }
  return context;
}

function isIosDevice() {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function PwaInstallRoot({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isLocalhost, setIsLocalhost] = useState(false);

  const showIosHint = useMemo(() => isIosDevice() && !isStandalone && !dismissed, [isStandalone, dismissed]);
  const showInstallCta = Boolean(deferredPrompt) && !dismissed;

  useEffect(() => {
    setIsClient(true);
    setIsLocalhost(window.location.hostname === "localhost");

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true);
    setIsStandalone(standalone);

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) {
      return;
    }

    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setDismissed(true);
  };

  const dismiss = () => {
    setDismissed(true);
  };

  const shouldShow = isClient && !isLocalhost && !isStandalone && (showInstallCta || showIosHint);

  const value = useMemo<PwaInstallContextValue>(
    () => ({
      showIosHint,
      showInstallCta,
      dismiss,
      install
    }),
    [showIosHint, showInstallCta]
  );

  if (!shouldShow) {
    return null;
  }

  return <PwaInstallContext.Provider value={value}>{children}</PwaInstallContext.Provider>;
}

export function PwaInstallShell({ children }: { children: ReactNode }) {
  return (
    <aside className="fixed inset-x-4 bottom-4 z-50 md:inset-x-auto md:right-6 md:w-[380px]">
      <div className="glass-panel rounded-2xl p-4 shadow-2xl">
        <p className="section-label">Instala MesaPay</p>
        {children}
      </div>
    </aside>
  );
}

export function PwaInstallMessage() {
  const { showIosHint } = usePwaInstallContext();

  return (
    <p className="mt-2 text-sm text-[var(--ink-700)]">
      {showIosHint
        ? "En iPhone: abre compartir y toca 'Agregar a pantalla de inicio'."
        : "Instala la app para abrir mas rapido y usarla como experiencia nativa."}
    </p>
  );
}

export function PwaInstallActions() {
  const { showInstallCta, install, dismiss } = usePwaInstallContext();

  return (
    <div className="mt-3 flex items-center gap-2">
      {showInstallCta && (
        <button
          type="button"
          onClick={install}
          className="min-h-10 rounded-xl bg-[var(--accent-jade)] px-4 text-sm font-semibold text-white"
        >
          Instalar app
        </button>
      )}
      <button
        type="button"
        onClick={dismiss}
        className="min-h-10 rounded-xl border border-[var(--line)] px-4 text-sm font-semibold text-[var(--ink-700)]"
      >
        Cerrar
      </button>
    </div>
  );
}
