import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { askClaudeJSON } from "@/lib/ai";

export const maxDuration = 60;

const SYSTEM = `Tu es l'IA d'Entremise côté PRESTATAIRE. Un prestataire a reçu un besoin anonymisé et discute avec toi.
Ton rôle :
1. L'aider à comprendre le besoin et à formuler des questions/suggestions UTILES au demandeur.
2. Identifier dans son message les contributions qui méritent d'être transmises au demandeur (questions pertinentes, suggestions concrètes, réactions d'expert). Reformule-les proprement à la 2e personne (adressées au demandeur). Ne transmets PAS les banalités, le simple intérêt commercial ou les coordonnées.
3. Lui répondre : accuse réception, indique ce qui a été transmis, et pousse-le à mobiliser son expertise (c'est elle que le demandeur évalue).
Règles : jamais d'identité de part ni d'autre. Pas d'offre commerciale à rédiger.
Réponds UNIQUEMENT en JSON strict :
{"reply": "ta réponse au prestataire", "contributions": [{"kind": "question"|"suggestion"|"reaction", "content": "texte transmis au demandeur"}]}`;

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { solicitationId, message } = await req.json();
  if (!solicitationId || !message)
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });

  const { data: briefRows, error: briefErr } = await supabase.rpc(
    "get_solicitation_brief",
    { p_solicitation_id: solicitationId }
  );
  const brief = briefRows?.[0];
  if (briefErr || !brief)
    return NextResponse.json({ error: "Sollicitation introuvable" }, { status: 404 });

  const { data: history } = await supabase
    .from("messages")
    .select("role, content")
    .eq("solicitation_id", solicitationId)
    .eq("scope", "solicitation")
    .order("created_at");

  await supabase.from("messages").insert({
    solicitation_id: solicitationId,
    scope: "solicitation",
    role: "user",
    content: message,
  });

  const turns = (history ?? [])
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
  turns.unshift({
    role: "user",
    content: `[BESOIN ANONYMISÉ]\n${brief.disclosed_version}`,
  });
  turns.push({ role: "user", content: message });

  let out;
  try {
    out = await askClaudeJSON({ system: SYSTEM, messages: turns });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Appel IA impossible. Vérifiez ANTHROPIC_API_KEY. " + (e?.message ?? "") },
      { status: 502 }
    );
  }

  // Relayer les contributions retenues au demandeur (anonymisées)
  const contribs = Array.isArray(out.contributions) ? out.contributions : [];
  for (const c of contribs) {
    if (c?.content) {
      await supabase.rpc("relay_contribution", {
        p_solicitation_id: solicitationId,
        p_kind: ["question", "suggestion", "reaction"].includes(c.kind)
          ? c.kind
          : "reaction",
        p_content: c.content,
      });
    }
  }

  await supabase.from("messages").insert({
    solicitation_id: solicitationId,
    scope: "solicitation",
    role: "assistant",
    content: out.reply ?? "…",
  });

  return NextResponse.json({ ok: true, relayed: contribs.length });
}
