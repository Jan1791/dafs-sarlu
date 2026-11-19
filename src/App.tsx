"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { supabase } from "./lib/supabase";
import { ExclusiveVideo } from "./media";

type Page =
  | "home"
  | "rentals"
  | "sales"
  | "plans"
  | "construction"
  | "detail"
  | "long-detail"
  | "house-detail"
  | "land-detail"
  | "plan-detail"
  | "estimate"
  | "estimate-result"
  | "services"
  | "service-detail"
  | "about"
  | "contact"
  | "faq"
  | "legal"
  | "system";

const pagePaths: Record<Page, string> = {
  home: "/",
  rentals: "/locations",
  sales: "/acheter",
  plans: "/plans-architecturaux",
  construction: "/realisations-construction",
  detail: "/locations/courte-duree/fiche",
  "long-detail": "/locations/longue-duree/fiche",
  "house-detail": "/biens-a-vendre/fiche",
  "land-detail": "/parcelles-a-vendre/fiche",
  "plan-detail": "/plans-architecturaux/fiche",
  estimate: "/estimation",
  "estimate-result": "/estimation/resultat",
  services: "/services",
  "service-detail": "/services",
  about: "/a-propos",
  contact: "/contact",
  faq: "/faq",
  legal: "/informations-legales",
  system: "/systeme",
};

function pageFromPath(pathname: string): Page {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";
  if (normalizedPath === "/maisons-a-vendre/fiche") return "house-detail";
  if (normalizedPath.startsWith("/services/")) return "service-detail";
  if (normalizedPath === pagePaths.construction) return "construction";
  return (
    (Object.entries(pagePaths).find(([, path]) => path === normalizedPath)?.[0] as Page) ??
    "system"
  );
}

function createWhatsAppHref(settings: Pick<SiteSettings, "whatsapp" | "phone">, message?: string) {
  let href: URL | null = null;
  const candidate = settings.whatsapp.trim();
  const removedContactDigits = ["243", "838", "755", "731"].join("");
  if (candidate && !candidate.replace(/\D/g, "").includes(removedContactDigits)) {
    try {
      href = new URL(/^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`);
      if (href.hostname === "wa.me" || href.hostname.endsWith(".wa.me")) href.protocol = "https:";
    } catch {
      href = null;
    }
  }
  if (!href) {
    const digits = settings.phone.replace(/\D/g, "");
    if (digits && !digits.includes(removedContactDigits)) href = new URL(`https://wa.me/${digits}`);
  }
  if (!href) return "";
  if (message) href.searchParams.set("text", message);
  return href.toString();
}

function createDirectionsHref(address: string) {
  const cleanAddress = address.trim();
  if (cleanAddress.length < 16 || /^kinshasa(?:\s*,.*)?$/i.test(cleanAddress)) return "";
  if (!/\d|avenue|boulevard|\brue\b|\broute\b|croisement|rep[eè]re|immeuble|parcelle|rond.point/i.test(cleanAddress)) return "";
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("destination", `${cleanAddress}, Kinshasa, République démocratique du Congo`);
  url.searchParams.set("dir_action", "navigate");
  return url.toString();
}

function hideRemovedContact(value: string) {
  const digits = value.replace(/\D/g, "");
  return !digits.includes(["243", "838", "755", "731"].join(""));
}

type IconName =
  | "arrow"
  | "bed"
  | "building"
  | "calendar"
  | "chat"
  | "check"
  | "chevron"
  | "clock"
  | "close"
  | "filter"
  | "home"
  | "layers"
  | "mail"
  | "map"
  | "menu"
  | "people"
  | "phone"
  | "ruler"
  | "search"
  | "shield"
  | "sparkle"
  | "sun"
  | "moon"
  | "whatsapp";

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m14 7 5 5-5 5" />
      </>
    ),
    bed: (
      <>
        <path d="M3 18v-6h18v6" />
        <path d="M3 14V7h7a4 4 0 0 1 4 4v1" />
        <path d="M3 18v2M21 18v2" />
      </>
    ),
    building: (
      <>
        <path d="M4 21V4h11v17M15 9h5v12M8 8h3M8 12h3M8 16h3M18 13v2" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    chat: (
      <>
        <path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 8.7 8.7 0 0 1-4.1-1L3 21l1.7-4.8a8.4 8.4 0 0 1-.7-3.4 8.5 8.5 0 1 1 17 0Z" />
        <path d="M8 12h.01M12 12h.01M16 12h.01" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    close: (
      <>
        <path d="m6 6 12 12M18 6 6 18" />
      </>
    ),
    filter: <path d="M4 5h16M7 12h10M10 19h4" />,
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v11h14V10M9 21v-7h6v7" />
      </>
    ),
    layers: (
      <>
        <path d="m12 3 9 5-9 5-9-5 9-5Z" />
        <path d="m3 12 9 5 9-5M3 16l9 5 9-5" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
    map: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    menu: (
      <>
        <path d="M4 7h16M4 12h16M4 17h16" />
      </>
    ),
    people: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20c0-4 2-7 6-7s6 3 6 7M16 5a3 3 0 0 1 0 6M17 14c2.5.5 4 2.5 4 6" />
      </>
    ),
    phone: (
      <path d="M7 3H4a1 1 0 0 0-1 1c0 9.4 7.6 17 17 17a1 1 0 0 0 1-1v-3l-4-2-2 2c-3.5-1.5-6.5-4.5-8-8l2-2-2-4Z" />
    ),
    ruler: (
      <>
        <path d="m4 17 13-13 3 3L7 20H4v-3Z" />
        <path d="m14 7 3 3M11 10l2 2M8 13l3 3" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
      </>
    ),
    moon: <path d="M20.9 13.1A8.5 8.5 0 0 1 10.9 3.1 8.5 8.5 0 1 0 20.9 13.1Z" />,
    shield: (
      <>
        <path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    sparkle: (
      <>
        <path d="m12 3 1.4 4.6L18 9l-4.6 1.4L12 15l-1.4-4.6L6 9l4.6-1.4L12 3Z" />
        <path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z" />
      </>
    ),
    whatsapp: (
      <>
        <path d="M20 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20l1.2-4.2A8.5 8.5 0 1 1 20 11.5Z" />
        <path d="M8 8c.5 4 3 6.5 7 7l1-2-2.5-1-1 1c-1.5-.7-2.8-2-3.5-3.5l1-1L9 6 8 8Z" />
      </>
    ),
  };
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

export type PropertyListing = {
  id: string;
  reference: string;
  name: string;
  city: string;
  type: string;
  meta: string;
  price: string;
  priceAmount: number | null;
  isNegotiable?: boolean;
  currency: string | null;
  pricingPeriod: string | null;
  image: string;
  description: string;
  bedrooms: number | null;
  bathrooms: number | null;
  livingArea: number | null;
  landArea: number | null;
  address: string;
  images: { src: string; alt: string; caption: string; mimeType?: string }[];
};

function newsListingImages(slug: string, photoCount: number, videoCount: number, location: string) {
  const base = `/property-media/news/${slug}`;
  const photos = Array.from({ length: photoCount }, (_, index) => ({
    src: `${base}/photo-${String(index + 1).padStart(2, "0")}.jpg`,
    alt: `Bien immobilier à ${location} — vue ${index + 1}`,
    caption: `Photo ${String(index + 1).padStart(2, "0")} de l’annonce`,
  }));
  const videos = Array.from({ length: videoCount }, (_, index) => ({
    src: `${base}/visite-${String(index + 1).padStart(2, "0")}.mp4`,
    alt: `Visite vidéo du bien à ${location}`,
    caption: `Vidéo de visite du bien à ${location}`,
    mimeType: "video/mp4",
  }));
  return photos.length
    ? [...photos, ...videos]
    : [
        {
          src: `${base}/cover.jpg`,
          alt: `Aperçu du bien à ${location}, extrait de la vidéo fournie`,
          caption: "Aperçu extrait de la vidéo de visite",
        },
        ...videos,
      ];
}

const kinshasaSeedListingImage = (path: string, alt: string) => ({
  src: path,
  alt,
  caption: "",
});

export const starterProperties: PropertyListing[] = [
  {
    id: "00000000-0000-4000-8000-000000000101",
    reference: "DAFS-BDL-001",
    name: "Maison basse avec parcelle à Bandalungwa",
    city: "Kinshasa, Bandalungwa, Bandal Molard",
    type: "Maison · Vente",
    meta: "186 m² de parcelle · 3 chambres · 2 salles d’eau",
    price: "240 000 $US · à discuter",
    priceAmount: 240000,
    currency: "USD",
    pricingPeriod: "fixed",
    image: "/property-media/bandal/bandal-01.jpg",
    description: "Parcelle habitable située à Bandal Molard, dans un environnement résidentiel calme et sur une avenue asphaltée. La maison comprend 3 chambres, 2 salles d’eau, une cuisine, un salon spacieux, une véranda et un parking. Dimensions annoncées : 9,30 m × 20 m (environ 186 m²). Prix annoncé : 240 000 USD, à discuter. Repère communiqué : direction Maman Colonel. Adresse exacte à préciser auprès de DAFS Sarlu.",
    bedrooms: 3,
    bathrooms: 2,
    livingArea: null,
    landArea: 186,
    address: "Repère communiqué : direction Maman Colonel · adresse exacte à confirmer",
    images: [1, 2, 3, 4].map((n) => kinshasaSeedListingImage(`/property-media/bandal/bandal-${String(n).padStart(2, "0")}.jpg`, `Maison à vendre à Bandal Molard, vue ${n}`)),
  },
  {
    id: "00000000-0000-4000-8000-000000000102",
    reference: "DAFS-LNG-001",
    name: "Immeuble de 7 appartements à Lingwala",
    city: "Kinshasa, Lingwala, Mushi",
    type: "Immeuble · Vente",
    meta: "7 appartements · 2 boutiques · Parking · Terrasse",
    price: "900 000 $US",
    priceAmount: 900000,
    currency: "USD",
    pricingPeriod: "fixed",
    image: "/property-media/lingwala/lingwala-01.jpg",
    description: "Immeuble annoncé avec 7 appartements neufs, un parking au rez-de-chaussée, 2 boutiques et une grande terrasse au dernier niveau. Le propriétaire indique une ligne électrique privée disponible 24 h/24 et 7 j/7 ainsi qu’un approvisionnement en eau. Année de construction annoncée : 2026 ; terrain acquis en 2024. Document mentionné : CE. Prix annoncé : 900 000 USD, offre directe. Adresse complète à renseigner.",
    bedrooms: null,
    bathrooms: null,
    livingArea: null,
    landArea: null,
    address: "",
    images: [kinshasaSeedListingImage("/property-media/lingwala/lingwala-01.jpg", "Immeuble à vendre à Lingwala, Mushi")],
  },
  {
    id: "00000000-0000-4000-8000-000000000103",
    reference: "DAFS-MNG-001",
    name: "Parcelle avec maisons locatives à Mont-Ngafula",
    city: "Kinshasa, Mont-Ngafula, CPA",
    type: "Parcelle · Vente",
    meta: "Environ 360 m² · Maisons locatives",
    price: "330 000 $US · à discuter",
    priceAmount: 330000,
    currency: "USD",
    pricingPeriod: "fixed",
    image: "/property-media/mont-ngafula/mont-ngafula-01.jpg",
    description: "Parcelle mise en vente dans la commune de Mont-Ngafula, secteur CPA Mushi, quartier CPA. Dimensions annoncées : 18 m × 20 m (environ 360 m²), avec des maisons destinées à la location. Revenu mensuel indiqué par le vendeur : 3 000 USD ; ce montant reste à vérifier avec le vendeur. Prix annoncé : 330 000 USD, à discuter. Adresse exacte à compléter.",
    bedrooms: null,
    bathrooms: null,
    livingArea: null,
    landArea: 360,
    address: "CPA Mushi · adresse exacte à confirmer",
    images: Array.from({ length: 15 }, (_, i) => i + 1).map((n) => kinshasaSeedListingImage(`/property-media/mont-ngafula/mont-ngafula-${String(n).padStart(2, "0")}.jpg`, `Parcelle à vendre à Mont-Ngafula, vue ${n}`)),
  },
  {
    id: "00000000-0000-4000-8000-000000000104",
    reference: "DAFS-NGL-001",
    name: "Villa et appartements à Ngaliema",
    city: "Kinshasa, Ngaliema",
    type: "Villa · Vente",
    meta: "Environ 1 800 m² · 5 chambres · 6 appartements",
    price: "2 300 000 $US · à discuter",
    priceAmount: 2300000,
    currency: "USD",
    pricingPeriod: "fixed",
    image: "/property-media/ngaliema/ngaliema-tour-cover.jpg",
    description: "Ensemble situé à Ngaliema, avec une villa annoncée de 5 chambres, 2 salons, cuisine équipée et 4 salles de bain, ainsi que 6 appartements de 2 chambres chacun. La description mentionne également terrasse, bar, piscine, jardin et 2 groupes électrogènes. Dimensions annoncées : 30 m × 60 m (environ 1 800 m²). Prix annoncé pour l’ensemble : 2 300 000 USD, à discuter. Une division en deux lots de 30 m × 30 m avec la villa principale est également évoquée, au prix indicatif de 1 500 000 USD. Repère communiqué : Météo, palais du marbre. Disponibilité et conditions à confirmer auprès de DAFS Sarlu.",
    bedrooms: 5,
    bathrooms: 4,
    livingArea: null,
    landArea: 1800,
    address: "Repère communiqué : Météo, palais du marbre · adresse exacte à confirmer",
    images: [
      kinshasaSeedListingImage("/property-media/ngaliema/ngaliema-tour-cover.jpg", "Villa à vendre à Ngaliema, image extraite de la vidéo de visite"),
      { src: "/property-media/ngaliema/ngaliema-tour.mp4", alt: "Visite vidéo du bien à Ngaliema", caption: "Visite vidéo fournie pour le bien", mimeType: "video/mp4" },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000000201",
    reference: "DAFS-KTN-001",
    name: "Parcelle à vendre à Kintambo",
    city: "Kinshasa, Kintambo",
    type: "Parcelle · Vente",
    meta: "195 m² · 7,80 m × 25 m",
    price: "215 000 $US · prix annoncé ferme",
    priceAmount: 215000,
    currency: "USD",
    pricingPeriod: "fixed",
    image: "/property-media/news/kintambo/cover.jpg",
    description: "Parcelle à vendre dans la commune de Kintambo, à un emplacement présenté comme idéal par l’annonceur. Dimensions annoncées : 7,80 m × 25 m (environ 195 m²). Prix annoncé : 215 000 USD, indiqué comme le dernier prix. Les documents sont décrits comme « normaux » dans l’annonce ; leur nature et leur validité sont à vérifier auprès du vendeur. Adresse exacte à compléter.",
    bedrooms: null,
    bathrooms: null,
    livingArea: null,
    landArea: 195,
    address: "Commune de Kintambo · adresse exacte à préciser",
    images: newsListingImages("kintambo", 0, 1, "Kintambo"),
  },
  {
    id: "00000000-0000-4000-8000-000000000202",
    reference: "DAFS-NGO-001",
    name: "Parcelle à vendre à Binza Ozone, Cent-Casier",
    city: "Kinshasa, Ngaliema, Binza Ozone",
    type: "Parcelle · Vente",
    meta: "320 m² · 16 m × 20 m · divisible selon l’annonce",
    price: "300 000 $US · légèrement négociable",
    priceAmount: 300000,
    currency: "USD",
    pricingPeriod: "fixed",
    image: "/property-media/news/ngaliema-binza-ozone-cent-casier/cover.jpg",
    description: "Parcelle à vendre dans le quartier de Binza Ozone, référence Cent-Casier, sur une avenue asphaltée selon l’annonce. Dimensions annoncées : 16 m × 20 m (environ 320 m²). Le vendeur indique une possibilité de division en deux lots et mentionne également des dimensions de 8 m × 24 m à 150 000 USD par lot ; ces mesures sont à confirmer. Prix annoncé pour la parcelle : 300 000 USD, légèrement négociable. Certificat d’enregistrement annoncé, à vérifier. Visite sur demande.",
    bedrooms: null,
    bathrooms: null,
    livingArea: null,
    landArea: 320,
    address: "Référence Cent-Casier · adresse exacte à confirmer",
    images: newsListingImages("ngaliema-binza-ozone-cent-casier", 0, 1, "Binza Ozone, Cent-Casier"),
  },
  {
    id: "00000000-0000-4000-8000-000000000203",
    reference: "DAFS-NGT-001",
    name: "Maison de 2 chambres à Ngaliema, Champ de Tir",
    city: "Kinshasa, Ngaliema, Binza Ozone",
    type: "Maison · Vente",
    meta: "Parcelle de 180 m² · 2 chambres",
    price: "150 000 $US · à discuter",
    priceAmount: 150000,
    isNegotiable: true,
    currency: "USD",
    pricingPeriod: "fixed",
    image: "/property-media/news/ngaliema-champ-tir-binza-ozone/cover.jpg",
    description: "Maison avec parcelle à vendre dans le secteur Champ de Tir, à Binza Ozone, commune de Ngaliema. Référence communiquée : école Sévigné ; la parcelle se trouverait près du macadam. Dimensions annoncées : 12 m × 15 m (environ 180 m²). La maison comprendrait 2 chambres. Prix de départ annoncé : 150 000 USD, à discuter. Documents annoncés complets, à vérifier auprès du vendeur. Adresse exacte à confirmer.",
    bedrooms: 2,
    bathrooms: null,
    livingArea: null,
    landArea: 180,
    address: "Secteur Champ de Tir · référence école Sévigné · adresse exacte à confirmer",
    images: newsListingImages("ngaliema-champ-tir-binza-ozone", 0, 1, "Ngaliema, Champ de Tir"),
  },
  {
    id: "00000000-0000-4000-8000-000000000204",
    reference: "DAFS-NGO-002",
    name: "Maison de 5 chambres à Ngaliema, Ozone Champ de Tir",
    city: "Kinshasa, Ngaliema, Ozone Champ de Tir",
    type: "Maison · Vente",
    meta: "Parcelle de 500 m² · 5 chambres · salon",
    price: "500 000 $US · à discuter",
    priceAmount: 500000,
    isNegotiable: true,
    currency: "USD",
    pricingPeriod: "fixed",
    image: "/property-media/news/ngaliema-ozone-champ-tir/cover.jpg",
    description: "Parcelle à vendre à Ngaliema, dans le secteur Ozone Champ de Tir. Dimensions annoncées : 25 m × 20 m (environ 500 m²). Une maison comprenant 5 chambres et un salon est mentionnée ; les autres pièces et caractéristiques restent à préciser. Prix annoncé : 500 000 USD, à discuter. Certificat d’enregistrement annoncé, à vérifier. Visite sur rendez-vous téléphonique. Adresse exacte à compléter.",
    bedrooms: 5,
    bathrooms: null,
    livingArea: null,
    landArea: 500,
    address: "Ngaliema, secteur Ozone Champ de Tir · adresse exacte à confirmer",
    images: newsListingImages("ngaliema-ozone-champ-tir", 4, 1, "Ngaliema, Ozone Champ de Tir"),
  },
];

function propertyTarget(type: string): Page {
  if (type.includes("Parcelle") || type.includes("Terrain")) return "land-detail";
  if (type.includes("Vente") || type.includes("Maison") || type.includes("Villa") || type.includes("Immeuble")) return "house-detail";
  if (type.includes("Longue")) return "long-detail";
  return "detail";
}

export type ArchitecturalPlan = { id: string; reference: string; name: string; meta: string; image: string; gallery?: string[]; description: string; category: string };
export type ServiceMedia = { id: string; title: string; description: string; url: string; alt: string; mimeType: string; poster?: string };
export type PublicService = { id: string; slug: string; title: string; eyebrow: string; summary: string; body: string; features: string[]; media: ServiceMedia[] };
export type PublicConstructionMedia = { id: string; title: string; description: string; alt: string; mimeType: string; url: string; collectionTitle: string; sortOrder: number };

const movingServiceMedia: ServiceMedia[] = [
  ...Array.from({ length: 24 }, (_, index) => {
    const number = String(index + 1).padStart(2, "0");
    return {
      id: `moving-photo-${number}`,
      title: `Photo d’intervention ${number}`,
      description: `Photo ${number} fournie pour présenter le service de déménagement et d’aménagement.`,
      url: `/service-media/moving/photos/photo-${number}.jpg`,
      alt: `Déménagement et aménagement — photo ${number}`,
      mimeType: "image/jpeg",
    };
  }),
  ...Array.from({ length: 11 }, (_, index) => {
    const number = String(index + 1).padStart(2, "0");
    return {
      id: `moving-video-${number}`,
      title: `Vidéo d’intervention ${number}`,
      description: `Vidéo ${number} fournie pour présenter le service de déménagement et d’aménagement.`,
      url: `/service-media/moving/videos/video-${number}.mp4`,
      alt: `Déménagement et aménagement — vidéo ${number}`,
      mimeType: "video/mp4",
      poster: `/service-media/moving/posters/video-${number}.jpg`,
    };
  }),
];



const planGallery = (folder: string, total: number) =>
  Array.from({ length: total }, (_, index) => `/plans/${folder}/vue-${String(index + 1).padStart(2, "0")}.jpg`);

export const starterPlans: ArchitecturalPlan[] = [
  {
    id: "starter-plan-immeuble",
    reference: "DAFS-PLN-001",
    name: "Immeuble contemporain",
    category: "Immeuble résidentiel",
    meta: "Perspectives 3D · caractéristiques à confirmer",
    image: "/plans/immeuble-contemporain/vue-03.jpg",
    gallery: planGallery("immeuble-contemporain", 12),
    description: "Un dossier de perspectives 3D présentant un immeuble contemporain à plusieurs niveaux, avec balcons et espaces de stationnement visibles. Le nombre de logements, les surfaces, le programme, les plans techniques et les possibilités d’adaptation sont à confirmer avec DAFS Sarlu.",
  },
  {
    id: "starter-plan-maison",
    reference: "DAFS-PLN-002",
    name: "Maison contemporaine à étage",
    category: "Maison contemporaine",
    meta: "Perspectives 3D · caractéristiques à confirmer",
    image: "/plans/maison-contemporaine/vue-01.jpg",
    gallery: planGallery("maison-contemporaine", 8),
    description: "Un ensemble de vues 3D autour d’une maison contemporaine à étage. Les pièces, les dimensions, les matériaux, le coût indicatif et la conformité au terrain doivent être étudiés avant tout projet.",
  },
];

type ConstructionGroup = {
  title: string;
  description: string;
  cover: string;
  photos: { src: string; alt: string }[];
  videos: { src: string; title: string }[];
};

const constructionGroups: ConstructionGroup[] = [
  {
    title: "Fondations et ferraillage",
    description: "Séquences visuelles autour du terrassement, des armatures et des travaux de fondation.",
    cover: "/construction-media/photos/soudure-armature.jpg",
    photos: [
      { src: "/construction-media/photos/soudure-armature.jpg", alt: "Travail de soudure sur une armature métallique" },
      { src: "/construction-media/photos/armature-metal.jpg", alt: "Armature métallique préparée pour un chantier" },
    ],
    videos: Array.from({ length: 9 }, (_, index) => ({ src: `/construction-media/fondations/sequence-${String(index + 1).padStart(2, "0")}.mp4`, title: `Séquence ${String(index + 1).padStart(2, "0")}` })),
  },
  {
    title: "Armatures et structure",
    description: "Vues de ferraillage, de préparation des éléments porteurs et de travaux de structure.",
    cover: "/construction-media/posters/structure.jpg",
    photos: [],
    videos: Array.from({ length: 14 }, (_, index) => ({ src: `/construction-media/structure/sequence-${String(index + 1).padStart(2, "0")}.mp4`, title: `Séquence ${String(index + 1).padStart(2, "0")}` })),
  },
  {
    title: "Travaux sur site",
    description: "Séquences complémentaires montrant des interventions sur chantier et une équipe en tenue de travail.",
    cover: "/construction-media/photos/equipe-chantier.jpg",
    photos: [{ src: "/construction-media/photos/equipe-chantier.jpg", alt: "Équipe réunie sur un chantier" }],
    videos: Array.from({ length: 10 }, (_, index) => ({ src: `/construction-media/chantier/sequence-${String(index + 1).padStart(2, "0")}.mp4`, title: `Séquence ${String(index + 1).padStart(2, "0")}` })),
  },
];

const constructionAttributionNote = "Médias transmis à DAFS Sarlu. Le lieu, le mandat, les dates et l’attribution de chaque séquence sont à confirmer avec l’entreprise avant toute présentation comme référence client.";

export const starterPublicServices: PublicService[] = [
  {
    id: "fallback-demenagement-amenagement", slug: "demenagement-amenagement", title: "Déménagement & aménagement",
    eyebrow: "Déménagement et organisation des espaces",
    summary: "Un accompagnement pour préparer votre déménagement et aménager vos espaces selon vos besoins.",
    body: "DAFS Sarlu propose un accompagnement pour organiser un déménagement et préparer l’installation dans un nouvel espace. Chaque demande commence par la compréhension des lieux concernés, du volume à déplacer, des dates souhaitées et du résultat attendu.\n\nSelon le périmètre retenu avec l’entreprise, le projet peut inclure la préparation logistique, le déplacement des biens, leur installation ou une réflexion sur l’agencement. Les tâches exactes, les moyens de transport et de manutention, les fournitures, les accès et les éventuelles exclusions doivent être confirmés avant toute intervention.\n\nPour l’aménagement, décrivez l’usage de la pièce, les meubles ou équipements concernés, les contraintes du lieu et vos priorités. DAFS Sarlu pourra préciser les options qu’elle est en mesure de prendre en charge, les délais possibles et les modalités de la prestation.",
    features: ["Préparer l’organisation du déménagement selon le besoin communiqué.", "Étudier l’installation et l’agencement de l’espace selon le périmètre convenu.", "Confirmer les moyens, les dates, les tâches et le prix avant l’intervention."], media: movingServiceMedia,
  },
  {
    id: "fallback-cleaner", slug: "cleaner", title: "Cleaner", eyebrow: "Service de nettoyage",
    summary: "Un service de nettoyage pour vos logements et espaces professionnels.",
    body: "Le service Cleaner concerne le nettoyage de logements et d’espaces professionnels. Pour comprendre le besoin, indiquez le type de local, sa commune et son quartier, sa superficie approximative, son état actuel et les pièces ou zones à traiter.\n\nLa demande peut préciser les tâches recherchées — par exemple l’entretien courant ou un nettoyage plus approfondi — sans présumer que chaque option est disponible. DAFS Sarlu confirmera les tâches prises en charge, la fréquence possible, la durée estimée, les produits et équipements fournis ou à prévoir, ainsi que les conditions d’accès.\n\nAvant de convenir d’une intervention, faites préciser le périmètre, le calendrier, le prix et la personne responsable de l’ouverture ou de la remise des clés. Ces éléments permettent d’éviter les malentendus et d’établir une proposition adaptée au lieu.",
    features: ["Nettoyage de logements et d’espaces professionnels.", "Périmètre, tâches et fréquence précisés selon chaque lieu.", "Produits, équipements, calendrier et prix confirmés avec DAFS Sarlu."], media: [],
  },
];

function serviceIllustrationPath(slug: string) {
  const normalized = slug.toLowerCase();
  if (normalized.includes("clean") || normalized.includes("nettoyage")) {
    return "/service-illustrations/cleaner.svg";
  }
  return "/service-illustrations/moving.svg";
}

export type SiteSettings = {
  company_name: string;
  legal_name: string;
  description: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  about_title: string;
  about_content: string;
  faq_content: string;
  legal_content: string;
  home_title: string;
  home_intro: string;
};

function formatPrice(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(amount);
  } catch {
    return `${new Intl.NumberFormat("fr-FR").format(amount)} ${currency}`;
  }
}

function buildBudgetOptions(properties: PropertyListing[]) {
  const groups = new Map<string, number[]>();
  for (const property of properties) {
    if (!property.currency || property.priceAmount === null) continue;
    const prices = groups.get(property.currency) ?? [];
    prices.push(property.priceAmount);
    groups.set(property.currency, prices);
  }

  return [...groups.entries()].flatMap(([currency, prices]) => {
    const uniquePrices = [...new Set(prices)].sort((a, b) => a - b);
    const checkpoints = Array.from({ length: Math.min(5, uniquePrices.length) }, (_, index) =>
      uniquePrices[Math.ceil(((index + 1) * uniquePrices.length) / Math.min(5, uniquePrices.length)) - 1],
    );
    return [...new Set(checkpoints)].map((amount) => ({
      value: `${currency}|${amount}`,
      label: `Jusqu’à ${formatPrice(amount, currency)}`,
    }));
  });
}

const nav: { label: string; page: Page }[] = [
  { label: "Accueil", page: "home" },
  { label: "Locations", page: "rentals" },
  { label: "Acheter", page: "sales" },
  { label: "Plans architecturaux", page: "plans" },
  { label: "Services", page: "services" },
  { label: "Estimation", page: "estimate" },
  { label: "À propos", page: "about" },
  { label: "Contact", page: "contact" },
];

function Logo({ light = false, onClick }: { light?: boolean; onClick?: () => void }) {
  return (
    <button className={`logo${light ? " logo-footer" : ""}`} aria-label="DAFS Sarlu, agence immobilière, accueil" onClick={onClick}>
      <img className="logo-image" src="/brand/dafs-sarlu-logo.jpeg" alt="DAFS Sarlu" />
      <span className="logo-descriptor" aria-hidden="true">
        <span>Agence</span>
        <strong>immobilière</strong>
      </span>
    </button>
  );
}

function Header({
  page,
  go,
  whatsappHref,
  theme,
  onToggleTheme,
}: {
  page: Page;
  go: (p: Page) => void;
  whatsappHref: string;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Logo onClick={() => go("home")} />
        <nav className="desktop-nav" aria-label="Navigation principale">
          {nav.map((item) => (
            <button
              className={page === item.page || (page === "service-detail" && item.page === "services") ? "active" : ""}
              aria-current={page === item.page || (page === "service-detail" && item.page === "services") ? "page" : undefined}
              onClick={() => go(item.page)}
              key={item.page}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <button
          className="theme-toggle"
          type="button"
          aria-label={theme === "dark" ? "Passer au thème jour" : "Passer au thème nuit"}
          aria-pressed={theme === "dark"}
          title={theme === "dark" ? "Passer au thème jour" : "Passer au thème nuit"}
          onClick={onToggleTheme}
        >
          <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
        </button>
        <a className="contact-header" href={whatsappHref || "#contact"} target={whatsappHref ? "_blank" : undefined} rel={whatsappHref ? "noreferrer" : undefined} onClick={!whatsappHref ? (event) => { event.preventDefault(); go("contact"); } : undefined}>
          <Icon name="chat" size={17} /> Nous contacter
        </a>
        <button className="mobile-menu" onClick={() => setOpen(!open)} aria-label={open ? "Fermer le menu" : "Ouvrir le menu"} aria-expanded={open}>
          <Icon name={open ? "close" : "menu"} />
        </button>
      </div>
      {open && (
        <nav className="mobile-nav">
          {nav.map((item) => (
            <button
              key={item.page}
              onClick={() => {
                go(item.page);
                setOpen(false);
              }}
            >
              {item.label}
              <Icon name="chevron" />
            </button>
          ))}
        </nav>
      )}
    </header>
  );
}

function SectionHead({
  eyebrow,
  title,
  text,
  dark = false,
}: {
  eyebrow: string;
  title: string;
  text?: string;
  dark?: boolean;
}) {
  return (
    <div className={`section-head ${dark ? "dark" : ""}`}>
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {text && <p>{text}</p>}
    </div>
  );
}

function PropertyCard({ item, onSelect }: { item: PropertyListing; onSelect: (item: PropertyListing) => void }) {
  return (
    <article className="property-card">
      <button className="card-image" onClick={() => onSelect(item)}>
        {item.image ? <img src={item.image} alt="" loading="lazy" /> : <span className="card-image-empty" aria-hidden="true"><Icon name="building" size={30} /></span>}
        <span>{item.type}</span>
      </button>
      <div className="card-body">
        <div className="ref">{item.reference}</div>
        <h3>{item.name}</h3>
        <p className="location">
          <Icon name="map" size={16} /> {item.city}
        </p>
        <div className="card-meta">
          <span>{item.meta}</span>
        </div>
        <div className="card-footer">
          <strong>{item.price}</strong>
          <button aria-label={`Voir ${item.name}`} onClick={() => onSelect(item)}>
            <Icon name="arrow" />
          </button>
        </div>
      </div>
    </article>
  );
}

function PlanCard({ item, onSelect }: { item: ArchitecturalPlan; onSelect: (item: ArchitecturalPlan) => void }) {
  return (
    <article className="plan-card">
      <button className="plan-image" onClick={() => onSelect(item)}>
        <img src={item.image || "/service-illustrations/architecture.svg"} alt={item.image ? `Aperçu du plan ${item.name}` : `Illustration architecturale pour ${item.name}`} loading="lazy" />
        <span className="plan-tag">{item.image ? "Aperçu 3D" : "Illustration"}</span>
      </button>
      <div>
        <span className="ref">{item.reference}</span>
        <h3>{item.name}</h3>
        <p>{item.meta}</p>
        <button className="text-link" onClick={() => onSelect(item)}>
          Découvrir le modèle <Icon name="arrow" size={17} />
        </button>
      </div>
    </article>
  );
}

function PropertyDetailPage({ property, go, settings }: { property: PropertyListing; go: (page: Page) => void; settings: SiteSettings }) {
  const enquiryLink = createWhatsAppHref(settings, `Bonjour DAFS Sarlu, je souhaite obtenir des informations sur le bien ${property.reference} — ${property.name}.`);
  const facts = [
    property.bedrooms !== null && property.bedrooms !== undefined ? [property.bedrooms, "Chambres"] : null,
    property.bathrooms !== null && property.bathrooms !== undefined ? [property.bathrooms, "Salles d’eau"] : null,
    property.livingArea ? [`${property.livingArea} m²`, "Surface habitable"] : null,
    property.landArea ? [`${property.landArea} m²`, "Surface du terrain"] : null,
  ].filter(Boolean) as [string | number, string][];
  return (
    <main className="property-detail container">
      <div className="detail-breadcrumb"><button onClick={() => go("home")}>Accueil</button><Icon name="chevron" size={15} /><span>{property.type}</span></div>
      <div className="detail-heading"><div><span className="eyebrow">{property.reference} · {property.type}</span><h1>{property.name}</h1><p><Icon name="map" size={16} /> {property.city || property.address || "Localisation à confirmer"}</p>{property.address && <p className="detail-address">Adresse ou repère : {property.address}</p>}</div><strong>{property.price}</strong></div>
      <div className="detail-gallery">
        {property.images.length ? property.images.map((image, index) => <figure key={image.src} className={index === 0 ? "detail-gallery-main" : ""}>{image.mimeType?.startsWith("video/") ? <ExclusiveVideo controls preload="metadata" poster={property.image} src={image.src} aria-label={image.alt || property.name} /> : <img src={image.src} alt={image.alt || property.name} />}{image.caption && <figcaption>{image.caption}</figcaption>}</figure>) : <div className="detail-gallery-empty"><Icon name="building" size={36} /><span>Aucun visuel fourni pour ce bien</span></div>}
      </div>
      {facts.length > 0 && <div className="detail-facts">{facts.map(([value, label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div>}
      <div className="detail-content">
        <section><h2>À propos de ce bien</h2><p>{property.description || "La description détaillée de ce bien sera renseignée par DAFS Sarlu."}</p></section>
        <aside><span className="eyebrow">Vous êtes intéressé ?</span><h2>{property.price}</h2><p>Contactez l’équipe pour obtenir plus d’informations ou organiser une visite.</p>{enquiryLink ? <a className="btn navy" href={enquiryLink} target="_blank" rel="noreferrer">Demander sur WhatsApp <Icon name="arrow" /></a> : <button className="btn navy" onClick={() => go("contact")}>Demander des informations <Icon name="arrow" /></button>}</aside>
      </div>
    </main>
  );
}

function PlanDetailPage({ plan, go, settings }: { plan: ArchitecturalPlan; go: (page: Page) => void; settings: SiteSettings }) {
  const enquiryLink = createWhatsAppHref(settings, `Bonjour DAFS Sarlu, je souhaite demander des informations sur le plan ${plan.reference} — ${plan.name}.`);
  return (
    <main className="plan-detail container">
      <div className="detail-breadcrumb"><button onClick={() => go("plans")}>Plans architecturaux</button><Icon name="chevron" size={15} /><span>{plan.reference}</span></div>
      <div className="plan-detail-grid">
        <div className="plan-detail-media">
          <div className="plan-detail-preview">{plan.image ? <img src={plan.image} alt={`Vue principale — ${plan.name}`} /> : <div className="detail-gallery-empty"><Icon name="layers" size={36} /><span>Aucun aperçu fourni pour ce plan</span></div>}</div>
          {(plan.gallery?.filter((image) => image !== plan.image) ?? []).length > 0 && (
            <div className="plan-gallery" aria-label={`Toutes les vues de ${plan.name}`}>
              {plan.gallery?.filter((image) => image !== plan.image).map((image, index) => (
                <figure key={image}><img src={image} alt={`${plan.name} — vue ${index + 2}`} loading="lazy" /><figcaption>Vue {String(index + 2).padStart(2, "0")}</figcaption></figure>
              ))}
            </div>
          )}
        </div>
        <section><span className="eyebrow">{plan.reference} · {plan.category || "Plan architectural"}</span><h1>{plan.name}</h1><p className="plan-detail-meta">{plan.meta || "Caractéristiques à renseigner"}</p><p>{plan.description || "Contactez DAFS Sarlu pour obtenir des informations sur ce modèle."}</p>{enquiryLink ? <a className="btn navy" href={enquiryLink} target="_blank" rel="noreferrer">Demander sur WhatsApp <Icon name="arrow" /></a> : <button className="btn navy" onClick={() => go("contact")}>Demander le plan complet <Icon name="arrow" /></button>}<small>Les plans techniques et les dimensions détaillées sont à demander à DAFS Sarlu.</small></section>
      </div>
    </main>
  );
}

function ServicesDirectory({ services, onSelect }: { services: PublicService[]; onSelect: (service: PublicService) => void }) {
  return <>
    <PageHero eyebrow="Nos services" title="Des solutions pour votre quotidien" text="Découvrez les services proposés par DAFS Sarlu." />
    <section className="section container service-public-list">
      {services.length ? (
        <div className="service-public-grid">
          {services.map((service) => {
            const cover = service.media.find((asset) => asset.mimeType.startsWith("image/"));
            return (
              <button
                className="service-public-card"
                key={service.id}
                onClick={() => onSelect(service)}
                aria-label={`Voir le détail du service ${service.title}`}
              >
                <div className="service-public-image">
                  {cover ? (
                    <img src={cover.url} alt={cover.alt || cover.title} loading="lazy" />
                  ) : (
                    <img
                      className="service-svg"
                      src={serviceIllustrationPath(service.slug)}
                      alt={`Illustration du service ${service.title}`}
                      loading="lazy"
                    />
                  )}
                </div>
                <div className="service-public-copy">
                  <span className="eyebrow">{service.eyebrow || "DAFS Sarlu"}</span>
                  <h2>{service.title}</h2>
                  <p>{service.summary}</p>
                  <span className="text-link">
                    Découvrir le service <Icon name="arrow" size={16} />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <PublishedContentEmpty
          title="Nos services seront bientôt présentés"
          description="Les pages de services apparaîtront dès leur publication depuis l’espace d’administration."
        />
      )}
    </section>
  </>;
}

function PublicServicePage({ service, go, settings }: { service: PublicService; go: (page: Page) => void; settings: SiteSettings }) {
  const whatsAppRequest = service.slug.includes("clean")
    ? "Bonjour DAFS Sarlu, je souhaite demander des informations sur le service Cleaner."
    : "Bonjour DAFS Sarlu, je souhaite demander des informations sur le déménagement et l’aménagement.";
  return <>
    <PageHero eyebrow={service.eyebrow || "Nos services"} title={service.title} text={service.summary} />
    <main className="container public-service-detail">
      <div className="public-service-intro">
        <div className="editorial-page">{service.body.split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
        {service.features.length > 0 && <section className="public-service-features"><span className="eyebrow">Notre accompagnement</span><ul>{service.features.map((feature) => <li key={feature}><Icon name="check" size={18} />{feature}</li>)}</ul></section>}
        <section className="service-next-steps">
          <h2>Pour préparer votre demande</h2>
          {service.slug.includes("clean") ? (
            <ul><li>Précisez s’il s’agit d’un logement ou d’un espace professionnel.</li><li>Indiquez la commune, le quartier, la superficie approximative et l’état des lieux.</li><li>Décrivez les tâches souhaitées, la fréquence envisagée et la période qui vous convient.</li></ul>
          ) : (
            <ul><li>Indiquez les lieux de départ et d’arrivée, avec les communes ou quartiers concernés.</li><li>Décrivez le volume à déplacer et les meubles à démonter ou à installer.</li><li>Précisez les dates souhaitées, les accès et les contraintes connues.</li></ul>
          )}
          <p>Ces repères servent à mieux comprendre votre besoin. Le périmètre, les disponibilités, les moyens mobilisés et le prix sont à confirmer avec DAFS Sarlu avant toute intervention.</p>
        </section>
        <a className="btn navy" href={createWhatsAppHref(settings, whatsAppRequest)} target="_blank" rel="noreferrer">Demander ce service sur WhatsApp <Icon name="arrow" /></a>
      </div>
      {service.media.length > 0 ? (
        <section className="public-service-media" aria-label={`Médias : ${service.title}`}>
          <header className="public-service-media-heading">
            <span className="eyebrow">Galerie de réalisations</span>
            <h2>Photos et vidéos</h2>
            <p>Découvrez en images le service {service.title}.</p>
          </header>
          {service.media.map((asset) =>
            asset.mimeType.startsWith("video/") ? (
              <figure key={asset.id}>
                <ExclusiveVideo controls preload="none" src={asset.url} poster={asset.poster} aria-label={asset.title} />
                <figcaption>{asset.description || asset.title}</figcaption>
              </figure>
            ) : (
              <figure key={asset.id}>
                <img src={asset.url} alt={asset.alt || asset.title} loading="lazy" />
                <figcaption>{asset.description || asset.title}</figcaption>
              </figure>
            ),
          )}
        </section>
      ) : (
        <figure className="public-service-artwork">
          <img src={serviceIllustrationPath(service.slug)} alt={`Illustration du service ${service.title}`} />
          <figcaption>Illustration du service · {service.title}</figcaption>
        </figure>
      )}
    </main>
  </>;
}

function HomePage({
  go,
  onSelectProperty,
  settings,
  properties,
  plans,
  services,
  onSelectService,
  onQuickSearch,
  loading,
  loadError,
}: {
  go: (p: Page) => void;
  onSelectProperty: (property: PropertyListing) => void;
  settings: SiteSettings;
  properties: PropertyListing[];
  plans: ArchitecturalPlan[];
  services: PublicService[];
  onSelectService: (service: PublicService) => void;
  onQuickSearch: (type: string, city: string, budget: string) => void;
  loading: boolean;
  loadError: boolean;
}) {
  const [serviceType, setServiceType] = useState("short-rental");
  const [city, setCity] = useState("");
  const [budget, setBudget] = useState("");
  const cities = [...new Set(properties.map((property) => property.city).filter(Boolean))].sort();
  const budgetOptions = buildBudgetOptions(properties);
  const heroListing = properties.find((property) => property.image);
  const heroPlan = plans.find((plan) => plan.image);
  const heroImage = heroListing?.image || heroPlan?.image || "/architecture/immeuble-3d-render.jpg";
  const heroAlt = heroListing?.name
    ? `Bien immobilier publié : ${heroListing.name}`
    : heroPlan?.name
      ? `Aperçu architectural : ${heroPlan.name}`
      : "Rendu 3D d’un immeuble partagé dans les visuels architecturaux DAFS Sarlu";
  return (
    <>
      <section className="hero">
        <div className="hero-artwork"><img src={heroImage} alt={heroAlt} /></div>
        <div className="hero-shade" />
        <div className="container hero-content">
          <span className="hero-kicker hero-services">
            <span /> Immobilier - Architecture - Déménagement &amp; Aménagement - Cleaner.
          </span>
          <h1 className="hero-home-title">
            {settings.home_title?.split("\n")[0] || "Trouvez votre espace."}
            <br />
            <em>{settings.home_title?.split("\n").slice(1).join(" ") || "Imaginez votre avenir."}</em>
          </h1>
          <p>
            {settings.home_intro || "Immobilier, architecture et services : découvrez les offres publiées par DAFS Sarlu et trouvez l’accompagnement adapté à votre projet."}
          </p>
          <div className="hero-actions">
            <button className="btn orange" onClick={() => go("rentals")}>
              Explorer les biens <Icon name="arrow" />
            </button>
            <button className="btn glass" onClick={() => go("plans")}>
              Découvrir nos plans
            </button>
          </div>
        </div>
        <div className="hero-count">
          <b>{String(properties.length).padStart(2, "0")}</b>
          <span />
          <small>biens publiés</small>
        </div>
      </section>
      <div className="container search-wrap">
        <form
          className="quick-search"
          onSubmit={(e) => {
            e.preventDefault();
            onQuickSearch(serviceType, city, budget);
          }}
        >
          <label>
            <span>Je recherche</span>
            <select value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
              <option value="short-rental">Location courte durée</option>
              <option value="long-rental">Location longue durée</option>
              <option value="houses">Maisons à vendre</option>
              <option value="parcels">Parcelles à vendre</option>
              <option value="plans">Plans architecturaux</option>
              <option value="moving">Déménagement & aménagement</option>
              <option value="cleaner">Cleaner</option>
            </select>
          </label>
          <label>
            <span>Ville, commune ou quartier</span>
            <select value={city} onChange={(e) => setCity(e.target.value)}>
              <option value="">Toutes les villes</option>
              {cities.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </label>
          <label>
            <span>Budget</span>
            <select value={budget} onChange={(e) => setBudget(e.target.value)}>
              <option value="">Tous les budgets</option>
              {budgetOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <button className="search-submit">
            <Icon name="search" /> Rechercher
          </button>
        </form>
      </div>
      <section className="section container">
        <SectionHead
          eyebrow="Nos expertises"
          title="Un projet, un service adapté"
          text="Explorez les offres immobilières, les plans architecturaux et les nouveaux services de DAFS Sarlu."
        />
        <div className="category-grid">
          {[
            ["01", "Séjours", "Location courte durée", "Des logements proposés pour vos séjours.", "rentals" as Page, "bed" as IconName],
            ["02", "S’installer", "Location longue durée", "Des logements adaptés à votre quotidien.", "rentals" as Page, "home" as IconName],
            ["03", "Acheter", "Maisons à vendre", "Consultez les maisons actuellement publiées.", "sales" as Page, "building" as IconName],
            ["04", "Investir", "Parcelles à vendre", "Découvrez les parcelles actuellement publiées.", "sales" as Page, "map" as IconName],
            ["05", "Concevoir", "Plans architecturaux", "Explorez les modèles et leurs aperçus autorisés.", "plans" as Page, "layers" as IconName],
            ["06", "Construire", "Estimation de construction", "Préparez une demande d’étude de votre projet.", "estimate" as Page, "ruler" as IconName],
          ].map(([num, over, title, text, page, icon]) => (
            <button className="category-card" key={String(num)} onClick={() => go(page as Page)}>
              <span className="category-icon"><Icon name={icon as IconName} size={24} /></span>
              <span className="category-num">{num}</span>
              <span className="category-over">{over}</span>
              <h3>{title}</h3>
              <p>{text}</p>
              <span className="round-arrow">
                <Icon name="arrow" />
              </span>
            </button>
          ))}
        </div>
      </section>
      {services.length > 0 && (
        <section className="section service-home-section">
          <div className="container">
            <div className="split-heading">
              <SectionHead
                eyebrow="Au-delà de l’immobilier"
                title="Des espaces prêts à vivre"
                text="Découvrez nos équipes et nos services pour préparer, aménager et entretenir vos espaces."
              />
              <button className="text-link" onClick={() => go("services")}>
                Tous nos services <Icon name="arrow" size={17} />
              </button>
            </div>
            <div className="service-home-grid">
              {services.slice(0, 2).map((service, index) => {
                const cover = service.media.find((asset) => asset.mimeType.startsWith("image/"));
                return (
                  <button
                    key={service.id}
                    className="service-home-card"
                    onClick={() => onSelectService(service)}
                    aria-label={`Découvrir le service ${service.title}`}
                  >
                    <span className={`service-home-visual ${cover ? "has-image" : "is-illustration"}`}>
                      {cover ? (
                        <img src={cover.url} alt={cover.alt || cover.title} loading="lazy" />
                      ) : (
                        <img
                          className="service-home-illustration"
                          src={serviceIllustrationPath(service.slug)}
                          alt={`Illustration du service ${service.title}`}
                          loading="lazy"
                        />
                      )}
                      <span className="service-home-visual-label">
                        {String(index + 1).padStart(2, "0")} <span>·</span> {service.eyebrow || "DAFS Sarlu"}
                      </span>
                      <span className="service-home-visual-title">{service.title}</span>
                    </span>
                    <span className="service-home-copy">
                      <em>{service.summary}</em>
                      <span className="service-home-link">
                        Découvrir le service <Icon name="arrow" size={16} />
                      </span>
                    </span>
                    <span className="service-home-arrow"><Icon name="arrow" /></span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}
      <section className="section soft-bg">
        <div className="container">
          <div className="split-heading">
            <SectionHead eyebrow="Sélection du moment" title="Des lieux à découvrir" />
            <button className="text-link" onClick={() => go("rentals")}>
              Voir tous les biens <Icon name="arrow" size={17} />
            </button>
          </div>
          {loading ? (
            <PublishedContentEmpty title="Chargement des annonces…" description="" />
          ) : loadError && properties.length === 0 ? (
            <PublishedContentEmpty
              title="Le catalogue est en cours de configuration"
              description="Les annonces publiées apparaîtront ici dès que la connexion sera disponible."
            />
          ) : properties.length ? (
            <div className="property-grid">
              {properties.slice(0, 3).map((item) => (
                <PropertyCard item={item} onSelect={onSelectProperty} key={item.id} />
              ))}
            </div>
          ) : (
            <PublishedContentEmpty
              title="Les annonces seront bientôt disponibles"
              description="Les biens publiés par l’équipe DAFS Sarlu apparaîtront dans cet espace."
              action="Voir les locations"
              onAction={() => go("rentals")}
            />
          )}
        </div>
      </section>
      <section className="architecture-feature">
        <div className="arch-photo">
          <img
            src={plans.find((plan) => plan.image)?.image || "/architecture/immeuble-3d-render.jpg"}
            alt={plans.find((plan) => plan.image)?.name ? `Aperçu du plan ${plans.find((plan) => plan.image)?.name}` : "Rendu 3D d’un immeuble partagé dans les visuels architecturaux DAFS Sarlu"}
            loading="lazy"
          />
          <div className="arch-number">
            {plans.length ? plans.length.toString().padStart(2, "0") : "3D"}<span>{plans.length ? "modèles publiés" : "aperçu architectural"}</span>
          </div>
        </div>
        <div className="arch-copy">
          <SectionHead
            dark
            eyebrow="Bibliothèque architecturale"
            title="Dessiner aujourd'hui les espaces de demain."
            text={plans.length ? "Explorez les modèles publiés par DAFS Sarlu." : "Les plans architecturaux seront présentés ici dès leur publication."}
          />
          <button className="btn orange" onClick={() => go("plans")}>
            Explorer les modèles <Icon name="arrow" />
          </button>
          <button className="btn glass" onClick={() => go("construction")}>
            Voir les chantiers en images <Icon name="arrow" />
          </button>
        </div>
      </section>
      <section className="estimate-banner">
        <div className="container estimate-inner">
          <div>
            <span className="eyebrow">Votre projet en perspective</span>
            <h2>Obtenez une première estimation de construction.</h2>
            <p>
              Présentez votre projet à DAFS Sarlu pour préciser les informations nécessaires à son étude.
            </p>
          </div>
          <button className="btn navy" onClick={() => go("estimate")}>
            Démarrer l'estimation <Icon name="arrow" />
          </button>
        </div>
      </section>
      <section className="section container">
        <SectionHead eyebrow="Nos activités" title="Des services pour vos projets" />
        <div className="values-grid">
          {[
            [
              "shield",
              "Immobilier",
              "Locations et biens à vendre publiés par DAFS Sarlu.",
            ],
            [
              "ruler",
              "Architecture",
              "Des modèles de plans architecturaux à parcourir.",
            ],
            [
              "people",
              "Déménagement & aménagement",
              "Un service pour préparer le déménagement et penser l’organisation des espaces.",
            ],
            [
              "sparkle",
              "Cleaner",
              "Nettoyage de logements et d’espaces professionnels.",
            ],
          ].map(([icon, title, text]) => (
            <div className="value" key={title}>
              <span>
                <Icon name={icon as IconName} />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>
      <Cta go={go} settings={settings} />
    </>
  );
}

function PublishedContentEmpty({
  title,
  description,
  action,
  onAction,
}: {
  title: string;
  description: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="published-empty" role="status">
      <span aria-hidden="true"><Icon name="building" size={22} /></span>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      {action && onAction && <button className="text-link" onClick={onAction}>{action} <Icon name="arrow" size={16} /></button>}
    </div>
  );
}

function EmptyPublicPage({
  title,
  description,
  go,
}: {
  title: string;
  description: string;
  go: (page: Page) => void;
}) {
  return (
    <>
      <PageHero eyebrow="DAFS Sarlu" title={title} text={description} />
      <section className="section container">
        <PublishedContentEmpty
          title="Aucun contenu publié pour le moment"
          description="Cette page sera renseignée depuis l’espace d’administration."
          action="Retour à l’accueil"
          onAction={() => go("home")}
        />
      </section>
    </>
  );
}

function EditablePublicPage({
  title,
  content,
  go,
}: {
  title: string;
  content: string;
  go: (page: Page) => void;
}) {
  if (!content.trim()) {
    return <EmptyPublicPage title={title} description="Cette page sera renseignée depuis l’espace d’administration." go={go} />;
  }
  const sections = title.toLowerCase().includes("à propos") && content.includes("consulter les fiches de services et transmettre une demande depuis la page Contact")
    ? [
        ["Une entreprise tournée vers les projets et les espaces", "DAFS Sarlu réunit des activités immobilières, architecturales et des services pratiques liés aux espaces. Le site présente les biens, les modèles de plans et les prestations que l’entreprise choisit de publier. Chaque annonce et chaque demande doivent être confirmées directement auprès de l’équipe avant tout engagement."],
        ["Immobilier", "L’offre immobilière couvre la location de logements et la vente de maisons, parcelles et autres biens publiés. Les informations de chaque fiche proviennent des données disponibles au moment de sa publication. Le prix, la disponibilité, les documents et les conditions doivent être vérifiés avec DAFS Sarlu."],
        ["Architecture et construction", "La bibliothèque permet de découvrir des aperçus de modèles architecturaux. Une adaptation à un terrain ou à un programme précis nécessite un échange dédié. Une éventuelle estimation de construction dépend des plans, des surfaces, des matériaux, des finitions et du lieu ; elle reste indicative tant qu’un devis formel n’a pas été établi."],
        ["Déménagement et aménagement", "DAFS Sarlu propose un accompagnement pour préparer un déménagement et organiser un espace. Le besoin peut concerner le transport, la manutention, l’installation ou la réflexion sur l’agencement, selon les moyens et le périmètre confirmés par l’entreprise pour chaque demande."],
        ["Cleaner", "Le service Cleaner concerne le nettoyage de logements et d’espaces professionnels. Le type de nettoyage, les tâches, les produits ou équipements fournis, la fréquence et les zones desservies sont à préciser directement avec DAFS Sarlu."],
        ["Notre façon de travailler", "Pour recevoir une réponse utile, décrivez le lieu, le service recherché, vos dates et vos coordonnées. L’équipe pourra alors confirmer si la demande entre dans son périmètre, recueillir les détails manquants et préciser les prochaines étapes."],
      ]
    : [];
  return (
    <>
      <PageHero eyebrow="DAFS Sarlu" title={title} text="" />
      <section className="section container editorial-page">
        {sections.length ? <>
          {content.split(/\n\s*\n/).map((paragraph, index) => <p className="about-intro-copy" key={index}>{paragraph}</p>)}
          {sections.map(([heading, paragraph]) => <section className="about-copy-section" key={heading}><h2>{heading}</h2><p>{paragraph}</p></section>)}
        </> : content.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
      </section>
    </>
  );
}

function FAQPage({ content, go }: { content: string; go: (page: Page) => void }) {
  const questions = [
    ["Comment consulter les biens disponibles ?", "Parcourez les locations et les biens à vendre. Les fiches publiées présentent les informations communiquées par DAFS Sarlu. Contactez l’équipe avec la référence du bien pour vérifier sa disponibilité et ses modalités."],
    ["Comment demander des précisions sur un bien ?", "Ouvrez sa fiche puis transmettez votre question depuis la page Contact. La disponibilité, le prix et les caractéristiques sont à confirmer auprès de DAFS Sarlu."],
    ["Puis-je demander un plan architectural ?", "Consultez les modèles publiés dans la bibliothèque. Pour parler d’un besoin particulier ou d’une adaptation, choisissez « Plan architectural » dans le formulaire de contact."],
    ["Comment obtenir une estimation de construction ?", "Décrivez votre projet depuis la page Estimation. L’équipe pourra préciser les informations nécessaires et la suite à donner. Toute estimation communiquée après étude reste indicative."],
    ["Que couvrent les services Déménagement & aménagement et Cleaner ?", "Le service Déménagement & aménagement concerne la préparation d’un déménagement et l’organisation des espaces. Cleaner concerne le nettoyage de logements et d’espaces professionnels. Le périmètre se précise avec DAFS Sarlu selon votre demande."],
    ["Comment préparer une demande de déménagement ?", "Indiquez les lieux de départ et d’arrivée, la date souhaitée, le volume à transporter, les éléments à démonter et les contraintes d’accès. Ces informations aideront DAFS Sarlu à évaluer le périmètre de la prestation."],
    ["Que faut-il préciser pour demander Cleaner ?", "Décrivez le type de lieu, la commune et le quartier, la superficie approximative, les tâches souhaitées et la fréquence. Confirmez avec DAFS Sarlu les produits, équipements, disponibilités et modalités."],
    ["Les prix affichés sont-ils définitifs ?", "Les prix des biens sont ceux communiqués dans les annonces et doivent être confirmés auprès de DAFS Sarlu. Les tarifs des services et les estimations de construction sont à convenir après étude du besoin."],
    ["Comment contacter DAFS Sarlu ?", "Utilisez le formulaire de contact ou écrivez à dafssarlu@gmail.com. Indiquez au moins un moyen de vous joindre dans le formulaire."],
  ];
  return <>
    <PageHero eyebrow="Besoin d’un renseignement ?" title="Questions fréquentes" text="Quelques repères pour parcourir les offres et contacter DAFS Sarlu." />
    <section className="section container">
      {content.trim() ? (
        <div className="editorial-page">{content.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
      ) : (
        <div className="public-faq-list">{questions.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>
      )}
      <button className="btn navy" onClick={() => go("contact")}>Poser une question <Icon name="arrow" /></button>
    </section>
  </>;
}

function EstimatePage({ onContact }: { onContact: () => void }) {
  return <>
    <PageHero eyebrow="Construction" title="Parlons de votre projet" text="Une estimation dépend des caractéristiques de votre projet et des paramètres étudiés par DAFS Sarlu." />
    <section className="section container estimate-request">
      <div className="editorial-page">
        <h2>Demandez une étude indicative</h2>
        <p>Transmettez les premières informations disponibles : type de construction, localisation, surface envisagée, niveau de finition souhaité et calendrier. L’équipe pourra vous préciser les éléments nécessaires pour étudier votre demande.</p>
        <p>Le site ne publie pas de prix de construction préétablis. Toute estimation communiquée après étude est indicative et ne constitue pas un devis contractuel.</p>
      </div>
      <button className="btn navy" onClick={onContact}>Décrire mon projet <Icon name="arrow" /></button>
    </section>
  </>;
}

function CataloguePage({
  mode,
  go,
  onSelectProperty,
  properties,
  loading,
  loadError,
}: {
  mode: "rentals" | "sales";
  go: (p: Page) => void;
  onSelectProperty: (property: PropertyListing) => void;
  properties: PropertyListing[];
  loading: boolean;
  loadError: boolean;
}) {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState(() => searchParams.get("kind") ?? "Tous");
  const [city, setCity] = useState(() => searchParams.get("city") ?? "");
  const [budget, setBudget] = useState(() => searchParams.get("budget") ?? "");
  const [bedrooms, setBedrooms] = useState("");
  const [landArea, setLandArea] = useState("");
  const [sortOrder, setSortOrder] = useState("recent");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const cities = [...new Set(properties.map((property) => property.city).filter(Boolean))].sort();
  const budgetOptions = buildBudgetOptions(properties);
  const bedroomOptions = [...new Set(properties.map((property) => property.bedrooms).filter((value): value is number => value !== null))].sort((a, b) => a - b);
  const landAreaOptions = [...new Set(properties.map((property) => property.landArea).filter((value): value is number => value !== null))].sort((a, b) => a - b);

  useEffect(() => {
    setKind(searchParams.get("kind") ?? "Tous");
    setCity(searchParams.get("city") ?? "");
    setBudget(searchParams.get("budget") ?? "");
    setBedrooms("");
    setLandArea("");
    setPageNumber(1);
  }, [searchParams]);

  const filtered = useMemo(
    () =>
      properties.filter((p) => {
        const modeOk = mode === "rentals" ? p.type.includes("durée") : p.type.includes("Vente");
        const kindOk = kind === "Tous" || p.type.includes(kind);
        const cityOk = !city || p.city === city;
        const [currency, amountText] = budget.split("|");
        const budgetOk = !budget || (
          p.currency === currency && p.priceAmount !== null && p.priceAmount <= Number(amountText)
        );
        const bedroomsOk = !bedrooms || (p.bedrooms !== null && p.bedrooms >= Number(bedrooms));
        const landAreaOk = !landArea || p.landArea === Number(landArea);
        return (
          modeOk &&
          kindOk &&
          cityOk &&
          budgetOk &&
          bedroomsOk &&
          landAreaOk &&
          (p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.id.toLowerCase().includes(query.toLowerCase()))
        );
      }),
    [mode, query, kind, city, budget, bedrooms, landArea, properties],
  );
  const sortedProperties = useMemo(() => {
    const values = [...filtered];
    if (sortOrder === "price-asc") values.sort((a, b) =>
      (a.currency ?? "").localeCompare(b.currency ?? "") ||
      (a.priceAmount ?? Number.MAX_SAFE_INTEGER) - (b.priceAmount ?? Number.MAX_SAFE_INTEGER),
    );
    if (sortOrder === "price-desc") values.sort((a, b) =>
      (a.currency ?? "").localeCompare(b.currency ?? "") ||
      (b.priceAmount ?? -1) - (a.priceAmount ?? -1),
    );
    return values;
  }, [filtered, sortOrder]);
  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(sortedProperties.length / pageSize));
  const visibleProperties = sortedProperties.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
  return (
    <>
      <PageHero
          eyebrow={mode === "rentals" ? "Locations" : "Biens à vendre"}
        title={mode === "rentals" ? "Locations sélectionnées" : "Biens à vendre"}
        text={
          mode === "rentals"
            ? "Courte ou longue durée, découvrez des lieux adaptés à votre rythme."
            : "Maisons et parcelles : explorez des opportunités documentées."
        }
      />
      <section className="catalog-section container">
        <div className="catalog-top">
          <div>
            <span className="eyebrow">{filtered.length.toString().padStart(2, "0")} résultats</span>
            <h2>
              {mode === "rentals"
                ? "Trouvez votre prochain lieu"
                : "Trouvez votre prochain investissement"}
            </h2>
          </div>
          <button className="filter-mobile" onClick={() => setFiltersOpen(!filtersOpen)}>
            <Icon name="filter" /> Filtres
          </button>
        </div>
        <div className="catalog-layout">
          <aside className={filtersOpen ? "filters open" : "filters"}>
            <div className="filter-title">
              <h3>Affiner la recherche</h3>
              <button
                onClick={() => {
                  setQuery("");
                  setKind("Tous");
                  setCity("");
                  setBudget("");
                  setBedrooms("");
                  setLandArea("");
                  setSortOrder("recent");
                }}
              >
                Réinitialiser
              </button>
            </div>
            <label className="search-input">
              <Icon name="search" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPageNumber(1);
                }}
                placeholder="Nom ou référence"
              />
            </label>
            <div className="filter-group">
              <label>Type de bien</label>
              {[
                "Tous",
                ...(mode === "rentals" ? ["Courte", "Longue"] : ["Maison", "Parcelle"]),
              ].map((x) => (
                <button
                  key={x}
                  onClick={() => {
                    setKind(x);
                    setBedrooms("");
                    setLandArea("");
                    setPageNumber(1);
                  }}
                  className={kind === x ? "selected" : ""}
                >
                  <span>{x}</span>
                  <span className="radio" />
                </button>
              ))}
            </div>
            <div className="filter-group">
              <label>Ville, commune ou quartier</label>
              <select value={city} onChange={(event) => { setCity(event.target.value); setPageNumber(1); }}>
                <option value="">Toutes les villes</option>
                {cities.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
            <div className="filter-group">
              <label>{mode === "sales" && kind === "Parcelle" ? "Superficie du terrain" : "Nombre de chambres"}</label>
              {mode === "sales" && kind === "Parcelle" ? (
                <select value={landArea} onChange={(event) => { setLandArea(event.target.value); setPageNumber(1); }}>
                  <option value="">Toutes superficies</option>
                  {landAreaOptions.map((area) => <option key={area} value={area}>{area} m²</option>)}
                </select>
              ) : (
                <select value={bedrooms} onChange={(event) => { setBedrooms(event.target.value); setPageNumber(1); }}>
                  <option value="">Toutes configurations</option>
                  {bedroomOptions.map((count) => <option key={count} value={count}>{count} chambre{count > 1 ? "s" : ""} et plus</option>)}
                </select>
              )}
            </div>
            <div className="filter-group">
              <label>Budget</label>
              <select value={budget} onChange={(event) => { setBudget(event.target.value); setPageNumber(1); }}>
                <option value="">Tous les budgets</option>
                {budgetOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <button className="btn navy full" onClick={() => setFiltersOpen(false)}>
              Afficher les résultats
            </button>
          </aside>
          <div>
            <div className="sort-row">
              <span>
                {filtered.length} bien{filtered.length > 1 ? "s" : ""}
              </span>
              <select aria-label="Trier les résultats" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
                <option value="recent">Plus récents</option>
                <option value="price-asc">Prix croissant · par devise</option>
                <option value="price-desc">Prix décroissant · par devise</option>
              </select>
            </div>
            {loading ? (
              <PublishedContentEmpty title="Chargement des annonces…" description="" />
            ) : loadError && properties.length === 0 ? (
              <PublishedContentEmpty
                title="Le catalogue est en cours de configuration"
                description="Les annonces apparaîtront ici dès que la connexion sera disponible."
              />
            ) : filtered.length ? (
              <>
                <div className="property-grid two">
                  {visibleProperties.map((item) => (
                    <PropertyCard key={item.id} item={item} onSelect={onSelectProperty} />
                  ))}
                </div>
                <nav className="pagination" aria-label="Pagination">
                  <button
                    aria-label="Page précédente"
                    disabled={pageNumber === 1}
                    onClick={() => setPageNumber((value) => Math.max(1, value - 1))}
                  >
                    ←
                  </button>
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => (
                    <button
                      className={pageNumber === number ? "active" : ""}
                      onClick={() => setPageNumber(number)}
                      key={number}
                    >
                      {number}
                    </button>
                  ))}
                  <button
                    aria-label="Page suivante"
                    disabled={pageNumber === totalPages}
                    onClick={() => setPageNumber((value) => Math.min(totalPages, value + 1))}
                  >
                    →
                  </button>
                </nav>
              </>
            ) : properties.length === 0 ? (
              <PublishedContentEmpty
                title="Aucun bien publié pour le moment"
                description="Les annonces apparaîtront ici après leur ajout et leur publication depuis l’espace d’administration."
              />
            ) : (
              <EmptyState
                reset={() => {
                  setKind("Tous");
                  setQuery("");
                  setCity("");
                  setBudget("");
                  setBedrooms("");
                  setLandArea("");
                  setSortOrder("recent");
                }}
              />
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function EmptyState({ reset }: { reset: () => void }) {
  return (
    <div className="empty-state">
      <span>
        <Icon name="search" size={28} />
      </span>
      <h3>Aucun bien ne correspond</h3>
      <p>Essayez d'élargir vos critères pour découvrir d'autres opportunités.</p>
      <button className="btn navy" onClick={reset}>
        Réinitialiser les filtres
      </button>
    </div>
  );
}

function PageHero({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <section className="page-hero">
      <div className="container">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
    </section>
  );
}

function PlansPage({ go, plans, onSelectPlan }: { go: (p: Page) => void; plans: ArchitecturalPlan[]; onSelectPlan: (plan: ArchitecturalPlan) => void }) {
  const [filter, setFilter] = useState("Tous les modèles");
  const filteredPlans = plans.filter((item) => {
    if (filter === "Tous les modèles") return true;
    return item.category === filter;
  });
  return (
    <>
      <PageHero
        eyebrow="Architecture DAFS"
        title="Des plans qui donnent forme à vos idées"
        text="Explorez notre bibliothèque de modèles et demandez une étude adaptée à votre terrain."
      />
      <section className="section container">
        <div className="plan-filter">
          <div>
            {["Tous les modèles", ...Array.from(new Set(plans.map((plan) => plan.category).filter(Boolean)))].map((x) => (
              <button onClick={() => setFilter(x)} className={filter === x ? "active" : ""} key={x}>
                {x}
              </button>
            ))}
          </div>
          <span>{filteredPlans.length} modèles</span>
        </div>
        {filteredPlans.length ? (
          <div className="plan-grid">
            {filteredPlans.map((item) => (
              <PlanCard item={item} onSelect={onSelectPlan} key={item.id} />
            ))}
          </div>
        ) : (
          <PublishedContentEmpty
            title="Aucun plan publié pour le moment"
            description="Les plans architecturaux apparaîtront ici après leur ajout dans l’espace d’administration."
          />
        )}
      </section>
      <ConstructionCallout go={go} />
    </>
  );
}

function ConstructionCallout({ go }: { go: (page: Page) => void }) {
  return (
    <section className="construction-callout container">
      <div><span className="eyebrow">Construction · galerie chantier</span><h2>Découvrez les séquences transmises par l’équipe.</h2><p>Des images classées par étapes visibles du chantier, avec les informations à confirmer avant de les citer comme références.</p></div>
      <button className="btn navy" onClick={() => go("construction")}>Voir les photos et vidéos <Icon name="arrow" /></button>
    </section>
  );
}

function ConstructionPage({ media, managed }: { media: PublicConstructionMedia[]; managed: boolean }) {
  const groupedMedia = new Map<string, PublicConstructionMedia[]>();
  for (const asset of [...media].sort((a, b) => a.sortOrder - b.sortOrder)) {
    const title = asset.collectionTitle.trim() || "Autres travaux";
    groupedMedia.set(title, [...(groupedMedia.get(title) ?? []), asset]);
  }
  const publishedGroups: ConstructionGroup[] = Array.from(groupedMedia, ([title, items]) => {
    const photos = items.filter((item) => item.mimeType.startsWith("image/"));
    const videos = items.filter((item) => item.mimeType.startsWith("video/"));
    return {
      title,
      description: "Photos et séquences vidéo classées par l’équipe dans la bibliothèque médias.",
      cover: photos[0]?.url ?? "/construction-media/posters/structure.jpg",
      photos: photos.map((item) => ({ src: item.url, alt: item.alt || item.title })),
      videos: videos.map((item) => ({ src: item.url, title: item.title })),
    };
  });
  const groups = media.length ? publishedGroups : managed ? [] : constructionGroups;
  return (
    <>
      <PageHero eyebrow="Construction · galerie" title="Des étapes de chantier en images" text="Les photos et vidéos reçues sont regroupées selon les travaux visibles : fondations, armatures et interventions sur site." />
      <section className="section container construction-page">
        <p className="construction-attribution"><Icon name="shield" size={18} />{constructionAttributionNote}</p>
        <div className="construction-groups">
          {groups.map((group) => (
            <article className="construction-group" key={group.title}>
              <img className="construction-cover" src={group.cover} alt={group.title} loading="lazy" />
              <div className="construction-group-copy"><span className="eyebrow">{group.videos.length} séquences vidéo{group.photos.length ? ` · ${group.photos.length} photo${group.photos.length > 1 ? "s" : ""}` : ""}</span><h2>{group.title}</h2><p>{group.description}</p></div>
              {group.photos.length > 0 && <div className="construction-photos">{group.photos.map((photo) => <figure key={photo.src}><img src={photo.src} alt={photo.alt} loading="lazy" /></figure>)}</div>}
              {!!group.videos.length && <details className="construction-video-details"><summary>Parcourir les {group.videos.length} séquences vidéo</summary><div className="construction-video-grid">{group.videos.map((video) => <figure key={video.src}><ExclusiveVideo controls preload="none" playsInline poster={group.cover}><source src={video.src} type="video/mp4" />Votre navigateur ne prend pas en charge la lecture vidéo.</ExclusiveVideo><figcaption>{video.title}</figcaption></figure>)}</div></details>}
            </article>
          ))}
          {!groups.length && <PublishedContentEmpty title="Aucun média publié dans cette galerie" description="L’équipe ajoutera et publiera les photos et vidéos depuis l’espace d’administration." />}
        </div>
      </section>
    </>
  );
}

function ContactPage({ settings }: { settings: SiteSettings }) {
  const searchParams = useSearchParams();
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<TurnstileInstance | null>(null);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const submitInquiry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    setSending(true);
    setSent(false);
    setError("");
    const form = new FormData(formElement);
    if (!String(form.get("phone") ?? "").trim() && !String(form.get("email") ?? "").trim()) {
      setError("Indiquez un numéro de téléphone ou une adresse e-mail pour être recontacté.");
      setSending(false);
      return;
    }
    const inquiryTypes: Record<string, string> = {
      "Location courte durée": "reservation",
      "Location longue durée": "property",
      "Achat immobilier": "property",
      "Plan architectural": "plan",
      "Estimation de construction": "estimate",
      "Déménagement & aménagement": "general",
      "Cleaner / nettoyage": "general",
      "Autre demande": "general",
    };
    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.get("fullName"),
          phone: form.get("phone"),
          email: form.get("email"),
          inquiryType: inquiryTypes[String(form.get("subject"))] ?? "general",
          subject: form.get("subject"),
          message: form.get("message"),
          website: form.get("website"),
          turnstileToken,
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "L’envoi de la demande a échoué.");
      setSent(true);
      formElement.reset();
      setTurnstileToken("");
      turnstileRef.current?.reset();
    } catch (error) {
      setError(error instanceof Error ? error.message : "L’envoi de la demande a échoué.");
      turnstileRef.current?.reset();
      setTurnstileToken("");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <PageHero
        eyebrow="Parlons de votre projet"
        title="Contactez DAFS Sarlu"
          text="Décrivez votre besoin et l’équipe DAFS Sarlu pourra reprendre contact avec vous."
      />
      <section className="contact-page container">
        <aside className="contact-info-panel">
          <span className="eyebrow">DAFS Sarlu · Kinshasa</span>
          <h2>Parlons de votre projet.</h2>
          <p>{settings.description || "Décrivez votre besoin et l’équipe vous orientera vers le service adapté."}</p>
          <div className="contact-info-list">
            {settings.email && <a className="contact-info-item" href={`mailto:${settings.email}`}><span className="contact-info-icon"><Icon name="mail" size={19} /></span><span><small>E-mail</small><strong>{settings.email}</strong></span></a>}
            {settings.phone && hideRemovedContact(settings.phone) && <a className="contact-info-item" href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`}><span className="contact-info-icon"><Icon name="phone" size={19} /></span><span><small>Téléphone</small><strong>{settings.phone}</strong></span></a>}
            {createWhatsAppHref(settings) && <a className="contact-info-item" href={createWhatsAppHref(settings)} target="_blank" rel="noreferrer"><span className="contact-info-icon"><Icon name="whatsapp" size={19} /></span><span><small>Message direct</small><strong>Nous écrire sur WhatsApp</strong></span></a>}
          </div>
          <div className="contact-location-card">
            <span className="contact-info-icon"><Icon name="map" size={19} /></span>
            <div><small>Nous trouver</small><strong>{settings.address || "Kinshasa, République démocratique du Congo"}</strong>
              {createDirectionsHref(settings.address) ? <a href={createDirectionsHref(settings.address)} target="_blank" rel="noreferrer">Ouvrir l’itinéraire <Icon name="arrow" size={15} /></a> : <span className="contact-location-note">Adresse précise à compléter par l’entreprise pour activer l’itinéraire.</span>}
            </div>
          </div>
        </aside>
        <form
          className="contact-form"
          onSubmit={submitInquiry}
        >
          <label className="contact-honeypot" aria-hidden="true">
            Site web
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
          <div className="form-row">
            <label>
              Nom complet
              <input name="fullName" required maxLength={150} placeholder="Votre nom" />
            </label>
            <label>
              Téléphone
              <input name="phone" maxLength={30} type="tel" placeholder="Votre numéro" />
            </label>
          </div>
          <label>
            Adresse e-mail
            <input name="email" maxLength={255} type="email" placeholder="vous@exemple.com" />
          </label>
          <p className="contact-reachability">Indiquez au moins un moyen de vous joindre : téléphone ou e-mail.</p>
          <label>
            Objet de votre demande
            <select name="subject" defaultValue={searchParams.get("subject") || "Autre demande"}>
              <option>Location courte durée</option>
              <option>Location longue durée</option>
              <option>Achat immobilier</option>
              <option>Plan architectural</option>
              <option>Estimation de construction</option>
              <option>Déménagement & aménagement</option>
              <option>Cleaner / nettoyage</option>
              <option>Autre demande</option>
            </select>
          </label>
          <label>
            Votre message
            <textarea name="message" required maxLength={5000} rows={5} placeholder="Parlez-nous de votre projet…" />
          </label>
          <label className="consent">
            <input type="checkbox" required />{" "}
            <span>J'accepte que mes informations soient utilisées pour répondre à ma demande.</span>
          </label>
          {turnstileSiteKey ? (
            <Turnstile
              ref={turnstileRef}
              siteKey={turnstileSiteKey}
              onSuccess={setTurnstileToken}
              onExpire={() => setTurnstileToken("")}
              onError={() => setError("La vérification anti-robot est indisponible. Réessayez.")}
            />
          ) : process.env.NODE_ENV === "production" ? (
            <div className="auth-error" role="alert">La vérification anti-robot n’est pas configurée sur le site.</div>
          ) : null}
          <button className="btn navy" type="submit" disabled={sending || Boolean(turnstileSiteKey && !turnstileToken) || (process.env.NODE_ENV === "production" && !turnstileSiteKey)}>
            {sending ? "Envoi…" : "Envoyer la demande"} <Icon name="arrow" />
          </button>
          {error && <div className="auth-error" role="alert">{error}</div>}
          {sent && (
            <div className="success" role="status">
              <Icon name="check" /> Votre demande a bien été transmise à DAFS Sarlu.
            </div>
          )}
        </form>
      </section>
    </>
  );
}

function SystemPage({ go }: { go: (p: Page) => void }) {
  const [state, setState] = useState("404");
  const states = ["404", "500", "Chargement", "Réseau", "Indisponible"];
  return (
    <section className="system-page">
      <div className="container system-tabs">
        {states.map((item) => (
          <button
            className={state === item ? "active" : ""}
            onClick={() => setState(item)}
            key={item}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="system-state container">
        {state === "Chargement" ? (
          <div className="skeleton-state" aria-label="Chargement en cours">
            <div />
            <span />
            <span />
            <span />
            <p>Chargement des informations…</p>
          </div>
        ) : (
          <>
            <span className="system-code">
              {state === "Indisponible" ? <Icon name="calendar" size={45} /> : state}
            </span>
            <h1>
              {state === "404"
                ? "Cette page reste introuvable"
                : state === "500"
                  ? "Un problème est survenu"
                  : state === "Réseau"
                    ? "Connexion interrompue"
                    : "Aucune disponibilité"}
            </h1>
            <p>
              {state === "Réseau"
                ? "Vérifiez votre connexion puis réessayez."
                : "Nous vous invitons à revenir à l'accueil ou à explorer les autres offres."}
            </p>
            <button className="btn navy" onClick={() => go("home")}>
              Retour à l'accueil
            </button>
          </>
        )}
      </div>
    </section>
  );
}

function Cta({ go, settings }: { go: (p: Page) => void; settings: SiteSettings }) {
  return (
    <section className="cta">
      <div className="container">
        <div>
          <span className="eyebrow">Un projet en tête ?</span>
          <h2>Parlons-en, simplement.</h2>
          <p>Présentez votre besoin en immobilier, en architecture, en déménagement, en aménagement ou en nettoyage.</p>
        </div>
        <a className="btn navy" href={createWhatsAppHref(settings) || "#contact"} target={createWhatsAppHref(settings) ? "_blank" : undefined} rel={createWhatsAppHref(settings) ? "noreferrer" : undefined} onClick={!createWhatsAppHref(settings) ? (event) => { event.preventDefault(); go("contact"); } : undefined}>
          <Icon name="chat" /> Nous contacter
        </a>
      </div>
    </section>
  );
}

function Footer({ go, settings }: { go: (p: Page) => void; settings: SiteSettings }) {
  return (
    <footer>
      <div className="container footer-grid">
        <div>
          <Logo light onClick={() => go("home")} />
          <p>DAFS Sarlu présente des offres immobilières, des aperçus de plans architecturaux et des services de déménagement, d’aménagement et de nettoyage à Kinshasa.</p>
        </div>
        <div>
          <h4>Explorer</h4>
          <button onClick={() => go("rentals")}>Locations</button>
          <button onClick={() => go("sales")}>Biens à vendre</button>
          <button onClick={() => go("plans")}>Plans architecturaux</button>
          <button onClick={() => go("estimate")}>Estimation</button>
        </div>
        <div>
          <h4>DAFS Sarlu</h4>
          <button onClick={() => go("about")}>À propos</button>
          <button onClick={() => go("contact")}>Contact</button>
          <button onClick={() => go("faq")}>FAQ</button>
          <button onClick={() => go("legal")}>Mentions légales</button>
        </div>
        <div>
          <h4>Nous contacter</h4>
          {settings.email && <a href={`mailto:${settings.email}`}>{settings.email}</a>}
          {settings.phone && hideRemovedContact(settings.phone) && <a href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`}>{settings.phone}</a>}
          {createWhatsAppHref(settings) && <a href={createWhatsAppHref(settings)} target="_blank" rel="noreferrer">Nous écrire sur WhatsApp</a>}
          {settings.address && <p>{settings.address}</p>}
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© DAFS Sarlu. Tous droits réservés.</span>
        <span>{settings.legal_name || settings.company_name}</span>
      </div>
    </footer>
  );
}

export default function App({
  initialProperties,
  initialPlans,
  initialSettings,
  initialServices = [],
  initialDataError = false,
  initialConstructionMedia = [],
  initialPlansManaged = false,
  initialConstructionManaged = false,
}: {
  initialProperties: PropertyListing[];
  initialPlans: ArchitecturalPlan[];
  initialSettings: SiteSettings;
  initialServices?: PublicService[];
  initialDataError?: boolean;
  initialConstructionMedia?: PublicConstructionMedia[];
  initialPlansManaged?: boolean;
  initialConstructionManaged?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [themeReady, setThemeReady] = useState(false);
  const [page, setPage] = useState<Page>(() => pageFromPath(pathname));
  const [properties, setProperties] = useState<PropertyListing[]>(initialProperties);
  const [plans, setPlans] = useState<ArchitecturalPlan[]>(initialPlans);
  const [constructionMedia, setConstructionMedia] = useState<PublicConstructionMedia[]>(initialConstructionMedia);
  const [services, setServices] = useState<PublicService[]>(initialServices);
  const [propertiesLoading, setPropertiesLoading] = useState(false);
  const [propertiesLoadError, setPropertiesLoadError] = useState(initialDataError);

  useEffect(() => {
    try {
      const savedTheme = window.localStorage.getItem("dafs-color-theme");
      if (savedTheme === "dark" || savedTheme === "light") setTheme(savedTheme);
    } catch {
      // Use the light theme when browser storage is unavailable.
    }
    setThemeReady(true);
  }, []);

  useEffect(() => {
    if (!themeReady) return;
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#0B1320" : "#0D3D73");
    try {
      window.localStorage.setItem("dafs-color-theme", theme);
    } catch {
      // The theme remains available for the current session if storage is disabled.
    }
  }, [theme, themeReady]);

  useEffect(() => {
    let active = true;
    const loadPublishedProperties = async () => {
      const client = supabase;
      if (!client) {
        if (active) {
          setPropertiesLoading(false);
          setPropertiesLoadError(true);
        }
        return;
      }

      const { data, error } = await client
        .from("properties")
        .select(
          "id, reference, title, description, short_description, address, operation_type, city, municipality, neighborhood, land_area_m2, living_area_m2, bedrooms, bathrooms, price_amount, currency, pricing_period, is_negotiable, property_images(storage_path, alt_text, caption, is_primary, sort_order), property_categories(name)",
        )
        .eq("publication_status", "published")
        .is("archived_at", null)
        .order("published_at", { ascending: false });

      if (!active) return;
      if (error) {
        setPropertiesLoadError(true);
        setPropertiesLoading(false);
        return;
      }

      const listings = (data ?? []).map((row) => {
        const gallery = [...(row.property_images ?? [])].sort(
          (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
        );
        const images = gallery.map((image) => ({
          src: image.storage_path.startsWith("local:")
            ? image.storage_path.slice("local:".length)
            : client.storage.from("property-images").getPublicUrl(image.storage_path).data.publicUrl,
          alt: image.alt_text ?? row.title,
          caption: image.caption ?? "",
          mimeType: image.storage_path.toLowerCase().endsWith(".mp4") ? "video/mp4" : "image/jpeg",
        }));
        const image = images[0]?.src ?? "";
        const operation =
          row.operation_type === "short_rental"
            ? "Courte durée"
            : row.operation_type === "long_rental"
              ? "Longue durée"
              : "Vente";
        const categoryRelation = row.property_categories as
          | { name?: string }
          | { name?: string }[]
          | null;
        const category = Array.isArray(categoryRelation)
          ? categoryRelation[0]?.name
          : categoryRelation?.name;
        const type = [category, operation].filter(Boolean).join(" · ");
        const areas = [row.living_area_m2 && `${row.living_area_m2} m²`, row.land_area_m2 && `Terrain ${row.land_area_m2} m²`].filter(Boolean);
        const rooms = [row.bedrooms && `${row.bedrooms} chambres`, row.bathrooms && `${row.bathrooms} salles d’eau`].filter(Boolean);
        const meta = [...areas, ...rooms].join(" · ") || "Détails disponibles sur demande";
        const location = [row.city, row.municipality, row.neighborhood].filter(Boolean).join(", ");
        const amount = row.price_amount && row.currency
          ? new Intl.NumberFormat("fr-FR", { style: "currency", currency: row.currency }).format(row.price_amount)
          : "Prix sur demande";
        const period = row.pricing_period === "night" ? " / nuit" : row.pricing_period === "month" ? " / mois" : "";
        return {
          id: row.id,
          reference: row.reference,
          name: row.title,
          city: location,
          type,
          meta,
        price: `${amount}${period}${row.is_negotiable ? " · à discuter" : ""}`,
          priceAmount: row.price_amount,
        isNegotiable: row.is_negotiable,
          currency: row.currency,
          pricingPeriod: row.pricing_period,
          image,
          description: row.description || row.short_description || "",
          bedrooms: row.bedrooms,
          bathrooms: row.bathrooms,
          livingArea: row.living_area_m2,
          landArea: row.land_area_m2,
          address: row.address ?? "",
          images,
        };
      });
      setProperties(listings);
      setPropertiesLoading(false);
    };

    window.addEventListener("focus", loadPublishedProperties);
    return () => {
      active = false;
      window.removeEventListener("focus", loadPublishedProperties);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadPublishedServices = async () => {
      const client = supabase;
      if (!client) return;
      const [serviceResult, mediaResult] = await Promise.all([
        client.from("service_pages").select("id, slug, title, eyebrow, summary, body, features").eq("publication_status", "published").order("sort_order").order("title"),
        client.from("media_assets").select("id, service_id, title, description, alt_text, mime_type, storage_path, category, collection_title, sort_order").eq("is_published", true).order("sort_order").order("created_at"),
      ]);
      if (!active || serviceResult.error || mediaResult.error) return;
      const publicMediaUrl = (path: string) => path.startsWith("local:")
        ? path.slice("local:".length)
        : client.storage.from("site-media").getPublicUrl(path).data.publicUrl;
      setConstructionMedia((mediaResult.data ?? []).filter((asset) => asset.category === "construction").map((asset) => ({
        id: asset.id,
        title: asset.title,
        description: asset.description ?? "",
        alt: asset.alt_text ?? "",
        mimeType: asset.mime_type,
        url: publicMediaUrl(asset.storage_path),
        collectionTitle: asset.collection_title ?? "",
        sortOrder: asset.sort_order ?? 0,
      })));
      if (!serviceResult.data?.length) return;
      const mediaByService = new Map<string, ServiceMedia[]>();
      for (const asset of mediaResult.data ?? []) {
        if (!asset.service_id) continue;
        const list = mediaByService.get(asset.service_id) ?? [];
        list.push({
          id: asset.id,
          title: asset.title,
          description: asset.description ?? "",
          alt: asset.alt_text ?? "",
          mimeType: asset.mime_type,
          url: publicMediaUrl(asset.storage_path),
        });
        mediaByService.set(asset.service_id, list);
      }
      setServices(serviceResult.data.map((service) => {
        const starter = starterPublicServices.find((item) => item.slug === service.slug);
        const publishedMedia = mediaByService.get(service.id) ?? [];
        return ({
        id: service.id,
        slug: service.slug,
        title: service.title,
        eyebrow: service.eyebrow ?? "",
        summary: service.summary ?? "",
        body: service.body?.trim() || starter?.body || "",
        features: Array.isArray(service.features) && service.features.length
          ? service.features.filter((item): item is string => typeof item === "string")
          : starter?.features ?? [],
        media: publishedMedia.length ? publishedMedia : starter?.media ?? [],
      });
      }));
    };
    void loadPublishedServices();
    window.addEventListener("focus", loadPublishedServices);
    return () => { active = false; window.removeEventListener("focus", loadPublishedServices); };
  }, []);

  useEffect(() => {
    let active = true;
    const loadPublishedPlans = async () => {
      const client = supabase;
      if (!client) return;
      const { data, error } = await client
        .from("architectural_plans")
        .select("id, reference, title, description, category, built_area_m2, bedrooms, floors, preview_storage_path, architectural_plan_media(storage_path, sort_order)")
        .eq("publication_status", "published")
        .is("archived_at", null)
        .order("published_at", { ascending: false });
      if (!active || error) return;
      const publicPlanUrl = (path: string) => path.startsWith("local:")
        ? path.slice("local:".length)
        : client.storage.from("architectural-previews").getPublicUrl(path).data.publicUrl;
      const publishedPlans = (data ?? []).map((row) => ({
        id: row.id,
        reference: row.reference,
        name: row.title,
        description: row.description ?? "",
        category: row.category ?? "",
        meta: [
          row.built_area_m2 && `${row.built_area_m2} m²`,
          row.bedrooms && `${row.bedrooms} chambres`,
          row.floors && (row.floors === 1 ? "Plain-pied" : `R+${row.floors - 1}`),
        ].filter(Boolean).join(" · "),
        image: row.preview_storage_path ? publicPlanUrl(row.preview_storage_path) : "",
        gallery: [
          ...(row.preview_storage_path ? [row.preview_storage_path] : []),
          ...[...(row.architectural_plan_media ?? [])].sort((a, b) => a.sort_order - b.sort_order).map((media) => media.storage_path),
        ].map(publicPlanUrl),
      }));
      setPlans(initialPlansManaged
        ? publishedPlans
        : [...starterPlans.filter((starter) => !publishedPlans.some((published) => published.reference === starter.reference)), ...publishedPlans]);
    };
    window.addEventListener("focus", loadPublishedPlans);
    return () => {
      active = false;
      window.removeEventListener("focus", loadPublishedPlans);
    };
  }, []);

  useEffect(() => {
    setPage(pageFromPath(pathname));
  }, [pathname]);

  const go = (next: Page) => {
    if (next !== page) router.push(pagePaths[next]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const selectProperty = (property: PropertyListing) => {
    router.push(`${pagePaths[propertyTarget(property.type)]}?id=${encodeURIComponent(property.id)}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const selectPlan = (plan: ArchitecturalPlan) => {
    router.push(`${pagePaths["plan-detail"]}?id=${encodeURIComponent(plan.id)}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const selectService = (service: PublicService) => {
    router.push(`/services/${encodeURIComponent(service.slug)}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const quickSearch = (type: string, city: string, budget: string) => {
    if (type === "moving" || type === "cleaner") {
      const targetService = services.find((service) =>
        type === "cleaner"
          ? service.slug.toLowerCase().includes("clean") || service.slug.toLowerCase().includes("nettoyage")
          : service.slug.toLowerCase().includes("demenagement") || service.slug.toLowerCase().includes("amenagement"),
      );
      if (targetService) selectService(targetService);
      else go("services");
      return;
    }

    const targetPage: Page = type === "plans" ? "plans" : type === "houses" || type === "parcels" ? "sales" : "rentals";
    const params = new URLSearchParams();
    if (targetPage !== "plans") {
      if (city) params.set("city", city);
      if (budget) params.set("budget", budget);
      const kind = type === "short-rental" ? "Courte" : type === "long-rental" ? "Longue" : type === "houses" ? "Maison" : type === "parcels" ? "Parcelle" : "";
      if (kind) params.set("kind", kind);
    }
    const queryString = params.toString();
    router.push(`${pagePaths[targetPage]}${queryString ? `?${queryString}` : ""}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const selectedProperty = properties.find((property) => property.id === searchParams.get("id"));
  const selectedPlan = plans.find((plan) => plan.id === searchParams.get("id"));
  const selectedService = services.find((service) => service.slug === decodeURIComponent(pathname.split("/").filter(Boolean).at(-1) ?? ""));
  const content: Record<Page, React.ReactNode> = {
    home: <HomePage go={go} onSelectProperty={selectProperty} settings={initialSettings} properties={properties} plans={plans} services={services} onSelectService={selectService} onQuickSearch={quickSearch} loading={propertiesLoading} loadError={propertiesLoadError} />,
    rentals: <CataloguePage mode="rentals" go={go} onSelectProperty={selectProperty} properties={properties} loading={propertiesLoading} loadError={propertiesLoadError} />,
    sales: <CataloguePage mode="sales" go={go} onSelectProperty={selectProperty} properties={properties} loading={propertiesLoading} loadError={propertiesLoadError} />,
    plans: <PlansPage go={go} plans={plans} onSelectPlan={selectPlan} />,
    construction: <ConstructionPage media={constructionMedia} managed={initialConstructionManaged} />,
    services: <ServicesDirectory services={services} onSelect={selectService} />,
    "service-detail": selectedService ? <PublicServicePage service={selectedService} go={go} settings={initialSettings} /> : <ServicesDirectory services={services} onSelect={selectService} />,
    detail: (
      selectedProperty ? <PropertyDetailPage property={selectedProperty} go={go} settings={initialSettings} /> : <EmptyPublicPage title="Fiche logement" description="Cette fiche sera disponible après la publication d’un logement." go={go} />
    ),
    "long-detail": (
      selectedProperty ? <PropertyDetailPage property={selectedProperty} go={go} settings={initialSettings} /> : <EmptyPublicPage title="Fiche location" description="Cette fiche sera disponible après la publication d’un logement." go={go} />
    ),
    "house-detail": (
      selectedProperty ? <PropertyDetailPage property={selectedProperty} go={go} settings={initialSettings} /> : <EmptyPublicPage title="Fiche maison" description="Cette fiche sera disponible après la publication d’un bien." go={go} />
    ),
    "land-detail": (
      selectedProperty ? <PropertyDetailPage property={selectedProperty} go={go} settings={initialSettings} /> : <EmptyPublicPage title="Fiche parcelle" description="Cette fiche sera disponible après la publication d’un bien." go={go} />
    ),
    "plan-detail": (
      selectedPlan ? <PlanDetailPage plan={selectedPlan} go={go} settings={initialSettings} /> : <EmptyPublicPage title="Fiche plan architectural" description="Cette fiche sera disponible après la publication d’un plan." go={go} />
    ),
    estimate: <EstimatePage onContact={() => router.push(`${pagePaths.contact}?subject=${encodeURIComponent("Estimation de construction")}`)} />,
    "estimate-result": (
      <EmptyPublicPage title="Résultat d’estimation" description="Aucune estimation n’est disponible pour le moment." go={go} />
    ),
    about: <EditablePublicPage title={initialSettings.about_title || "À propos"} content={initialSettings.about_content} go={go} />,
    contact: <ContactPage settings={initialSettings} />,
    faq: <FAQPage content={initialSettings.faq_content} go={go} />,
    legal: <EditablePublicPage title="Informations légales" content={initialSettings.legal_content} go={go} />,
    system: <SystemPage go={go} />,
  };
  return (
    <div className="app" data-theme={theme}>
      <Header
        page={page}
        go={go}
        whatsappHref={createWhatsAppHref(initialSettings)}
        theme={theme}
        onToggleTheme={() => setTheme((current) => current === "light" ? "dark" : "light")}
      />
      {content[page]}
      <Footer go={go} settings={initialSettings} />
      {page !== "contact" && <button className="float-contact" onClick={() => go("contact")} aria-label="Contacter DAFS Sarlu"><Icon name="chat" /></button>}
    </div>
  );
}
