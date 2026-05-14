import { useMemo, useEffect, useRef } from "react";
import MarkdownIt from "markdown-it";
import texmath from "markdown-it-texmath";
import katex from "katex";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  breaks: true,
}).use(texmath, {
  engine: katex,
  delimiters: "dollars",
  katexOptions: { throwOnError: false },
});

const COPY_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
const CHECK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;

const BTN_STYLE = [
  "position:absolute",
  "top:8px",
  "right:8px",
  "display:flex",
  "align-items:center",
  "justify-content:center",
  "width:28px",
  "height:28px",
  "border-radius:6px",
  "border:1px solid rgba(255,255,255,0.15)",
  "background:rgba(255,255,255,0.08)",
  "color:rgba(255,255,255,0.7)",
  "cursor:pointer",
  "opacity:0",
  "transition:opacity 0.15s,background 0.15s,color 0.15s",
].join(";");

interface Props {
  content: string;
  isUser?: boolean;
}

const MessageContent = ({ content, isUser = false }: Props) => {
  const html = useMemo(() => md.render(content.trimStart()), [content]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || isUser) return;

    const cleanups: (() => void)[] = [];

    container.querySelectorAll<HTMLElement>("pre").forEach((pre) => {
      if (pre.querySelector(".chat-code-copy")) return;

      pre.style.position = "relative";

      const btn = document.createElement("button");
      btn.className = "chat-code-copy";
      btn.setAttribute("aria-label", "Copiar código");
      btn.innerHTML = COPY_ICON;
      btn.style.cssText = BTN_STYLE;

      const show = () => { btn.style.opacity = "1"; };
      const hide = () => { btn.style.opacity = "0"; };
      pre.addEventListener("mouseenter", show);
      pre.addEventListener("mouseleave", hide);

      const onClick = async () => {
        const text = pre.querySelector("code")?.textContent ?? pre.textContent ?? "";
        await navigator.clipboard.writeText(text);
        btn.innerHTML = CHECK_ICON;
        btn.style.color = "rgba(52,211,153,1)";
        setTimeout(() => {
          btn.innerHTML = COPY_ICON;
          btn.style.color = "rgba(255,255,255,0.7)";
        }, 2000);
      };

      btn.addEventListener("click", onClick);
      pre.appendChild(btn);

      cleanups.push(() => {
        btn.removeEventListener("click", onClick);
        pre.removeEventListener("mouseenter", show);
        pre.removeEventListener("mouseleave", hide);
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }, [html, isUser]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "prose prose-sm max-w-none break-words",
        isUser
          ? "prose-invert text-primary-foreground"
          : [
              "text-foreground",
              "prose-headings:text-primary prose-headings:font-bold",
              "prose-code:rounded prose-code:bg-black/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:font-mono prose-code:text-[0.8em]",
              "prose-pre:rounded-lg prose-pre:bg-[#353539] prose-pre:text-zinc-100 prose-pre:p-4 prose-pre:font-mono prose-pre:text-sm prose-pre:leading-relaxed",
              "prose-code:bg-zinc-900/10 dark:prose-code:bg-zinc-100/10",
              "prose-blockquote:border-l-accent prose-blockquote:text-muted-foreground",
              "prose-a:text-accent prose-a:underline-offset-2",
              "prose-hr:border-border",
            ].join(" "),
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default MessageContent;
