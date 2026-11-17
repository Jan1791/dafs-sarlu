"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { supabase } from "./lib/supabase";

type Page =
  | "home"
  | "rentals"
  | "sales"
  | "plans"
  | "detail"
  | "long-detail"
  | "house-detail"
  | "land-detail"
  | "plan-detail"
  | "estimate"
  | "estimate-result"
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
  detail: "/locations/courte-duree/fiche",
  "long-detail": "/locations/longue-duree/fiche",
  "house-detail": "/maisons-a-vendre/fiche",
  "land-detail": "/parcelles-a-vendre/fiche",
  "plan-detail": "/plans-architecturaux/fiche",
  estimate: "/estimation",
  "estimate-result": "/estimation/resultat",
  about: "/a-propos",
  contact: "/contact",
  faq: "/faq",
  legal: "/informations-legales",
  system: "/systeme",
};

function pageFromPath(pathname: string): Page {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";
  return (
    (Object.entries(pagePaths).find(([, path]) => path === normalizedPath)?.[0] as Page) ??
    "system"
  );
}

type IconName =
  | "arrow"
  | "bed"
  | "building"
  | "calendar"
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
  image: string;
  description: string;
  bedrooms: number | null;
  bathrooms: number | null;
  livingArea: number | null;
  landArea: number | null;
  address: string;
  images: { src: string; alt: string; caption: string }[];
};

function propertyTarget(type: string): Page {
  if (type.includes("Parcelle") || type.includes("Terrain")) return "land-detail";
  if (type.includes("Maison")) return "house-detail";
  if (type.includes("Longue")) return "long-detail";
  return "detail";
}

export type ArchitecturalPlan = { id: string; reference: string; name: string; meta: string; image: string; description: string; category: string };
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

const nav: { label: string; page: Page }[] = [
  { label: "Accueil", page: "home" },
  { label: "Locations", page: "rentals" },
  { label: "Acheter", page: "sales" },
  { label: "Plans", page: "plans" },
  { label: "Estimation", page: "estimate" },
  { label: "À propos", page: "about" },
];

function Logo({ light = false }: { light?: boolean }) {
  return (
    <button className="logo" aria-label="DAFS Sarlu, accueil">
      <span className={light ? "logo-mark light" : "logo-mark"}>D</span>
      <span>
        <b className={light ? "text-white" : ""}>DAFS</b>
        <small className={light ? "text-white/60" : ""}>Sarlu</small>
      </span>
    </button>
  );
}

function Header({ page, go }: { page: Page; go: (p: Page) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="container header-inner">
        <div onClick={() => go("home")}>
          <Logo />
        </div>
        <nav className="desktop-nav" aria-label="Navigation principale">
          {nav.map((item) => (
            <button
              className={page === item.page ? "active" : ""}
              onClick={() => go(item.page)}
              key={item.page}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <button className="whatsapp-header" onClick={() => go("contact")}>
          <Icon name="whatsapp" size={18} /> Nous contacter
        </button>
        <button className="mobile-menu" onClick={() => setOpen(!open)} aria-label="Ouvrir le menu">
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
          <button
            onClick={() => {
              go("contact");
              setOpen(false);
            }}
          >
            Contact
            <Icon name="chevron" />
          </button>
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
        <img src={item.image} alt="" loading="lazy" />
        <span className="plan-tag">Aperçu 3D</span>
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

function PropertyDetailPage({ property, go }: { property: PropertyListing; go: (page: Page) => void }) {
  const facts = [
    property.bedrooms !== null && property.bedrooms !== undefined ? [property.bedrooms, "Chambres"] : null,
    property.bathrooms !== null && property.bathrooms !== undefined ? [property.bathrooms, "Salles d’eau"] : null,
    property.livingArea ? [`${property.livingArea} m²`, "Surface habitable"] : null,
    property.landArea ? [`${property.landArea} m²`, "Surface du terrain"] : null,
  ].filter(Boolean) as [string | number, string][];
  return (
    <main className="property-detail container">
      <div className="detail-breadcrumb"><button onClick={() => go("home")}>Accueil</button><Icon name="chevron" size={15} /><span>{property.type}</span></div>
      <div className="detail-heading"><div><span className="eyebrow">{property.reference} · {property.type}</span><h1>{property.name}</h1><p><Icon name="map" size={16} /> {property.city || property.address || "Localisation à confirmer"}</p></div><strong>{property.price}</strong></div>
      <div className="detail-gallery">
        {property.images.length ? property.images.map((image, index) => <figure key={image.src} className={index === 0 ? "detail-gallery-main" : ""}><img src={image.src} alt={image.alt || property.name} /><figcaption>{image.caption}</figcaption></figure>) : <div className="detail-gallery-empty"><Icon name="building" size={36} /><span>Aucun visuel fourni pour ce bien</span></div>}
      </div>
      {facts.length > 0 && <div className="detail-facts">{facts.map(([value, label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div>}
      <div className="detail-content">
        <section><h2>À propos de ce bien</h2><p>{property.description || "La description détaillée de ce bien sera renseignée par DAFS Sarlu."}</p></section>
        <aside><span className="eyebrow">Vous êtes intéressé ?</span><h2>{property.price}</h2><p>Contactez l’équipe pour obtenir plus d’informations ou organiser une visite.</p><button className="btn navy" onClick={() => go("contact")}>Contacter DAFS Sarlu <Icon name="arrow" /></button></aside>
      </div>
    </main>
  );
}

function PlanDetailPage({ plan, go }: { plan: ArchitecturalPlan; go: (page: Page) => void }) {
  return (
    <main className="plan-detail container">
      <div className="detail-breadcrumb"><button onClick={() => go("plans")}>Plans architecturaux</button><Icon name="chevron" size={15} /><span>{plan.reference}</span></div>
      <div className="plan-detail-grid">
        <div className="plan-detail-preview">{plan.image ? <img src={plan.image} alt={plan.name} /> : <div className="detail-gallery-empty"><Icon name="layers" size={36} /><span>Aucun aperçu fourni pour ce plan</span></div>}</div>
        <section><span className="eyebrow">{plan.id} · {plan.category || "Plan architectural"}</span><h1>{plan.name}</h1><p className="plan-detail-meta">{plan.meta || "Caractéristiques à renseigner"}</p><p>{plan.description || "Contactez DAFS Sarlu pour obtenir des informations sur ce modèle."}</p><button className="btn navy" onClick={() => go("contact")}>Demander le plan complet <Icon name="arrow" /></button><small>Les fichiers originaux ne sont pas accessibles publiquement.</small></section>
      </div>
    </main>
  );
}

function HomePage({
  go,
  onSelectProperty,
  settings,
  properties,
  plans,
  loading,
  loadError,
}: {
  go: (p: Page) => void;
  onSelectProperty: (property: PropertyListing) => void;
  settings: SiteSettings;
  properties: PropertyListing[];
  plans: ArchitecturalPlan[];
  loading: boolean;
  loadError: boolean;
}) {
  const [service, setService] = useState("Locations");
  return (
    <>
      <section className="hero">
        <div className="hero-shade" />
        <div className="container hero-content">
          <span className="hero-kicker">
            <span /> Immobilier & architecture
          </span>
          <h1>
            {settings.home_title?.split("\n")[0] || "Trouvez votre espace."}
            <br />
            <em>{settings.home_title?.split("\n").slice(1).join(" ") || "Imaginez votre avenir."}</em>
          </h1>
          <p>
            {settings.home_intro || "Une expertise unifiée pour trouver un bien, investir et donner vie à votre projet architectural."}
          </p>
          <div className="hero-actions">
            <button className="btn gold" onClick={() => go("rentals")}>
              Explorer les biens <Icon name="arrow" />
            </button>
            <button className="btn glass" onClick={() => go("plans")}>
              Découvrir nos plans
            </button>
          </div>
        </div>
      </section>
      <div className="container search-wrap">
        <form
          className="quick-search"
          onSubmit={(e) => {
            e.preventDefault();
            go(service === "Acheter" ? "sales" : "rentals");
          }}
        >
          <label>
            <span>Je recherche</span>
            <select value={service} onChange={(e) => setService(e.target.value)}>
              <option>Locations</option>
              <option>Acheter</option>
              <option>Plans architecturaux</option>
            </select>
          </label>
          <label>
            <span>Localisation</span>
            <select>
              <option>Toutes les villes</option>
            </select>
          </label>
          <label>
            <span>Budget</span>
            <select>
              <option>Budget à définir</option>
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
          title="Un projet, toutes les possibilités"
          text="De la recherche d'un logement à la conception de votre future maison, DAFS Sarlu vous accompagne à chaque étape."
        />
        <div className="category-grid">
          {[
            [
              "01",
              "Séjours",
              "Location courte durée",
              "Des espaces sélectionnés pour vos séjours.",
              "rentals" as Page,
            ],
            [
              "02",
              "S’installer",
              "Location longue durée",
              "Trouvez le logement qui correspond à votre quotidien.",
              "rentals" as Page,
            ],
            [
              "03",
              "Investir",
              "Maisons & parcelles",
              "Des opportunités immobilières documentées.",
              "sales" as Page,
            ],
            [
              "04",
              "Construire",
              "Plans architecturaux",
              "Des modèles pensés pour votre mode de vie.",
              "plans" as Page,
            ],
          ].map(([num, over, title, text, page]) => (
            <button className="category-card" key={String(num)} onClick={() => go(page as Page)}>
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
          ) : loadError ? (
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
          <div className="arch-number">
            {plans.length.toString().padStart(2, "0")}<span>modèles publiés</span>
          </div>
        </div>
        <div className="arch-copy">
          <SectionHead
            dark
            eyebrow="Bibliothèque architecturale"
            title="Dessiner aujourd'hui les espaces de demain."
            text={plans.length ? "Explorez les modèles publiés par DAFS Sarlu." : "Les plans architecturaux seront présentés ici dès leur publication."}
          />
          <button className="btn gold" onClick={() => go("plans")}>
            Explorer les modèles <Icon name="arrow" />
          </button>
        </div>
      </section>
      <section className="estimate-banner">
        <div className="container estimate-inner">
          <div>
            <span className="eyebrow">Votre projet en perspective</span>
            <h2>Obtenez une première estimation de construction.</h2>
            <p>
              Configurez votre projet en quelques étapes et obtenez un aperçu indicatif, clair et
              structuré.
            </p>
          </div>
          <button className="btn navy" onClick={() => go("estimate")}>
            Démarrer l'estimation <Icon name="arrow" />
          </button>
        </div>
      </section>
      <section className="section container">
        <SectionHead eyebrow="L'exigence DAFS" title="Une approche fondée sur la confiance" />
        <div className="values-grid">
          {[
            [
              "shield",
              "Sélection rigoureuse",
              "Des informations structurées et des références cohérentes.",
            ],
            [
              "ruler",
              "Expertise transversale",
              "Une lecture immobilière et architecturale de chaque projet.",
            ],
            [
              "people",
              "Accompagnement humain",
              "Un contact direct, attentif et adapté à votre besoin.",
            ],
            [
              "sparkle",
              "Expérience premium",
              "Une démarche claire, de la découverte à la prise de contact.",
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
      <Cta go={go} />
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
  return (
    <>
      <PageHero eyebrow="DAFS Sarlu" title={title} text="" />
      <section className="section container editorial-page">
        {content.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
      </section>
    </>
  );
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
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("Tous");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const filtered = useMemo(
    () =>
      properties.filter((p) => {
        const modeOk = mode === "rentals" ? p.type.includes("durée") : p.type.includes("Vente");
        const kindOk = kind === "Tous" || p.type.includes(kind);
        return (
          modeOk &&
          kindOk &&
          (p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.id.toLowerCase().includes(query.toLowerCase()))
        );
      }),
    [mode, query, kind, properties],
  );
  const pageSize = 2;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visibleProperties = filtered.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
  return (
    <>
      <PageHero
        eyebrow={mode === "rentals" ? "Habiter autrement" : "Investir avec confiance"}
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
              <label>Localisation</label>
              <select>
                <option>Toutes les villes</option>
              </select>
            </div>
            {mode === "rentals" && kind !== "Longue" && (
              <div className="filter-group">
                <label>Dates et voyageurs</label>
                <div className="price-row">
                  <input aria-label="Date d'arrivée" type="date" />
                  <input aria-label="Date de départ" type="date" />
                </div>
                <select className="filter-select">
                  <option>1 voyageur</option>
                  <option>2 voyageurs</option>
                  <option>4 voyageurs</option>
                  <option>6 voyageurs</option>
                </select>
              </div>
            )}
            <div className="filter-group">
              <label>
                {mode === "sales" && kind === "Parcelle" ? "Terrain" : "Caractéristiques"}
              </label>
              <select>
                <option>
                  {mode === "sales" && kind === "Parcelle"
                    ? "Toutes superficies"
                    : "Toutes les configurations"}
                </option>
                {!(mode === "sales" && kind === "Parcelle") && <option>2 chambres et plus</option>}
              </select>
              <button>
                <span>
                  {mode === "sales" && kind === "Parcelle"
                    ? "Informations foncières"
                    : "Climatisation"}
                </span>
                <span className="radio" />
              </button>
              <button>
                <span>{mode === "sales" ? "Stationnement" : "Cuisine équipée"}</span>
                <span className="radio" />
              </button>
            </div>
            <div className="filter-group">
              <label>Budget</label>
              <div className="price-row">
                <input placeholder="Minimum" />
                <input placeholder="Maximum" />
              </div>
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
              <select aria-label="Trier les résultats">
                <option>Trier : Pertinence</option>
                <option>Plus récent</option>
              </select>
            </div>
            {loading ? (
              <PublishedContentEmpty title="Chargement des annonces…" description="" />
            ) : loadError ? (
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
    if (filter === "Plain-pied" || filter === "R+1") return item.meta.includes(filter);
    return item.meta.includes(filter.replace(" chambres", " chambres"));
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
            {["Tous les modèles", "Plain-pied", "R+1", "3 chambres", "4 chambres"].map((x) => (
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
    </>
  );
}

function ContactPage({ settings }: { settings: SiteSettings }) {
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
    const inquiryTypes: Record<string, string> = {
      "Location courte durée": "reservation",
      "Location longue durée": "property",
      "Achat immobilier": "property",
      "Plan architectural": "plan",
      "Estimation de construction": "estimate",
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
        <aside>
          <span className="eyebrow">Coordonnées</span>
          <h2>Un échange direct et confidentiel.</h2>
          <p>{settings.description || "Décrivez votre projet à l’équipe DAFS Sarlu."}</p>
          {settings.email && <a href={`mailto:${settings.email}`}>{settings.email}</a>}
          {settings.phone && <p>{settings.phone}</p>}
          {settings.address && <p>{settings.address}</p>}
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
              <input name="phone" required maxLength={30} type="tel" placeholder="Votre numéro" />
            </label>
          </div>
          <label>
            Adresse e-mail
            <input name="email" required maxLength={255} type="email" placeholder="vous@exemple.com" />
          </label>
          <label>
            Objet de votre demande
            <select name="subject">
              <option>Location courte durée</option>
              <option>Location longue durée</option>
              <option>Achat immobilier</option>
              <option>Plan architectural</option>
              <option>Estimation de construction</option>
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
          {turnstileSiteKey && (
            <Turnstile
              ref={turnstileRef}
              siteKey={turnstileSiteKey}
              onSuccess={setTurnstileToken}
              onExpire={() => setTurnstileToken("")}
              onError={() => setError("La vérification anti-robot est indisponible. Réessayez.")}
            />
          )}
          <button className="btn navy" type="submit" disabled={sending || Boolean(turnstileSiteKey && !turnstileToken)}>
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

function Cta({ go }: { go: (p: Page) => void }) {
  return (
    <section className="cta">
      <div className="container">
        <div>
          <span className="eyebrow">Un projet en tête ?</span>
          <h2>Parlons-en, simplement.</h2>
          <p>Notre équipe vous accompagne pour trouver, choisir ou construire.</p>
        </div>
        <button className="btn whatsapp" onClick={() => go("contact")}>
          <Icon name="whatsapp" /> Nous contacter
        </button>
      </div>
    </section>
  );
}

function Footer({ go, settings }: { go: (p: Page) => void; settings: SiteSettings }) {
  return (
    <footer>
      <div className="container footer-grid">
        <div>
          <Logo light />
          <p>{settings.description || "Plateforme immobilière et architecturale conçue pour simplifier vos projets."}</p>
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
          <button onClick={() => go("system")}>États système</button>
        </div>
        <div>
          <h4>Nous contacter</h4>
          {settings.email && <a href={`mailto:${settings.email}`}>{settings.email}</a>}
          {settings.phone && <p>{settings.phone}</p>}
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
  initialDataError = false,
}: {
  initialProperties: PropertyListing[];
  initialPlans: ArchitecturalPlan[];
  initialSettings: SiteSettings;
  initialDataError?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [page, setPage] = useState<Page>(() => pageFromPath(pathname));
  const [properties, setProperties] = useState<PropertyListing[]>(initialProperties);
  const [plans, setPlans] = useState<ArchitecturalPlan[]>(initialPlans);
  const [propertiesLoading, setPropertiesLoading] = useState(false);
  const [propertiesLoadError, setPropertiesLoadError] = useState(initialDataError);

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
          "id, reference, title, description, short_description, address, operation_type, city, municipality, land_area_m2, living_area_m2, bedrooms, bathrooms, price_amount, currency, pricing_period, property_images(storage_path, alt_text, caption, is_primary, sort_order), property_categories(name)",
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
          src: client.storage.from("property-images").getPublicUrl(image.storage_path).data.publicUrl,
          alt: image.alt_text ?? row.title,
          caption: image.caption ?? "",
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
        const location = [row.city, row.municipality].filter(Boolean).join(", ");
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
          price: `${amount}${period}`,
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
    const loadPublishedPlans = async () => {
      const client = supabase;
      if (!client) return;
      const { data, error } = await client
        .from("architectural_plans")
        .select("id, reference, title, description, category, built_area_m2, bedrooms, floors, preview_storage_path")
        .eq("publication_status", "published")
        .is("archived_at", null)
        .order("published_at", { ascending: false });
      if (!active || error) return;
      setPlans((data ?? []).map((row) => ({
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
        image: row.preview_storage_path
          ? client.storage.from("architectural-previews").getPublicUrl(row.preview_storage_path).data.publicUrl
          : "",
      })));
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
  const selectedProperty = properties.find((property) => property.id === searchParams.get("id"));
  const selectedPlan = plans.find((plan) => plan.id === searchParams.get("id"));
  const content: Record<Page, React.ReactNode> = {
    home: <HomePage go={go} onSelectProperty={selectProperty} settings={initialSettings} properties={properties} plans={plans} loading={propertiesLoading} loadError={propertiesLoadError} />,
    rentals: <CataloguePage mode="rentals" go={go} onSelectProperty={selectProperty} properties={properties} loading={propertiesLoading} loadError={propertiesLoadError} />,
    sales: <CataloguePage mode="sales" go={go} onSelectProperty={selectProperty} properties={properties} loading={propertiesLoading} loadError={propertiesLoadError} />,
    plans: <PlansPage go={go} plans={plans} onSelectPlan={selectPlan} />,
    detail: (
      selectedProperty ? <PropertyDetailPage property={selectedProperty} go={go} /> : <EmptyPublicPage title="Fiche logement" description="Cette fiche sera disponible après la publication d’un logement." go={go} />
    ),
    "long-detail": (
      selectedProperty ? <PropertyDetailPage property={selectedProperty} go={go} /> : <EmptyPublicPage title="Fiche location" description="Cette fiche sera disponible après la publication d’un logement." go={go} />
    ),
    "house-detail": (
      selectedProperty ? <PropertyDetailPage property={selectedProperty} go={go} /> : <EmptyPublicPage title="Fiche maison" description="Cette fiche sera disponible après la publication d’un bien." go={go} />
    ),
    "land-detail": (
      selectedProperty ? <PropertyDetailPage property={selectedProperty} go={go} /> : <EmptyPublicPage title="Fiche parcelle" description="Cette fiche sera disponible après la publication d’un bien." go={go} />
    ),
    "plan-detail": (
      selectedPlan ? <PlanDetailPage plan={selectedPlan} go={go} /> : <EmptyPublicPage title="Fiche plan architectural" description="Cette fiche sera disponible après la publication d’un plan." go={go} />
    ),
    estimate: (
      <EmptyPublicPage title="Estimation de construction" description="Le simulateur sera disponible après la configuration des modèles et barèmes dans l’administration." go={go} />
    ),
    "estimate-result": (
      <EmptyPublicPage title="Résultat d’estimation" description="Aucune estimation n’est disponible pour le moment." go={go} />
    ),
    about: <EditablePublicPage title={initialSettings.about_title || "À propos"} content={initialSettings.about_content} go={go} />,
    contact: <ContactPage settings={initialSettings} />,
    faq: <EditablePublicPage title="Questions fréquentes" content={initialSettings.faq_content} go={go} />,
    legal: <EditablePublicPage title="Informations légales" content={initialSettings.legal_content} go={go} />,
    system: <SystemPage go={go} />,
  };
  return (
    <div className="app">
      <Header page={page} go={go} />
      {content[page]}
      <Footer go={go} settings={initialSettings} />
      {page !== "contact" && (
        <button
          className="float-wa"
          onClick={() => go("contact")}
          aria-label="Contacter DAFS Sarlu"
        >
          <Icon name="whatsapp" />
        </button>
      )}
    </div>
  );
}
