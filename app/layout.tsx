import type { Metadata } from "next";
import type { Viewport } from "next";
import "../src/index.css";
import { InstallAppButton, PwaRegistration } from "../src/pwa";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  applicationName: "DAFS Sarlu",
  title: "DAFS Sarlu | Agence immobilière, architecture et services",
  description: "Agence immobilière à Kinshasa : locations, maisons et parcelles à vendre, plans architecturaux et services proposés par DAFS Sarlu.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "96x96", type: "image/png" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: { capable: true, title: "DAFS Sarlu", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#0D3D73",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body><PwaRegistration />{children}<InstallAppButton className="pwa-install-floating" /></body>
    </html>
  );
}
