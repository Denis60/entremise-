"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export const ANON_CHAT_KEY = "entremise_anon_chat";

type Turn = { role: "user" | "assistant"; content: string };
type Stored = {
  messages: Turn[];
  meta: { title: string; theme: string; need_summary: string; ready: boolean };
  updated_at: string;
};

const INTRO =
  "Bonjour. Décrivez-moi votre besoin, même flou — je vous aide à le clarifier, sans aucun engagement. Vous pouvez aussi me demander comment Entremise fonctionne.";

const SUGGESTIONS = [
  "Comment fonctionne Entremise ?",
  "Je cherche à automatiser mon suivi client mais je ne sais pas par où commencer.",
  "Je dois réduire ma facture d'énergie, quelles options ?",
];

export default function AnonChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Turn[]>([]);
  const [meta, setMeta] = useState<Stored["meta"]>({
    title: "",
    theme: "",
    need_summary: "",
    ready: false,
  });
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Restaure une éventuelle conversation en cours
  useEffect(() => {
    try {
      const raw = localStorage.getItem(ANON_CHAT_KEY);
      if (raw) {
        const s = JSON.parse(raw) as Stored;
        if (Array.isArray(s.messages)) setMessages(s.messages);
        if (s.meta) setMeta(s.meta);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, sending]);

  function persist(next: Turn[], nextMeta: Stored["meta"]) {
    try {
      localStorage.setItem(
        ANON_CHAT_KEY,
        JSON.stringify({
          messages: next,
          meta: nextMeta,
          updated_at: new Date().toISOString(),
        } satisfies Stored)
      );
    } catch {
      /* ignore */
    }
  }

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || sending) return;
    setInput("");
    setError(null);
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setSending(true);
    persist(next, meta);

    const res = await fetch("/api/chat/anon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: next }),
    });
    setSending(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Erreur lors de l'appel à l'IA.");
      return;
    }
    const j = await res.json();
    const withReply = [...next, { role: "assistant" as const, content: j.reply }];
    const nextMeta = {
      title: j.title || meta.title,
      theme: j.theme || meta.theme,
      need_summary: j.need_summary || meta.need_summary,
      ready: !!j.ready,
    };
    setMessages(withReply);
    setMeta(nextMeta);
    persist(withReply, nextMeta);
  }

  function reset() {
    if (!confirm("Effacer cette conversation ?")) return;
    localStorage.removeItem(ANON_CHAT_KEY);
    setMessages([]);
    setMeta({ title: "", theme: "", need_summary: "", ready: false });
  }

  const hasContent = messages.some((m) => m.role === "user");

  return (
    <main className="mx-auto max-w-3xl px-6 py-6">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">
          entre<span className="text-amber-600">mise</span>
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          {hasContent && (
            <button onClick={reset} className="text-stone-400 hover:text-stone-700">
              Effacer
            </button>
          )}
          <Link href="/login" className="rounded-lg px-3 py-2 hover:bg-stone-100">
            Connexion
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-stone-900 px-4 py-2 font-medium text-white hover:bg-stone-700"
          >
            Créer un compte
          </Link>
        </nav>
      </header>

      <p className="mt-4 text-sm text-stone-500">
        Conversation libre et sans compte. Rien n&apos;est transmis à qui que ce
        soit. Créez un compte quand vous voulez{" "}
        <strong>sauvegarder cette discussion</strong> ou{" "}
        <strong>solliciter le marché</strong>.
      </p>

      <section className="mt-4 flex h-[calc(100vh-260px)] flex-col rounded-2xl border border-stone-200 bg-white">
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-stone-100 px-4 py-2.5 text-sm">
            {INTRO}
          </div>

          {messages.length === 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-stone-300 px-3 py-1.5 text-left text-xs text-stone-600 hover:border-amber-400 hover:bg-amber-50"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i}>
              {m.role === "user" ? (
                <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-stone-900 px-4 py-2.5 text-sm text-white">
                  {m.content}
                </div>
              ) : (
                <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-stone-100 px-4 py-2.5 text-sm">
                  {m.content}
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

        <div className="flex gap-2 border-t border-stone-100 p-4">
          <textarea
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !window.matchMedia("(pointer: coarse)").matches
              ) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Décrivez votre besoin ou posez une question…"
            className="flex-1 resize-none rounded-xl border border-stone-300 px-4 py-2.5 text-sm"
          />
          <button
            onClick={() => send()}
            disabled={sending}
            className="rounded-xl bg-stone-900 px-5 font-medium text-white hover:bg-stone-700 disabled:opacity-50"
          >
            Envoyer
          </button>
        </div>
      </section>

      {/* Invitation à sauvegarder dès qu'une conversation existe */}
      {hasContent && (
        <div className="mt-4 flex flex-col items-start justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center">
          <p className="text-sm text-amber-900">
            {meta.ready
              ? "Votre besoin est mûr. Créez un compte pour le sauvegarder et solliciter anonymement les prestataires du territoire."
              : "Créez un compte gratuit pour sauvegarder cette conversation — elle sera reprise telle quelle dans votre espace. Le compte est requis pour solliciter le marché."}
          </p>
          <button
            onClick={() => router.push("/signup")}
            className="shrink-0 rounded-xl bg-amber-600 px-5 py-2.5 font-semibold text-white hover:bg-amber-500"
          >
            Sauvegarder en créant un compte
          </button>
        </div>
      )}
    </main>
  );
}
