import React from "react";

// Rendu Markdown minimal et SÛR (aucune injection HTML, on construit des
// noeuds React) : gère **gras**, *italique*, `code`, listes à puces /
// numérotées et sauts de ligne. Suffisant pour le markdown léger que produit
// l'IA d'Entremise, sans dépendance externe.

function renderInline(text: string, keyBase: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Ordre important : **gras** avant *italique*.
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[2] != null) {
      nodes.push(<strong key={`${keyBase}-b${k++}`}>{m[2]}</strong>);
    } else if (m[3] != null) {
      nodes.push(<em key={`${keyBase}-i${k++}`}>{m[3]}</em>);
    } else if (m[4] != null) {
      nodes.push(
        <code
          key={`${keyBase}-c${k++}`}
          className="rounded bg-stone-200 px-1 py-0.5 text-[0.85em]"
        >
          {m[4]}
        </code>
      );
    }
    last = re.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

const BULLET = /^\s*[-*]\s+(.*)$/;
const ORDERED = /^\s*\d+\.\s+(.*)$/;

export default function Markdown({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const lines = (text ?? "").split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    if (BULLET.test(lines[i])) {
      const items: string[] = [];
      while (i < lines.length) {
        const b = BULLET.exec(lines[i]);
        if (!b) break;
        items.push(b[1]);
        i++;
      }
      blocks.push(
        <ul key={`ul${key}`} className="my-1 list-disc space-y-0.5 pl-5">
          {items.map((it, j) => (
            <li key={j}>{renderInline(it, `ul${key}-${j}`)}</li>
          ))}
        </ul>
      );
      key++;
      continue;
    }

    if (ORDERED.test(lines[i])) {
      const items: string[] = [];
      while (i < lines.length) {
        const o = ORDERED.exec(lines[i]);
        if (!o) break;
        items.push(o[1]);
        i++;
      }
      blocks.push(
        <ol key={`ol${key}`} className="my-1 list-decimal space-y-0.5 pl-5">
          {items.map((it, j) => (
            <li key={j}>{renderInline(it, `ol${key}-${j}`)}</li>
          ))}
        </ol>
      );
      key++;
      continue;
    }

    // Paragraphe : lignes consécutives jusqu'à une puce/numéro.
    const para: string[] = [];
    while (
      i < lines.length &&
      !BULLET.test(lines[i]) &&
      !ORDERED.test(lines[i])
    ) {
      para.push(lines[i]);
      i++;
    }
    const joined = para.join("\n").replace(/^\n+|\n+$/g, "");
    if (joined.trim() === "") continue;
    const parts = joined.split("\n");
    blocks.push(
      <p key={`p${key}`} className="whitespace-pre-wrap">
        {parts.map((p, j) => (
          <React.Fragment key={j}>
            {j > 0 && <br />}
            {renderInline(p, `p${key}-${j}`)}
          </React.Fragment>
        ))}
      </p>
    );
    key++;
  }

  return <div className={`space-y-2 ${className}`.trim()}>{blocks}</div>;
}
