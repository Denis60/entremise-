import { NextResponse } from "next/server";
import { createClient as createSbClient } from "@supabase/supabase-js";
import { askClaudeJSON } from "@/lib/ai";

export const maxDuration = 60;

const SYSTEM_UPDATE = `Tu rédiges, pour un prestataire sollicité, la synthèse des PRÉCISIONS apportées par le demandeur (anonyme) depuis le dernier point.
Règles strictes : anonymisation totale (aucun nom, marque, lieu précis ou détail identifiant) ; ne retiens que ce qui est utile au prestataire (réponses à ses questions, précisions de contexte, budget, contraintes, calendrier) ; si ses questions ont une réponse, dis-le explicitement. 80-150 mots. Termine en l'invitant à réagir ou affiner.
Réponds UNIQUEMENT en JSON strict : {"update": "..."}`;

const SYSTEM = `Tu consolides les contributions de prestataires (questions, suggestions, réactions) sur un besoin d'entreprise, pour les restituer au demandeur en UNE synthèse claire.
Règles : regroupe par prestataire (garde leurs pseudonymes « Prestataire N »), fusionne les redites, hiérarchise (questions importantes d'abord), reste fidèle au fond. 120-200 mots maximum. Termine par une phrase qui invite le demandeur à répondre aux questions qui comptent.
Réponds UNIQUEMENT en JSON strict : {"synthesis": "..."}`;

export async function POST(req: Request) {
  const secret = req.headers.get("x-cron-secret") ?? "";
  // client anonyme : les fonctions appelées valident elles-mêmes le secret
  const supabase = createSbClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: needs, error } = await supabase.rpc("get_needs_to_consolidate", {
    p_secret: secret,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 403 });
  // pas d'early return : la phase 2 (synthèses demandeur → prestataires) doit tourner même sans consolidation

  let done = 0;
  for (const n of needs ?? []) {
    let out;
    try {
      out = await askClaudeJSON({
        system: SYSTEM,
        messages: [
          {
            role: "user",
            content: `BESOIN : ${n.need_summary ?? n.title}\n\nCONTRIBUTIONS À CONSOLIDER :\n${(n.contributions ?? [])
              .map((c: any) => `- ${c.anon_label} (${c.kind}) : ${c.content}`)
              .join("\n")}`,
          },
        ],
      });
    } catch {
      continue;
    }
    const synthesis = out.synthesis ?? out.reply;
    if (!synthesis) continue;
    const { error: applyErr } = await supabase.rpc("apply_consolidation", {
      p_secret: secret,
      p_need_id: n.need_id,
      p_synthesis: synthesis,
    });
    if (!applyErr) done++;
  }
  // ===== Phase 2 : synthèses des précisions du demandeur vers chaque prestataire =====
  let updated = 0;
  const { data: updates } = await supabase.rpc("get_demander_updates_to_sync", {
    p_secret: secret,
  });
  for (const u of updates ?? []) {
    let out;
    try {
      out = await askClaudeJSON({
        system: SYSTEM_UPDATE,
        messages: [
          {
            role: "user",
            content: `BESOIN (synthèse interne) : ${u.need_summary ?? "?"}\n\nCONTRIBUTIONS DE CE PRESTATAIRE (${u.anon_label}) :\n${(u.provider_contributions ?? [])
              .map((c: any) => `- (${c.kind}) ${c.content}`)
              .join("\n") || "(aucune encore)"}\n\nNOUVEAUX ÉCHANGES DEMANDEUR/IA À SYNTHÉTISER :\n${(u.new_messages ?? [])
              .map((m: any) => `${m.role === "user" ? "Demandeur" : "IA"} : ${m.content}`)
              .join("\n")}`,
          },
        ],
      });
    } catch {
      continue;
    }
    const text = out.update ?? out.reply;
    if (!text) continue;
    const { error: updErr } = await supabase.rpc("apply_demander_update", {
      p_secret: secret,
      p_solicitation_id: u.solicitation_id,
      p_text: text,
      p_sync_ts: u.sync_ts,
    });
    if (!updErr) updated++;
  }

  return NextResponse.json({ consolidated: done, updated });
}
