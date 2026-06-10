import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

/** Appelle Claude et tente de parser un objet JSON dans la réponse. */
export async function askClaudeJSON(opts: {
  system: string;
  messages: { role: "user" | "assistant"; content: string }[];
  maxTokens?: number;
}): Promise<any> {
  const res = await anthropic.messages.create({
    model: MODEL,
    max_tokens: opts.maxTokens ?? 2000,
    system: opts.system,
    messages: opts.messages,
  });
  const text = res.content
    .filter((b) => b.type === "text")
    .map((b: any) => b.text)
    .join("");
  // extrait le premier objet JSON de la réponse
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      /* fallthrough */
    }
  }
  return { reply: text };
}
