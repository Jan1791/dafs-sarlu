import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "DAFS Sarlu — Agence immobilière",
    short_name: "DAFS Sarlu",
    description: "Annonces immobilières, plans architecturaux et services à Kinshasa.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#F8F7F3",
    theme_color: "#14263D",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
