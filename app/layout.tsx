import type { Metadata } from "next";
import "../src/index.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "DAFS Services | Immobilier et architecture",
  description: "Locations, biens à vendre et plans architecturaux proposés par DAFS Services.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
