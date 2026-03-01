import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { Cabin, Prata } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import "./globals.css";

const PwaInstallPrompt = dynamic(
  () => import("@/components/pwa-install-prompt").then((module) => module.PwaInstallPrompt)
);

const displayFont = Prata({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-display"
});

const bodyFont = Cabin({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body"
});

export const metadata: Metadata = {
  title: "MesaPay",
  description: "Divide la cuenta. Paga desde tu celular.",
  manifest: "/manifest.webmanifest",
  icons: {
    apple: "/icons/icon-192.png"
  },
  formatDetection: {
    telephone: false
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MesaPay"
  }
};

export const viewport: Viewport = {
  themeColor: "#f8f1e7"
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="es-MX" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body>
        <ServiceWorkerRegister />
        <PwaInstallPrompt />
        {children}
      </body>
    </html>
  );
}
