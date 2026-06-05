const SUPERSCRIPTS: Record<string, string> = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
  "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
  "n": "ⁿ", "x": "ˣ", "a": "ᵃ", "b": "ᵇ", "c": "ᶜ",
  "i": "ⁱ", "m": "ᵐ", "+": "⁺", "-": "⁻",
};

const SUBSCRIPTS: Record<string, string> = {
  "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄",
  "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
  "n": "ₙ", "x": "ₓ", "a": "ₐ", "i": "ᵢ", "j": "ⱼ",
};

/**
 * Converts common math/LaTeX notation to Unicode symbols for display on the whiteboard.
 */
export function mathToUnicode(text: string): string {
  if (!text) return text;

  return text
    // ── LaTeX fractions: \frac{a}{b} → (a)/(b) ─────────────────────────
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1)/($2)")

    // ── sqrt ─────────────────────────────────────────────────────────────
    .replace(/\\sqrt\{([^}]+)\}/g, "√($1)")
    .replace(/\\sqrt\s*\(([^)]+)\)/g, "√($1)")
    .replace(/sqrt\(([^)]+)\)/g, "√($1)")
    .replace(/\\sqrt\s+(\S+)/g, "√$1")

    // ── Superscripts: x^2 → x², x^{n+1} → x^(n+1) ───────────────────
    .replace(/\^\{([^}]+)\}/g, (_, e) => {
      const mapped = [...e].map((c) => SUPERSCRIPTS[c] ?? c).join("");
      return mapped;
    })
    .replace(/\^([0-9a-z+\-])/g, (_, c) => SUPERSCRIPTS[c] ?? `^${c}`)

    // ── Subscripts: x_1 → x₁, x_{ij} → x_(ij) ──────────────────────
    .replace(/_\{([^}]+)\}/g, (_, e) => {
      const mapped = [...e].map((c) => SUBSCRIPTS[c] ?? c).join("");
      return mapped;
    })
    .replace(/_([0-9a-z])/g, (_, c) => SUBSCRIPTS[c] ?? `_${c}`)

    // ── Greek letters ────────────────────────────────────────────────────
    .replace(/\\alpha/g, "α").replace(/\balpha\b/g, "α")
    .replace(/\\beta/g,  "β").replace(/\bbeta\b/g,  "β")
    .replace(/\\gamma/g, "γ").replace(/\bgamma\b/g, "γ")
    .replace(/\\delta/g, "δ").replace(/\bdelta\b/g, "δ")
    .replace(/\\Delta/g, "Δ").replace(/\bDelta\b/g, "Δ")
    .replace(/\\epsilon/g, "ε")
    .replace(/\\theta/g, "θ").replace(/\btheta\b/g, "θ")
    .replace(/\\lambda/g, "λ").replace(/\blambda\b/g, "λ")
    .replace(/\\mu/g,    "μ").replace(/\bmu\b/g,    "μ")
    .replace(/\\pi/g,    "π").replace(/\bpi\b/g,    "π")
    .replace(/\\sigma/g, "σ").replace(/\bsigma\b/g, "σ")
    .replace(/\\Sigma/g, "Σ").replace(/\bSigma\b/g, "Σ")
    .replace(/\\omega/g, "ω").replace(/\bomega\b/g, "ω")
    .replace(/\\phi/g,   "φ").replace(/\bphi\b/g,   "φ")
    .replace(/\\rho/g,   "ρ").replace(/\brho\b/g,   "ρ")
    .replace(/\\tau/g,   "τ").replace(/\btau\b/g,   "τ")

    // ── Operators ────────────────────────────────────────────────────────
    .replace(/>=/g,  "≥").replace(/\\geq/g,  "≥")
    .replace(/<=/g,  "≤").replace(/\\leq/g,  "≤")
    .replace(/!=/g,  "≠").replace(/\\neq/g,  "≠")
    .replace(/~=/g,  "≈").replace(/\\approx/g, "≈")
    .replace(/\\times/g, "×")
    .replace(/\\cdot/g,  "·")
    .replace(/\\div/g,   "÷")
    .replace(/\\infty/g, "∞").replace(/\binfty\b/g, "∞")
    .replace(/\\pm/g,    "±")
    .replace(/\\sum/g,   "Σ")
    .replace(/\\int/g,   "∫")
    .replace(/\\partial/g, "∂")
    .replace(/\\in\b/g,  "∈")
    .replace(/\\to\b/g,  "→").replace(/->/g, "→")
    .replace(/\\Rightarrow/g, "⇒")
    .replace(/\\forall/g, "∀")
    .replace(/\\exists/g, "∃")

    // ── Clean residual LaTeX braces and backslashes ──────────────────────
    .replace(/\{([^}]*)\}/g, "$1")
    .replace(/\\/g, "");
}
