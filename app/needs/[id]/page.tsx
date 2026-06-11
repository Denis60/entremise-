"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import { createClient } from "@/lib/supabase/client";
import {
  Need,
  Message,
  Solicitation,
  NEED_STATUS_LABELS,
  REVENUE_BANDS,
} from "@/lib/types";

export default function NeedPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [need, setNeed] = useState<Need | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sols, setSols] = useState<Solicitation[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [vivier, setVivier] = useState<{ with_filters: number; without_revenue_filter: number } | null>(null);
  const [disclosedDraft, setDisclosedDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const [{ data: n }, { data: msgs }, { data: s }] = await Promise.all([
      supabase.from("needs").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("messages")
        .select("*")
        .eq("need_id", id)
        .eq("scope", "need")
        .order("created_at"),
      supabase.from("solicitations").select("*").eq("need_id", id),
    ]);
    if (!n) return router.push("/dashboard");
    setNeed(n as Need);
    setDisclosedDraft((n as Need).disclosed_version ?? "");
    setMessages((msgs as Message[]) ?? []);
    setSols((s as Solicitation[]) ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000); // contributions du marché en quasi-direct
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (!need) return;
    supabase
      .rpc("count_candidates", { p_filters: need.filters ?? {} })
      .single()
      .then(({ data }) => setVivier(data as any));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [need?.filters]);

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
        scope: "need",
        role: "user",
        content: text,
        meta: {},
        created_at: new Date().toISOString(),
      },
    ]);
    const res = await fetch("/api/chat/need", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ needId: id, message: text }),
    });
    setSending(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Erreur lors de l'appel à l'IA.");
      return;
    }
    await load();
  }

  async function generateDisclosure() {
    setBusy("disclose");
    setError(null);
    const res = await fetch("/api/need/disclose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ needId: id }),
    });
    setBusy(null);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Erreur de génération.");
      return;
    }
    await load();
  }

  async function approveDisclosure() {
    setBusy("approve");
    await supabase
      .from("needs")
      .update({
        disclosed_version: disclosedDraft,
        disclosure_approved_at: new Date().toISOString(),
        status: "disclosure_pending",
      })
      .eq("id", id);
    await supabase.from("consents").insert({
      profile_id: need!.owner_id,
      need_id: id,
      kind: "disclosure",
      payload: { disclosed_version: disclosedDraft },
    });
    // Besoin qui évolue pendant une sollicitation active : le marché est automatiquement re-testé
    if (need!.status === "soliciting") {
      fetch("/api/need/solicit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ needId: id }),
      }).then(() => load());
    }
    setBusy(null);
    await load();
  }

  async function deactivateSolicitation() {
    setBusy("solicit");
    await supabase.from("needs").update({ status: "maturing" }).eq("id", id);
    setBusy(null);
    await load();
  }

  async function updateFilters(f: Need["filters"]) {
    await supabase.from("needs").update({ filters: f }).eq("id", id);
    await load();
  }

  async function solicit() {
    setBusy("solicit");
    setError(null);
    const res = await fetch("/api/need/solicit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ needId: id }),
    });
    setBusy(null);
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(j.error ?? "Erreur de sollicitation.");
      return;
    }
    await load();
  }

  async function rate(contributionId: string, rating: number) {
    await supabase
      .from("contributions")
      .update({ rating })
      .eq("id", contributionId);
  }

  async function requestContact(solicitationId: string) {
    setBusy(solicitationId);
    await supabase.rpc("request_contact", {
      p_solicitation_id: solicitationId,
    });
    setBusy(null);
    await load();
  }

  async function closeNeed(outcome: string) {
    const msg =
      outcome === "open_consultation"
        ? "Lancer une consultation ouverte ? Votre anonymat sera levé et le besoin publié."
        : "Clore ce besoin ? Les prestataires sollicités seront prévenus et le meilleur contributeur recevra un crédit de mise en relation gratuit.";
    if (!confirm(msg)) return;
    setBusy("close");
    await supabase.rpc("close_need", { p_need_id: id, p_outcome: outcome });
    setBusy(null);
    await load();
  }

  async function deleteNeed() {
    if (
      !confirm(
        "Supprimer définitivement ce besoin ?\nToute la conversation, les sollicitations et les contributions seront effacées. Cette action est irréversible."
      )
    )
      return;
    setBusy("delete");
    const { error } = await supabase.rpc("delete_need", { p_need_id: id });
    setBusy(null);
    if (!error) router.push("/dashboard");
  }

  if (!need)
    return (
      <>
        <Nav />
        <p className="p-10 text-stone-500">Chargement…</p>
      </>
    );

  const closed = ["resolved", "closed", "abandoned"].includes(need.status);
  const canSolicit =
    !!need.disclosure_approved_at &&
    !closed &&
    need.status !== "open_consultation";

  return (
    <>
      <Nav />
      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[1fr_360px]">
        {/* ===== Conversation ===== */}
        <section className="flex h-[calc(100vh-160px)] flex-col rounded-2xl border border-stone-200 bg-white">
          <div className="border-b border-stone-100 px-5 py-3">
            <h1 className="font-semibold">{need.title}</h1>
            <p className="text-xs text-stone-500">
              {NEED_STATUS_LABELS[need.status]} · Cette conversation est
              confidentielle : rien n&apos;en sort sans votre validation.
            </p>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {messages.length === 0 && (
              <div className="rounded-xl bg-stone-50 p-4 text-sm text-stone-600">
                Décrivez votre besoin, même flou. Exemple : «&nbsp;Je cherche à
                automatiser une partie de mon suivi client, mais je ne sais pas
                si j&apos;ai besoin d&apos;un CRM, d&apos;un outil IA ou
                d&apos;un consultant.&nbsp;»
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id + m.created_at}>
                {m.role === "user" && (
                  <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-stone-900 px-4 py-2.5 text-sm text-white">
                    {m.content}
                  </div>
                )}
                {m.role === "assistant" && (
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-stone-100 px-4 py-2.5 text-sm">
                    {m.content}
                  </div>
                )}
                {m.role === "market" && (
                  <div className="max-w-[85%] rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm">
                    <p className="text-xs font-semibold text-amber-700">
                      {m.meta.anon_label}{" "}
                      {m.meta.kind === "question"
                        ? "vous pose une question"
                        : "suggère"}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap">{m.content}</p>
                    {m.meta.contribution_id && (
                      <div className="mt-2 flex gap-1">
                        {[1, 2, 3, 4, 5].map((r) => (
                          <button
                            key={r}
                            title={`Noter ${r}/5`}
                            onClick={() => rate(m.meta.contribution_id!, r)}
                            className="text-stone-300 hover:text-amber-500"
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    )}
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
          {!closed && (
            <div className="flex gap-2 border-t border-stone-100 p-4">
              <textarea
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Votre message…"
                className="flex-1 resize-none rounded-xl border border-stone-300 px-4 py-2.5 text-sm"
              />
              <button
                onClick={send}
                disabled={sending}
                className="rounded-xl bg-stone-900 px-5 font-medium text-white hover:bg-stone-700 disabled:opacity-50"
              >
                Envoyer
              </button>
            </div>
          )}
        </section>

        {/* ===== Panneau de contrôle ===== */}
        <aside className="space-y-4">
          {/* Divulgation */}
          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <h2 className="text-sm font-semibold">
              1. Version divulgable au marché
            </h2>
            <p className="mt-1 text-xs text-stone-500">
              Anonymisée. Rien n&apos;est diffusé sans votre validation
              explicite.
            </p>
            <button
              onClick={generateDisclosure}
              disabled={busy === "disclose" || messages.length < 2 || closed}
              className="mt-3 w-full rounded-lg border border-stone-300 py-2 text-sm font-medium hover:bg-stone-50 disabled:opacity-40"
            >
              {busy === "disclose"
                ? "Génération…"
                : need.disclosed_version
                  ? "Régénérer avec l'IA"
                  : "Générer avec l'IA"}
            </button>
            {(disclosedDraft || need.disclosed_version) && (
              <>
                <textarea
                  rows={6}
                  value={disclosedDraft}
                  onChange={(e) => setDisclosedDraft(e.target.value)}
                  disabled={closed}
                  className="mt-3 w-full rounded-lg border border-stone-300 p-3 text-xs"
                />
                <button
                  onClick={approveDisclosure}
                  disabled={busy === "approve" || !disclosedDraft || closed}
                  className="mt-2 w-full rounded-lg bg-stone-900 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-40"
                >
                  {need.disclosure_approved_at
                    ? "Revalider cette version"
                    : "Valider cette version"}
                </button>
                {need.disclosure_approved_at && (
                  <p className="mt-1 text-xs text-green-700">
                    ✓ Version validée
                  </p>
                )}
              </>
            )}
          </div>

          {/* Filtres + vivier */}
          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <h2 className="text-sm font-semibold">2. Filtres de sollicitation</h2>
            <div className="mt-3 space-y-2">
              <input
                placeholder="Département (vide = tous)"
                defaultValue={need.filters.department ?? ""}
                onBlur={(e) =>
                  updateFilters({ ...need.filters, department: e.target.value || undefined })
                }
                disabled={closed}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              />
              <select
                value={need.filters.min_revenue_band ?? ""}
                onChange={(e) =>
                  updateFilters({
                    ...need.filters,
                    min_revenue_band: e.target.value || undefined,
                  })
                }
                disabled={closed}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              >
                <option value="">CA minimum : aucun</option>
                {REVENUE_BANDS.map((b) => (
                  <option key={b} value={b}>
                    CA minimum : {b}
                  </option>
                ))}
              </select>
            </div>
            {vivier && (
              <p className="mt-3 rounded-lg bg-stone-50 p-3 text-xs text-stone-600">
                Avec ces critères : <strong>{vivier.with_filters}</strong>{" "}
                prestataire(s) sollicitable(s)
                {need.filters.min_revenue_band &&
                  ` ; sans le CA minimum : ${vivier.without_revenue_filter}`}
                .
              </p>
            )}
          </div>

          {/* Sollicitation */}
          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <h2 className="text-sm font-semibold">3. Solliciter le marché</h2>
            <p className="mt-1 text-xs text-stone-500">
              L&apos;IA sonde anonymement les prestataires pertinents. Tant
              que la sollicitation est active, tout nouveau prestataire
              pertinent (nouvelle inscription ou évolution de votre besoin)
              est automatiquement testé.
            </p>
            {need.status === "soliciting" ? (
              <button
                onClick={deactivateSolicitation}
                disabled={busy === "solicit"}
                className="mt-3 w-full rounded-lg border border-stone-300 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-50 disabled:opacity-40"
              >
                Désactiver la sollicitation
              </button>
            ) : (
              <button
                onClick={solicit}
                disabled={!canSolicit || busy === "solicit"}
                className="mt-3 w-full rounded-lg bg-amber-600 py-2 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-40"
              >
                {busy === "solicit"
                  ? "Sollicitation en cours…"
                  : "Activer la sollicitation"}
              </button>
            )}
            {!need.disclosure_approved_at && (
              <p className="mt-2 text-xs text-stone-400">
                Validez d&apos;abord la version divulgable.
              </p>
            )}
            {need.status === "soliciting" && sols.length === 0 && (
              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                <strong>Sollicitation active.</strong> Nous recherchons
                l&apos;avis de prestataires pertinents — chaque nouvelle
                entreprise inscrite est automatiquement évaluée sur votre
                besoin. Vous serez prévenu en temps réel de l&apos;avancement.
              </p>
            )}
            {sols.length > 0 && (
              <ul className="mt-3 space-y-2">
                {sols.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2 text-xs"
                  >
                    <span>
                      {s.anon_label}
                      {s.relevance_score != null && ` · ${s.relevance_score}%`}
                      {s.is_best_contributor && " ★"}
                    </span>
                    {!closed &&
                      ["engaged", "pending"].includes(s.status) && (
                        <button
                          onClick={() => requestContact(s.id)}
                          disabled={busy === s.id}
                          className="font-medium text-amber-700 hover:underline"
                        >
                          Mise en contact
                        </button>
                      )}
                    {s.status === "contact_offered" && (
                      <span className="text-stone-500">En attente</span>
                    )}
                    {s.status === "contact_paid" && (
                      <RevealedIdentity solicitationId={s.id} />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Dénouement */}
          {!closed && (
            <div className="rounded-2xl border border-stone-200 bg-white p-5">
              <h2 className="text-sm font-semibold">4. Dénouement</h2>
              <div className="mt-3 space-y-2">
                {need.status !== "open_consultation" && need.solicited_at && (
                  <button
                    onClick={() => closeNeed("open_consultation")}
                    className="w-full rounded-lg border border-stone-300 py-2 text-sm hover:bg-stone-50"
                  >
                    Lancer une consultation ouverte (lever l&apos;anonymat)
                  </button>
                )}
                <button
                  onClick={() => closeNeed("closed")}
                  disabled={busy === "close"}
                  className="w-full rounded-lg border border-stone-300 py-2 text-sm hover:bg-stone-50"
                >
                  Clore ce besoin
                </button>
                <button
                  onClick={deleteNeed}
                  disabled={busy === "delete"}
                  className="w-full rounded-lg border border-red-200 py-2 text-sm text-red-700 hover:bg-red-50"
                >
                  {busy === "delete" ? "Suppression…" : "Supprimer définitivement"}
                </button>
              </div>
            </div>
          )}

          {closed && (
            <div className="rounded-2xl border border-stone-200 bg-white p-5">
              <button
                onClick={deleteNeed}
                disabled={busy === "delete"}
                className="w-full rounded-lg border border-red-200 py-2 text-sm text-red-700 hover:bg-red-50"
              >
                {busy === "delete" ? "Suppression…" : "Supprimer définitivement ce besoin"}
              </button>
            </div>
          )}
        </aside>
      </main>
    </>
  );
}

function RevealedIdentity({ solicitationId }: { solicitationId: string }) {
  const [identity, setIdentity] = useState<any>(null);
  useEffect(() => {
    createClient()
      .rpc("get_revealed_identity", { p_solicitation_id: solicitationId })
      .then(({ data }) => setIdentity(data?.[0] ?? null));
  }, [solicitationId]);
  if (!identity) return <span className="text-green-700">Révélée…</span>;
  return (
    <span className="font-semibold text-green-700">
      {identity.company_name} ({identity.city ?? "—"})
    </span>
  );
}
