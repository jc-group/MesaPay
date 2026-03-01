"use client";

import type { ReactNode } from "react";
import { createContext, use, useEffect, useMemo, useState } from "react";

type ServiceWorkerState = "idle" | "registered" | "failed" | "disabled";

type ServiceWorkerContextValue = {
  state: ServiceWorkerState;
};

const ServiceWorkerContext = createContext<ServiceWorkerContextValue | null>(null);

function useServiceWorkerContext() {
  const context = use(ServiceWorkerContext);
  if (!context) {
    throw new Error("ServiceWorker components must be used within ServiceWorkerRoot.");
  }
  return context;
}

export function ServiceWorkerRoot({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ServiceWorkerState>("idle");

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      setState("disabled");
      return;
    }

    if (window.location.hostname === "localhost") {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister();
        });
        setState("disabled");
      });
      return;
    }

    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        setState("registered");
      } catch (error) {
        console.error("Service worker registration failed", error);
        setState("failed");
      }
    };

    register();
  }, []);

  const value = useMemo<ServiceWorkerContextValue>(() => ({ state }), [state]);

  return <ServiceWorkerContext.Provider value={value}>{children}</ServiceWorkerContext.Provider>;
}

export function ServiceWorkerNull() {
  useServiceWorkerContext();
  return null;
}
