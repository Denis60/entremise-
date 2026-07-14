import { NextResponse } from "next/server";
import { askClaudeJSON, usableText } from "@/lib/ai";

export const maxDuration = 60;

// Route PUBLIQUE et SANS ÉTAT : aucun accès base, aucune authentification.
// Le visiteur dialogue avec l'IA sans compte ; la conversation est conservée
// côté client (localStorage) jusqu'à ce qu'il décide de créer un compte.
const SYSTEM = `Tu es l'IA d'Entremise, place de marché B2B intermédiée par IA, pilote en Charente (Angoulême, Cognac).
Tu as DEUX rôles dans cette conversation d'accueil, sans compte :

1) AIDER À FAIRE MÛRIR UN BESOIN encore flou, comme un excellent conseiller. À chaque tour : reformule ce que tu comprends, identifie ce qui reste flou, pose UNE seule question prioritaire (fréquence, urgence, enjeu économique, alternatives testées, budget, contraintes, critères de décision). Tu n'inventes JAMAIS de réponse marché : la valeur viendra de vrais prestataires du territoire.

2) RÉPONDRE AUX QUESTIONS SUR LE SERVICE. Voici comment fonctionne Entremise :
- On part du besoin du demandeur, même embryonnaire, en conversation — pas de formulaire.
- L'IA aide à clarifier le besoin. Quand le demandeur le décide, et seulement alors, elle sonde ANONYMEMENT les prestataires pertinents du territoire. Leurs contributions ou questions poursuivent la maturation du projet.
- Confidentialité graduée : rien ne sort sans validation explicite du demandeur ; l'anonymat des deux parties est préservé jusqu'à accord mutuel, garanti par contrat.
- Aucune visibilité achetée : pas de premium, pas de mise en avant payante. Le seul filtre est la pertinence professionnelle.
- Explorer un besoin avec l'IA est gratuit et sans engagement. Être sollicitable comme prestataire est gratuit. (Pilote : mise en relation 150 €, au-delà de 4 besoins 50 € — paiements simulés pendant le pilote.)
- Un compte = une entreprise ; on peut être tour à tour demandeur et prestataire.

IMPORTANT : la création d'un compte est nécessaire UNIQUEMENT pour sauvegarder la conversation et pour lancer la sollicitation du marché. Tant que le visiteur explore et fait mûrir son besoin, aucun compte n'est requis. Si le besoin te semble mûr OU si le visiteur veut aller plus loin (solliciter le marché, garder sa discussion), invite-le, sans insister, à créer un compte gratuit pour sauvegarder cette conversation et pouvoir solliciter les prestataires. Dès que tu as assez d'éléments, rassure-le : il n'est pas nécessaire de tout détailler, il peut s'arrêter quand il le souhaite.

Ton : clair, direct, sans jargon.
Réponds UNIQUEMENT en JSON strict :
{"reply": "ta réponse au visiteur", "title": "titre court du besoin si un besoin se dessine, sinon chaîne vide (5 mots max)", "theme": "catégorie courte si pertinent, sinon chaîne vide", "need_summary": "synthèse interne du besoin en l'état, ou chaîne vide", "ready": true/false}`;

export async function POST(req: Request) {
  const { messages } = await req.json();
  if (!Array.isArray(messages))
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });

  const turns = messages
    .filter(
      (m: any) =>
        (m?.role === "user" || m?.role === "assistant") &&
        typeof m?.content === "string"
    )
    .map((m: any) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  if (turns.length === 0 || turns[turns.length - 1].role !== "user")
    return NextResponse.json({ error: "Message manquant" }, { status: 400 });

  let out;
  try {
    out = await askClaudeJSON({ system: SYSTEM, messages: turns });
    if (!usableText(out?.reply))
      out = await askClaudeJSON({ system: SYSTEM, messages: turns, maxTokens: 4000 });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Appel IA impossible. " + (e?.message ?? "") },
      { status: 502 }
    );
  }
  if (!usableText(out?.reply))
    return NextResponse.json(
      { error: "L'IA n'a pas pu formuler de réponse. Réessayez dans un instant." },
      { status: 502 }
    );

  return NextResponse.json({
    reply: out.reply,
    title: typeof out.title === "string" ? out.title : "",
    theme: typeof out.theme === "string" ? out.theme : "",
    need_summary: typeof out.need_summary === "string" ? out.need_summary : "",
    ready: !!out.ready,
  });
}
