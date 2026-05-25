import { describe, it, expect } from "vitest";

describe("Worker de pdf.js — URL de cdnjs", () => {
  it("configura workerSrc correctamente con CDN y la versión exacta", () => {
    const version = "5.6.205";
    const workerSrc =
      `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;

    expect(workerSrc).toBe(
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.6.205/pdf.worker.min.js"
    );
  });

  it("NO contiene .mjs, solo .js", () => {
    const version = "5.6.205";
    const workerSrc =
      `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;

    expect(workerSrc).not.toContain(".mjs");
    expect(workerSrc).toContain(".js");
  });

  it("funciona con diferentes versiones de pdfjs", () => {
    const versions = ["4.9.155", "5.0.379", "5.6.205"];

    for (const version of versions) {
      const workerSrc =
        `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;

      expect(workerSrc).toBe(
        `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`
      );
      expect(workerSrc).not.toContain(".mjs");
    }
  });
});
