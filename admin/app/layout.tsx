import type { Metadata } from "next";
import type { Viewport } from "next";
import "../src/index.css";
import { InstallAppButton, PwaRegistration } from "../src/pwa";

export const metadata: Metadata = {
  applicationName: "DAFS Sarlu Admin",
  title: "DAFS Sarlu | Administration",
  description: "Espace d’administration DAFS Sarlu.",
  robots: { index: false, follow: false },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "96x96", type: "image/png" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: { capable: true, title: "DAFS Admin", statusBarStyle: "default" },
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
