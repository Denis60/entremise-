"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import Markdown from "@/components/Markdown";
import { createClient } from "@/lib/supabase/client";
import { Message, SOL_STATUS_LABELS } from "@/lib/types";

type Brief = {
  disclosed_version: string;
  theme: string | null;
  need_status: string;
  anon_label: string;
  sol_status: string;
  relevance_reason: string | null;
  demander_headcount: string | null;
  demander_revenue: string | null;
};

export default function SolicitationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [brief, setBrief] = useState<Brief | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [credits, setCredits] = useState(0);
  const [identity, setIdentity] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const [{ data: b }, { data: msgs }, { data: creds }] = await Promise.all([
      supabase.rpc("get_solicitation_brief", { p_solicitation_id: id }),
      supabase
        .from("messages")
        .select("*")
        .eq("solicitation_id", id)
        .eq("scope", "solicitation")
        .order("created_at"),
      supabase.from("credits").select("id").is("used_at", null),
    ]);
    const row = (b as Brief[] | null)?.[0];
    if (!row) return router.push("/dashboard");
    supabase
      .from("solicitations")
      .update({ provider_seen_at: new Date().toISOString() })
      .eq("id", id)
      .then();
    setBrief(row);
    setMessages((msgs as Message[]) ?? []);
    setCredits((creds ?? []).length);
    if (row.sol_status === "contact_paid") {
      const { data } = await supabase.rpc("get_revealed_identity", {
        p_solicitation_id: id,
      });
      setIdentity(data?.[0] ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);
    setError(null);
    setMessages((m) => [
      ...m,
      {
        id: "tmp",
        scope: "solicitation",
        role: "user",
        content: text,
        meta: {},
        created_at: new Date().toISOString(),
      },
    ]);
    const res = await fetch("/api/chat/solicitation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ solicitationId: id, message: text }),
    });
    setSending(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Erreur lors de l'appel à l'IA.");
      return;
    }
    await load();
  }

  async function accept(useCredit: boolean) {
    setBusy(true);
    setError(null);
    const { data, error } = await supabase.rpc("pay_contact", {
      p_solicitation_id: id,
      p_use_credit: useCredit,
    });
    setBusy(false);
    if (error) {
      setError(
        error.message.includes("no_credit")
          ? "Aucun crédit disponible."
          : error.message
      );
      return;
    }
    setIdentity(data?.[0] ?? null);
    await load();
  }

  if (!brief)
    return (
      <>
        <Nav />
        <p className="p-10 text-stone-500">Chargement…</p>
      </>
    );

  const active = ["pending", "engaged"].includes(brief.sol_status);

  return (
    <>
      <Nav />
      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[1fr_360px]">
        <section className="flex h-[calc(100vh-160px)] flex-col rounded-2xl border border-stone-200 bg-white">
          <div className="border-b border-stone-100 px-5 py-3">
            <h1 className="font-semibold">
              Sollicitation — {brief.theme ?? "besoin anonymisé"}
            </h1>
            <p className="text-xs text-stone-500">
              {SOL_STATUS_LABELS[brief.sol_status]} · Vous êtes «{" "}
              {brief.anon_label} » aux yeux du demandeur. Pas d&apos;offre à
              rédiger : vos questions et suggestions font la différence.
              Quittez quand vous voulez : vous serez alerté par e-mail et
              reprendrez où vous en étiez.
            </p>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm">
              <p className="text-xs font-semibold uppercase text-stone-400">
                Besoin anonymisé (validé par le demandeur)
              </p>
              <p className="mt-1 text-xs font-medium text-stone-600">
                Entreprise demandeuse :{" "}
                {brief.demander_headcount
                  ? `${brief.demander_headcount} salariés`
                  : "effectif non renseigné"}
                {brief.demander_revenue && ` · CA ${brief.demander_revenue}`}
              </p>
              <p className="mt-2 whitespace-pre-wrap">
                {brief.disclosed_version}
              </p>
              {brief.relevance_reason && (
                <p className="mt-2 text-xs text-amber-700">
                  Pourquoi vous : {brief.relevance_reason}
                </p>
              )}
            </div>
            {messages
              .filter((m) => m.role !== "system")
              .map((m) => (
                <div key={m.id + m.created_at}>
                  {m.role === "user" ? (
                    <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-stone-900 px-4 py-2.5 text-sm text-white">
                      {m.content}
                    </div>
                  ) : m.role === "market" ? (
                    <div className="max-w-[85%] rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm">
                      <p className="text-xs font-semibold text-amber-700">
                        Le demandeur a apporté des précisions
                      </p>
                      <Markdown text={m.content} className="mt-1" />
                    </div>
                  ) : (
                    <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-stone-100 px-4 py-2.5 text-sm">
                      <Markdown text={m.content} />
                    </div>
                  )}
                </div>
              ))}
            {sending && (
              <div className="max-w-[85%] rounded-2xl bg-stone-100 px-4 py-2.5 text-sm text-stone-400">
                L&apos;IA réfléchit…
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          {error && (
            <p className="border-t border-red-100 bg-red-50 px-5 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          {active && (
            <div className="flex items-end gap-2 border-t border-stone-100 p-4">
              <textarea
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  // Mobile (écran tactile) : Entrée = nouvelle ligne, envoi par le bouton.
                  // Desktop : Entrée envoie, Maj+Entrée = nouvelle ligne.
                  if (
                    e.key === "Enter" &&
                    !e.shiftKey &&
                    !window.matchMedia("(pointer: coarse)").matches
                  ) {
                    e.preventDefault();
                    send();
                  }
                }}
                onInput={(e) => {
                  const t = e.currentTarget;
                  t.style.height = "auto";
                  t.style.height = Math.min(t.scrollHeight, 160) + "px";
                }}
                placeholder="Vos questions au demandeur, vos suggestions, votre intérêt…"
                className="max-h-[160px] flex-1 resize-none rounded-xl border border-stone-300 px-4 py-2.5 text-sm"
              />
              <button
                onClick={send}
                disabled={sending || !input.trim()}
                aria-label="Envoyer"
                title="Envoyer"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-stone-900 text-white hover:bg-stone-700 disabled:opacity-50"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
              </button>
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 text-sm">
            <h2 className="font-semibold">Comment ça marche</h2>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-stone-600">
              <li>Le demandeur reste anonyme ; vous aussi.</li>
              <li>
                Vos questions pertinentes lui sont transmises et affinent son
                besoin.
              </li>
              <li>
                S&apos;il vous choisit, vous recevez ses coordonnées contre un
                paiement unitaire — uniquement à ce moment-là.
              </li>
              <li>
                Même non retenu : vous découvrez les besoins réels de votre
                marché, gratuitement.
              </li>
            </ul>
          </div>

          {brief.sol_status === "contact_offered" && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
              <h2 className="font-semibold">
                ★ Le demandeur souhaite vous rencontrer
              </h2>
              <p className="mt-1 text-sm text-stone-600">
                Acceptez la mise en relation pour révéler les identités
                (paiement simulé : 150 €).
              </p>
              <button
                onClick={() => accept(false)}
                disabled={busy}
                className="mt-3 w-full rounded-lg bg-amber-600 py-2 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-50"
              >
                Accepter — 150 € (simulé)
              </button>
              {credits > 0 && (
                <button
                  onClick={() => accept(true)}
                  disabled={busy}
                  className="mt-2 w-full rounded-lg border border-amber-400 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                >
                  Utiliser mon crédit gratuit ({credits})
                </button>
              )}
            </div>
          )}

          {identity && (
            <div className="rounded-2xl border border-green-300 bg-green-50 p-5">
              <h2 className="font-semibold text-green-800">
                Identités révélées
              </h2>
              <p className="mt-2 text-sm">
                <strong>{identity.company_name}</strong>
                <br />
                SIRET : {identity.siret}
                <br />
                {identity.city ?? ""}
              </p>
              <p className="mt-2 text-xs text-stone-600">
                {identity.activity_description}
              </p>
              <p className="mt-3 text-xs text-green-700">
                Vous pouvez désormais vous contacter directement. Aucune
                commission sur la prestation.
              </p>
            </div>
          )}
        </aside>
      </main>
    </>
  );
}
