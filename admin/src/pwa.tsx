"use client";

import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isAppInstalled() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

export function PwaRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !window.isSecureContext) return;
    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
  }, []);

  return null;
}

export function InstallAppButton({ className = "" }: { className?: string }) {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isAppleMobile, setIsAppleMobile] = useState(false);

  useEffect(() => {
    setInstalled(isAppInstalled());
    setIsAppleMobile(/iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
      setShowInstructions(false);
    };
    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (installed) return null;

  const install = async () => {
    if (!promptEvent) {
      setShowInstructions(true);
      return;
    }
    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
      setPromptEvent(null);
    } catch {
      setShowInstructions(true);
    }
  };

  return (
    <>
      <button className={`install-app-button ${className}`.trim()} type="button" onClick={() => { void install(); }}>
        Installer l’admin
      </button>
      {showInstructions && (
        <div className="pwa-help-backdrop" onClick={() => setShowInstructions(false)}>
          <section className="pwa-help-dialog" role="dialog" aria-modal="true" aria-labelledby="pwa-help-title" onClick={(event) => event.stopPropagation()}>
            <button className="pwa-help-close" type="button" onClick={() => setShowInstructions(false)} aria-label="Fermer">×</button>
            <img src="/icons/icon-192.png" alt="" width="64" height="64" />
            <h2 id="pwa-help-title">Installer DAFS Admin</h2>
            <p>{isAppleMobile
              ? "Dans Safari, touchez Partager, puis « Sur l’écran d’accueil ». Activez « Ouvrir comme app » si l’option apparaît, puis touchez Ajouter."
              : "Ouvrez le menu de votre navigateur (⋮ ou …), puis choisissez « Installer l’application » ou « Ajouter à l’écran d’accueil »."}</p>
            <button className="install-app-confirm" type="button" onClick={() => setShowInstructions(false)}>Compris</button>
          </section>
        </div>
      )}
    </>
  );
}
