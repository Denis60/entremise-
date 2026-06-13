"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const ANON_CHAT_KEY = "entremise_anon_chat";

// Monté sur le dashboard (donc après inscription + onboarding) : si une
// conversation anonyme attend dans le localStorage, on la rattache au compte
// puis on bascule sur le besoin créé.
export default function AnonImport() {
  const router = useRouter();
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(ANON_CHAT_KEY);
    } catch {
      return;
    }
    if (!raw) return;

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      localStorage.removeItem(ANON_CHAT_KEY);
      return;
    }
    const messages = parsed?.messages;
    if (!Array.isArray(messages) || !messages.some((m: any) => m?.role === "user")) {
      localStorage.removeItem(ANON_CHAT_KEY);
      return;
    }

    setImporting(true);
    fetch("/api/need/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        title: parsed?.meta?.title ?? "",
        theme: parsed?.meta?.theme ?? "",
        need_summary: parsed?.meta?.need_summary ?? "",
      }),
    })
      .then(async (res) => {
        // Quoi qu'il arrive on vide le brouillon pour ne pas réimporter en boucle
        localStorage.removeItem(ANON_CHAT_KEY);
        if (res.ok) {
          const j = await res.json().catch(() => ({}));
          if (j.needId) {
            router.push(`/needs/${j.needId}`);
            return;
          }
        }
        setImporting(false);
      })
      .catch(() => {
        localStorage.removeItem(ANON_CHAT_KEY);
        setImporting(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!importing) return null;
  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      Reprise de votre conversation… vous allez être redirigé vers votre besoin.
    </div>
  );
}
