import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { askClaudeJSON } from "@/lib/ai";

export const maxDuration = 60;

const SYSTEM = `Tu es le moteur de matching d'Entremise. On te donne un besoin anonymisé et une liste de prestataires candidats (descriptions d'activité).
Sélectionne UNIQUEMENT les prestataires réellement pertinents professionnellement (capables d'aider sur ce besoin). Le seul critère est la pertinence professionnelle — jamais la notoriété.
Pour chacun, donne un score 0-100 et une raison courte (1 phrase, en français).
Ne retiens que les scores >= 50, maximum 8 prestataires.
Réponds UNIQUEMENT en JSON strict : {"matches": [{"provider_id": "...", "score": 85, "reason": "..."}]}`;

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { needId } = await req.json();

  const { data: need } = await supabase
    .from("needs")
    .select("*")
    .eq("id", needId)
    .maybeSingle();
  if (!need)
    return NextResponse.json({ error: "Besoin introuvable" }, { status: 404 });
  if (!need.disclosure_approved_at)
    return NextResponse.json(
      { error: "Validez d'abord la version divulgable." },
      { status: 400 }
    );

  // candidats éligibles (filtres du demandeur appliqués côté base)
  const { data: candidates, error: candErr } = await supabase.rpc(
    "get_candidates_for_need",
    { p_need_id: needId }
  );
  if (candErr)
    return NextResponse.json({ error: candErr.message }, { status: 400 });
  if (!candidates || candidates.length === 0)
    return NextResponse.json(
      { error: "Aucun prestataire sollicitable ne correspond à vos filtres. Élargissez-les." },
      { status: 400 }
    );

  // déjà sollicités → exclus
  const { data: existing } = await supabase
    .from("solicitations")
    .select("provider_id")
    .eq("need_id", needId);
  const done = new Set((existing ?? []).map((s) => s.provider_id));
  const pool = candidates.filter((c: any) => !done.has(c.provider_id));
  if (pool.length === 0)
    return NextResponse.json(
      { error: "Tous les prestataires éligibles ont déjà été sollicités." },
      { status: 400 }
    );

  let out;
  try {
    out = await askClaudeJSON({
      system: SYSTEM,
      maxTokens: 3000,
      messages: [
        {
          role: "user",
          content: `BESOIN (version divulgable) :\n${need.disclosed_version}\n\nCANDIDATS :\n${pool
            .map(
              (c: any) =>
                `- provider_id: ${c.provider_id}\n  activité: ${c.activity_description}\n  département: ${c.department ?? "?"} · CA: ${c.revenue_band ?? "?"} · certifications: ${(c.certifications ?? []).join(", ") || "aucune"}`
            )
            .join("\n")}`,
        },
      ],
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Appel IA impossible. Vérifiez ANTHROPIC_API_KEY. " + (e?.message ?? "") },
      { status: 502 }
    );
  }

  const matches = (out.matches ?? []).filter(
    (m: any) => m.provider_id && pool.some((c: any) => c.provider_id === m.provider_id)
  );
  if (matches.length === 0)
    return NextResponse.json(
      { error: "L'IA n'a identifié aucun prestataire pertinent pour ce besoin dans le vivier actuel." },
      { status: 400 }
    );

  const { data: count, error } = await supabase.rpc("create_solicitations", {
    p_need_id: needId,
    p_providers: matches,
  });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ solicited: count, matches: matches.length });
}
