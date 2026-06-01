import { cn } from "@/lib/utils";

interface Props {
  onInsertSymbol: (symbol: string) => void;
  className?: string;
}

const SYMBOL_GROUPS = [
  {
    label: "Operadores",
    symbols: [
      { char: "+", label: "Suma" },
      { char: "−", label: "Resta" },
      { char: "×", label: "Multiplicación" },
      { char: "÷", label: "División" },
      { char: "=", label: "Igual" },
      { char: "≠", label: "Distinto" },
    ],
  },
  {
    label: "Relaciones",
    symbols: [
      { char: "<", label: "Menor que" },
      { char: ">", label: "Mayor que" },
      { char: "≤", label: "Menor o igual" },
      { char: "≥", label: "Mayor o igual" },
      { char: "±", label: "Más/menos" },
      { char: "≈", label: "Aproximado" },
    ],
  },
  {
    label: "Símbolos",
    symbols: [
      { char: "√", label: "Raíz cuadrada" },
      { char: "π", label: "Pi" },
      { char: "∞", label: "Infinito" },
      { char: "∑", label: "Sumatoria" },
      { char: "Δ", label: "Delta" },
      { char: "θ", label: "Theta" },
    ],
  },
  {
    label: "Letras griegas",
    symbols: [
      { char: "α", label: "Alfa" },
      { char: "β", label: "Beta" },
      { char: "γ", label: "Gamma" },
      { char: "λ", label: "Lambda" },
      { char: "μ", label: "Mu" },
      { char: "σ", label: "Sigma" },
    ],
  },
  {
    label: "Cálculo",
    symbols: [
      { char: "∫", label: "Integral" },
      { char: "∂", label: "Derivada parcial" },
      { char: "∇", label: "Nabla" },
      { char: "∈", label: "Pertenece" },
      { char: "∉", label: "No pertenece" },
      { char: "∀", label: "Para todo" },
    ],
  },
  {
    label: "Flechas",
    symbols: [
      { char: "→", label: "Flecha" },
      { char: "←", label: "Flecha izq." },
      { char: "⇒", label: "Implica" },
      { char: "⇔", label: "Si y solo si" },
      { char: "↦", label: "Asignación" },
      { char: "⟹", label: "Entonces" },
    ],
  },
];

export function MathSymbolPicker({ onInsertSymbol, className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start gap-3 border-t bg-muted/10 px-3 py-2",
        className
      )}
    >
      {SYMBOL_GROUPS.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
            {group.label}
          </span>
          <div className="flex flex-wrap gap-0.5">
            {group.symbols.map(({ char, label }) => (
              <button
                key={char}
                type="button"
                onClick={() => onInsertSymbol(char)}
                title={label}
                aria-label={`Insertar ${label}: ${char}`}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/50 bg-background text-sm text-foreground transition-all hover:border-accent hover:bg-accent/10 hover:text-accent hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 active:scale-95"
              >
                {char}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
