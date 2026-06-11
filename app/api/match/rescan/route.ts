import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { askClaudeJSON } from "@/lib/ai";

export const maxDuration = 60;

const SYSTEM = `Tu es le moteur de matching d'Entremise. On te donne le profil d'un prestataire et une liste de besoins anonymisés en sollicitation active.
Pour chaque besoin, évalue si ce prestataire est RÉELLEMENT pertinent professionnellement (capable d'aider). Le seul critère est la pertinence professionnelle.
Donne un score 0-100 et une raison courte en français. Ne retiens que les scores >= 50.
Réponds UNIQUEMENT en JSON strict : {"matches": [{"need_id": "...", "score": 85, "reason": "..."}]}`;

export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const [{ data: profile }, { data: openNeeds }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.rpc("get_open_needs_for_provider"),
  ]);
  if (!profile?.is_solicitable || !openNeeds || openNeeds.length === 0)
    return NextResponse.json({ solicited: 0 });

  let out;
  try {
    out = await askClaudeJSON({
      system: SYSTEM,
      maxTokens: 2000,
      messages: [
        {
          role: "user",
          content: `PRESTATAIRE :\n${profile.activity_description}\n(département ${profile.department ?? "?"} · CA ${profile.revenue_band ?? "?"} · certifications : ${(profile.certifications ?? []).join(", ") || "aucune"})\n\nBESOINS EN SOLLICITATION ACTIVE :\n${openNeeds
            .map(
              (n: any) =>
                `- need_id: ${n.need_id}\n  thème: ${n.theme ?? "?"}\n  besoin: ${n.disclosed_version}`
            )
            .join("\n")}`,
        },
      ],
    });
  } catch {
    return NextResponse.json({ solicited: 0 });
  }

  let count = 0;
  for (const m of out.matches ?? []) {
    if (!m?.need_id || !(m.score >= 50)) continue;
    const { error } = await supabase.rpc("self_solicit", {
      p_need_id: m.need_id,
      p_score: Math.round(m.score),
      p_reason: m.reason ?? "",
    });
    if (!error) count++;
  }
  return NextResponse.json({ solicited: count });
}
