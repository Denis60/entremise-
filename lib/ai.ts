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
    const raw = text.slice(start, end + 1);
    try {
      return JSON.parse(raw);
    } catch {
      // répare les sauts de ligne non échappés à l'intérieur des chaînes
      try {
        return JSON.parse(escapeNewlinesInStrings(raw));
      } catch {
        /* fallthrough */
      }
    }
    // dernier recours : extraire le champ reply/synthesis/update à la regex
    for (const key of ["reply", "synthesis", "update", "disclosed_version"]) {
      const m = raw.match(
        new RegExp('"' + key + '"\\s*:\\s*"((?:[^"\\\\]|\\\\.|[\\r\\n])*)"')
      );
      if (m)
        return {
          [key]: m[1].replace(/\\n/g, "\n").replace(/\\"/g, '"'),
        };
    }
    // ne jamais renvoyer du JSON brut à afficher
    return {};
  }
  return { reply: text };
}

/** Échappe les \n littéraux situés à l'intérieur des chaînes JSON. */
function escapeNewlinesInStrings(s: string): string {
  let out = "";
  let inString = false;
  let escaped = false;
  for (const ch of s) {
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      } else if (ch === "\n") {
        out += "\\n";
        continue;
      } else if (ch === "\r") {
        continue;
      }
    } else if (ch === '"') {
      inString = true;
    }
    out += ch;
  }
  return out;
}
