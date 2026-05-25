import { describe, it, expect } from "vitest";

// Inline the SseEvent type to test parsing logic independently
type SseEvent =
  | { type: "meta"; conversationId: number }
  | { type: "chunk"; text: string }
  | { type: "replace"; text: string }
  | { type: "sources"; files: string[] }
  | { type: "suggestions"; questions: string[] }
  | { type: "done" }
  | { type: "error" };

const parse = (raw: string): SseEvent => JSON.parse(raw) as SseEvent;

describe("SSE event parsing", () => {
  it("parsea evento chunk", () => {
    const e = parse('{"type":"chunk","text":"Hola"}');
    expect(e.type).toBe("chunk");
    if (e.type === "chunk") expect(e.text).toBe("Hola");
  });

  it("parsea evento replace", () => {
    const e = parse('{"type":"replace","text":"Respuesta limpia"}');
    expect(e.type).toBe("replace");
    if (e.type === "replace") expect(e.text).toBe("Respuesta limpia");
  });

  it("parsea evento suggestions con tres preguntas", () => {
    const e = parse('{"type":"suggestions","questions":["¿Qué es POO?","¿Qué es herencia?","¿Qué es polimorfismo?"]}');
    expect(e.type).toBe("suggestions");
    if (e.type === "suggestions") {
      expect(e.questions).toHaveLength(3);
      expect(e.questions[0]).toBe("¿Qué es POO?");
    }
  });

  it("parsea evento sources", () => {
    const e = parse('{"type":"sources","files":["doc1.pdf","doc2.pdf"]}');
    expect(e.type).toBe("sources");
    if (e.type === "sources") expect(e.files).toContain("doc1.pdf");
  });

  it("parsea evento done", () => {
    const e = parse('{"type":"done"}');
    expect(e.type).toBe("done");
  });

  it("parsea evento meta con conversationId", () => {
    const e = parse('{"type":"meta","conversationId":42}');
    expect(e.type).toBe("meta");
    if (e.type === "meta") expect(e.conversationId).toBe(42);
  });

  it("parsea evento error", () => {
    const e = parse('{"type":"error"}');
    expect(e.type).toBe("error");
  });
});
