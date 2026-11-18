import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "DAFS Sarlu — Administration",
    short_name: "DAFS Admin",
    description: "Espace d’administration DAFS Sarlu.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#F6F7F9",
    theme_color: "#14263D",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
