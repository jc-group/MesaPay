"use client";

import { PwaInstallActions, PwaInstallMessage, PwaInstallRoot, PwaInstallShell } from "@/components/pwa-install";

export function PwaInstallPrompt() {
  return (
    <PwaInstallRoot>
      <PwaInstallShell>
        <PwaInstallMessage />
        <PwaInstallActions />
      </PwaInstallShell>
    </PwaInstallRoot>
  );
}
