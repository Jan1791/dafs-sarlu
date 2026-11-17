import type { Metadata } from "next";
import "../src/index.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "DAFS Sarlu | Immobilier et architecture",
  description: "Locations & Aménagement, biens à vendre et plans architecturaux proposés par DAFS Sarlu.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
