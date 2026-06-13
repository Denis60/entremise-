import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Reprend une conversation menée anonymement (sans compte) et la matérialise
// en un besoin rattaché au compte fraîchement créé.
export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { messages, title, theme, need_summary } = await req.json();
  if (!Array.isArray(messages) || messages.length === 0)
    return NextResponse.json({ error: "Conversation vide" }, { status: 400 });

  const turns = messages.filter(
    (m: any) =>
      (m?.role === "user" || m?.role === "assistant") &&
      typeof m?.content === "string" &&
      m.content.trim().length > 0
  );
  if (turns.length === 0)
    return NextResponse.json({ error: "Conversation vide" }, { status: 400 });

  const { data: need, error: needErr } = await supabase
    .from("needs")
    .insert({
      owner_id: user.id,
      title: title || "Besoin importé",
      theme: theme || null,
      need_summary: need_summary || null,
    })
    .select("id")
    .single();
  if (needErr || !need)
    return NextResponse.json(
      { error: needErr?.message ?? "Création du besoin impossible" },
      { status: 500 }
    );

  const rows = turns.map((m: any) => ({
    need_id: need.id,
    scope: "need",
    role: m.role,
    content: m.content,
  }));
  const { error: msgErr } = await supabase.from("messages").insert(rows);
  if (msgErr)
    return NextResponse.json({ error: msgErr.message }, { status: 500 });

  return NextResponse.json({ needId: need.id });
}
