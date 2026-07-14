import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { askClaudeJSON, usableText } from "@/lib/ai";

export const maxDuration = 60;

const SYSTEM = `Tu es l'IA d'Entremise, plateforme d'intermédiation économique de la Charente.
Ton rôle : aider un dirigeant d'entreprise à faire mûrir un besoin encore flou, comme un excellent conseiller.
À chaque tour : reformule ce que tu comprends, identifie ce qui reste flou, pose UNE question prioritaire (fréquence, urgence, enjeu économique, alternatives testées, budget, contraintes, critères de décision).
Règles : ton clair et direct, pas de jargon. Tu n'inventes JAMAIS de réponse marché : la valeur viendra de vrais prestataires. La conversation est confidentielle, illimitée et sans conséquence : rien ne sort sans validation explicite du demandeur. Si le besoin te semble mûr, dis-le et suggère de préparer la version divulgable au marché (panneau de droite). Rassure alors le demandeur : il n'est pas nécessaire de tout détailler, il peut s'arrêter quand il le souhaite et reprendre plus tard sans rien perdre.
Réponds UNIQUEMENT en JSON strict :
{"reply": "ta réponse au demandeur", "title": "titre court du besoin (5 mots max)", "theme": "catégorie courte (ex: Digital & CRM, Énergie, Transmission, RH, Marketing, Logistique...)", "need_summary": "synthèse interne du besoin en l'état", "ready": true/false}`;

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { needId, message } = await req.json();
  if (!needId || !message)
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });

  const { data: need } = await supabase
    .from("needs")
    .select("*")
    .eq("id", needId)
    .maybeSingle();
  if (!need)
    return NextResponse.json({ error: "Besoin introuvable" }, { status: 404 });

  // Le demandeur reprend la conversation : contributions en attente intégrées en brief, sans alerte
  const { data: pending } = await supabase.rpc("consume_pending_contributions", {
    p_need_id: needId,
  });
  if (pending && pending.length > 0) {
    await supabase.from("messages").insert({
      need_id: needId,
      scope: "need",
      role: "market",
      content: pending
        .map((c: any) => `${c.anon_label} (${c.kind}) : ${c.content}`)
        .join("\n\n"),
      meta: { kind: "batch" },
    });
  }

  const { data: history } = await supabase
    .from("messages")
    .select("role, content")
    .eq("need_id", needId)
    .eq("scope", "need")
    .order("created_at");

  // message utilisateur
  await supabase.from("messages").insert({
    need_id: needId,
    scope: "need",
    role: "user",
    content: message,
  });

  const turns = (history ?? [])
    .filter((m) => m.role === "user" || m.role === "assistant" || m.role === "market")
    .map((m) => ({
      role: (m.role === "assistant" ? "assistant" : "user") as "user" | "assistant",
      content: m.role === "market" ? `[Contribution d'un prestataire du marché] ${m.content}` : m.content,
    }));
  turns.push({ role: "user", content: message });

  let out;
  try {
    out = await askClaudeJSON({ system: SYSTEM, messages: turns });
    // réponse vide ou placeholder : une seule nouvelle tentative
    if (!usableText(out?.reply))
      out = await askClaudeJSON({ system: SYSTEM, messages: turns, maxTokens: 4000 });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Appel IA impossible. Vérifiez ANTHROPIC_API_KEY. " + (e?.message ?? "") },
      { status: 502 }
    );
  }
  // jamais de placeholder persisté : on signale l'échec, le message utilisateur reste en base
  if (!usableText(out?.reply))
    return NextResponse.json(
      { error: "L'IA n'a pas pu formuler de réponse. Réessayez dans un instant." },
      { status: 502 }
    );

  await supabase.from("messages").insert({
    need_id: needId,
    scope: "need",
    role: "assistant",
    content: out.reply,
  });

  const patch: Record<string, unknown> = {};
  if (out.title) patch.title = out.title;
  if (out.theme) patch.theme = out.theme;
  if (out.need_summary) patch.need_summary = out.need_summary;
  if (Object.keys(patch).length)
    await supabase.from("needs").update(patch).eq("id", needId);

  return NextResponse.json({ ok: true, ready: !!out.ready });
}
