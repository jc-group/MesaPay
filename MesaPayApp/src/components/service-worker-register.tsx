"use client";

import { ServiceWorkerNull, ServiceWorkerRoot } from "@/components/service-worker";

export function ServiceWorkerRegister() {
  return (
    <ServiceWorkerRoot>
      <ServiceWorkerNull />
    </ServiceWorkerRoot>
  );
}
