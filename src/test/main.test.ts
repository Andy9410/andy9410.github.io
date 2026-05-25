import { describe, it, expect, vi } from "vitest";

const mockWorkerOptions = vi.hoisted(() => ({
  workerSrc: "",
}));

vi.mock("react-pdf", () => ({
  pdfjs: {
    GlobalWorkerOptions: mockWorkerOptions,
  },
}));

import { pdfWorkerSrc } from "@/lib/pdfWorker";

describe("Worker de pdf.js", () => {
  it("usa el worker local resuelto por Vite", () => {
    expect(pdfWorkerSrc).toContain("pdf.worker.min");
    expect(pdfWorkerSrc).toContain(".mjs");
  });

  it("no depende del specifier default de pdf.js", () => {
    expect(pdfWorkerSrc).not.toBe("pdf.worker.mjs");
  });

  it("no usa CDN externo", () => {
    expect(pdfWorkerSrc).not.toContain("cdnjs.cloudflare.com");
  });

  it("configura GlobalWorkerOptions con el worker resuelto", () => {
    expect(mockWorkerOptions.workerSrc).toBe(pdfWorkerSrc);
  });
});
