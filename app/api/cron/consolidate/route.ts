import { NextResponse } from "next/server";
import { createClient as createSbClient } from "@supabase/supabase-js";
import { askClaudeJSON } from "@/lib/ai";

export const maxDuration = 60;

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
  if (!needs || needs.length === 0) return NextResponse.json({ consolidated: 0 });

  let done = 0;
  for (const n of needs) {
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
  return NextResponse.json({ consolidated: done });
}
