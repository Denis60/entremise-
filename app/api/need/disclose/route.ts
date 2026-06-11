import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { askClaudeJSON } from "@/lib/ai";

export const maxDuration = 60;

const SYSTEM = `Tu rédiges la version DIVULGABLE d'un besoin d'entreprise, destinée à être montrée anonymement à des prestataires.
Règles strictes :
- Supprime tout élément identifiant : nom d'entreprise, marque, personne, adresse précise, détail unique permettant de deviner l'identité.
- Conserve le secteur en termes génériques, le contexte utile, le besoin, les contraintes, le calendrier et le budget s'ils ont été exprimés.
- Mentionne TOUJOURS la taille de l'entreprise demandeuse (tranche d'effectif, et CA si fourni) : c'est une information que la plateforme communique aux prestataires.
- Termine par les questions encore ouvertes sur lesquelles le marché peut aider.
- 150-250 mots, structuré, professionnel.
Réponds UNIQUEMENT en JSON strict : {"disclosed_version": "..."}`;

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

  const [{ data: history }, { data: profile }] = await Promise.all([
    supabase
      .from("messages")
      .select("role, content")
      .eq("need_id", needId)
      .eq("scope", "need")
      .order("created_at"),
    supabase
      .from("profiles")
      .select("headcount_band, revenue_band")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  const transcript = (history ?? [])
    .map((m) => `${m.role === "user" ? "Demandeur" : m.role === "market" ? "Marché" : "IA"} : ${m.content}`)
    .join("\n");

  let out;
  try {
    out = await askClaudeJSON({
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `Taille de l'entreprise demandeuse : ${profile?.headcount_band ? profile.headcount_band + " salariés" : "non renseignée"}${profile?.revenue_band ? " · CA " + profile.revenue_band : ""}\n\nSynthèse interne : ${need.need_summary ?? "(aucune)"}\n\nConversation :\n${transcript}`,
        },
      ],
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Appel IA impossible. Vérifiez ANTHROPIC_API_KEY. " + (e?.message ?? "") },
      { status: 502 }
    );
  }

  const disclosed = out.disclosed_version ?? out.reply;
  await supabase
    .from("needs")
    .update({ disclosed_version: disclosed, disclosure_approved_at: null })
    .eq("id", needId);

  return NextResponse.json({ disclosed_version: disclosed });
}
