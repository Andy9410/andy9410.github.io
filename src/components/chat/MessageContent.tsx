import React from "react";
import { cn } from "@/lib/utils";

interface Props {
  content: string;
  isUser?: boolean;
}

function parseInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`)/g;
  let last = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));

    if (match[2]) {
      parts.push(<strong key={key++} className="font-semibold">{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(<em key={key++}>{match[3]}</em>);
    } else if (match[4]) {
      parts.push(
        <code
          key={key++}
          className="rounded-sm bg-black/10 px-1.5 py-0.5 font-mono text-[0.8em]"
        >
          {match[4]}
        </code>
      );
    }
    last = match.index + match[0].length;
  }

  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function renderBlock(block: string, key: number, isUser: boolean): React.ReactNode {
  const trimmed = block.trim();

  // Fenced code block
  if (trimmed.startsWith("```")) {
    const lines = trimmed.split("\n");
    const lang = lines[0].replace("```", "").trim();
    const code = lines.slice(1, lines[lines.length - 1] === "```" ? -1 : undefined).join("\n");
    return (
      <div key={key} className="my-2 overflow-hidden rounded-lg border border-border">
        {lang && (
          <div className="border-b border-border bg-muted px-3 py-1.5 font-mono text-xs text-muted-foreground">
            {lang}
          </div>
        )}
        <pre className="overflow-x-auto bg-primary/5 p-4 font-mono text-sm leading-relaxed">
          <code>{code}</code>
        </pre>
      </div>
    );
  }

  // Numbered list
  if (/^\d+\.\s/.test(trimmed)) {
    const items = trimmed.split("\n").filter((l) => /^\d+\.\s/.test(l.trim()));
    return (
      <ol key={key} className="my-1 space-y-1 pl-5 list-decimal">
        {items.map((item, i) => (
          <li key={i} className="text-sm leading-relaxed">
            {parseInline(item.replace(/^\d+\.\s/, ""))}
          </li>
        ))}
      </ol>
    );
  }

  // Bullet list
  if (/^[-*]\s/.test(trimmed)) {
    const items = trimmed.split("\n").filter((l) => /^[-*]\s/.test(l.trim()));
    return (
      <ul key={key} className="my-1 space-y-1 pl-5 list-disc">
        {items.map((item, i) => (
          <li key={i} className="text-sm leading-relaxed">
            {parseInline(item.replace(/^[-*]\s/, ""))}
          </li>
        ))}
      </ul>
    );
  }

  // Regular paragraph
  return (
    <p key={key} className="text-sm leading-relaxed">
      {parseInline(trimmed)}
    </p>
  );
}

const MessageContent = ({ content, isUser = false }: Props) => {
  const blocks = content.split(/\n{2,}(?=(?:[^`]|`[^`]*`)*$)/);

  return (
    <div className={cn("space-y-2", isUser && "text-primary-foreground")}>
      {blocks.map((block, i) => renderBlock(block, i, isUser))}
    </div>
  );
};

export default MessageContent;
