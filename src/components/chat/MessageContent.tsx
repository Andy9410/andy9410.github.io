import { useMemo } from "react";
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

interface Props {
  content: string;
  isUser?: boolean;
}

const MessageContent = ({ content, isUser = false }: Props) => {
  const html = useMemo(() => md.render(content), [content]);

  return (
    <div
      className={cn(
        "prose prose-sm max-w-none break-words",
        isUser
          ? "prose-invert text-primary-foreground"
          : [
              "text-foreground",
              "prose-headings:text-primary prose-headings:font-bold",
              "prose-code:rounded prose-code:bg-black/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:font-mono prose-code:text-[0.8em]",
              "prose-pre:rounded-lg prose-pre:bg-primary/5 prose-pre:p-4 prose-pre:font-mono prose-pre:text-sm prose-pre:leading-relaxed",
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
