import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Message } from "@/types/chat";

// Mock lazy-loaded MessageContent to avoid dynamic import complexity
vi.mock("@/components/chat/MessageContent", () => ({
  default: ({ content }: { content: string }) => <span data-testid="msg-content">{content}</span>,
}));

// Mock framer-motion to render children directly
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement>) => <span {...props}>{children}</span>,
  },
}));

import MessageBubble from "@/components/chat/MessageBubble";

const baseMessage = (overrides: Partial<Message> = {}): Message => ({
  id: "1",
  role: "assistant",
  content: "Hola mundo",
  timestamp: new Date("2026-05-23T10:00:00"),
  ...overrides,
});

describe("MessageBubble — sugerencias", () => {
  it("no renderiza sugerencias dentro de la burbuja", () => {
    const msg = baseMessage({ suggestions: ["¿Qué es POO?", "¿Qué es herencia?"] });
    render(<MessageBubble message={msg} />);

    expect(screen.queryByText("¿Qué es POO?")).not.toBeInTheDocument();
    expect(screen.queryByText("¿Qué es herencia?")).not.toBeInTheDocument();
  });

  it("no renderiza sugerencias cuando la lista está vacía", () => {
    const msg = baseMessage({ suggestions: [] });
    const { container } = render(<MessageBubble message={msg} />);

    const buttons = container.querySelectorAll("button[class*='teal']");
    expect(buttons.length).toBe(0);
  });

  it("no renderiza sugerencias mientras está en streaming", () => {
    const msg = baseMessage({ suggestions: ["¿Qué es POO?"], content: "Escribiendo..." });
    render(<MessageBubble message={msg} isStreaming />);

    expect(screen.queryByText("¿Qué es POO?")).not.toBeInTheDocument();
  });

  it("no renderiza sugerencias en mensajes de usuario", () => {
    const msg = baseMessage({ role: "user", suggestions: ["¿Qué es POO?"] });
    render(<MessageBubble message={msg} />);

    // suggestions block only renders when !isUser
    expect(screen.queryByText("¿Qué es POO?")).not.toBeInTheDocument();
  });
});

describe("MessageBubble — typewriter", () => {
  it("muestra TypingDots al inicio del stream sin contenido", () => {
    const msg = baseMessage({ content: "" });
    const { container } = render(<MessageBubble message={msg} isStreaming />);

    // TypingDots renders three rounded spans
    const dots = container.querySelectorAll(".rounded-full.bg-muted-foreground\\/60");
    expect(dots.length).toBe(3);
  });

  it("muestra el contenido completo inmediatamente cuando no está en streaming", () => {
    const msg = baseMessage({ content: "Hola mundo" });
    render(<MessageBubble message={msg} isStreaming={false} />);

    expect(screen.getByTestId("msg-content")).toHaveTextContent("Hola mundo");
  });

  it("muestra el contenido completo al terminar el stream", () => {
    const msg = baseMessage({ content: "Respuesta completa" });
    const { rerender } = render(<MessageBubble message={msg} isStreaming />);

    rerender(<MessageBubble message={msg} isStreaming={false} />);

    expect(screen.getByTestId("msg-content")).toHaveTextContent("Respuesta completa");
  });

  it("mensajes históricos muestran contenido directamente sin typewriter", () => {
    const msg = baseMessage({ content: "Mensaje del historial" });
    render(<MessageBubble message={msg} />);

    expect(screen.getByTestId("msg-content")).toHaveTextContent("Mensaje del historial");
  });
});
