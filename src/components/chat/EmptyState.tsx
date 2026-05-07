import { Sparkles, BookOpen, Code2, Calculator } from "lucide-react";

const suggestions = [
  { icon: Calculator, text: "Ayudame a entender derivadas implícitas" },
  { icon: Code2, text: "¿Qué es la programación orientada a objetos?" },
  { icon: BookOpen, text: "Explicame el teorema de Bayes con ejemplos" },
  { icon: Sparkles, text: "¿Cómo estudio mejor para un parcial?" },
];

interface Props {
  onSuggestion: (text: string) => void;
}

const EmptyState = ({ onSuggestion }: Props) => (
  <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-16 text-center">
    <div className="space-y-3">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 ring-1 ring-accent/20">
        <Sparkles className="h-8 w-8 text-accent" />
      </div>
      <h2 className="text-xl font-bold text-primary">¿En qué puedo ayudarte hoy?</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        Soy tu tutor personal de LearnSoft. Preguntame sobre matemáticas, programación, ciencias o cualquier materia de tu carrera.
      </p>
    </div>

    <div className="grid w-full max-w-lg gap-2.5 sm:grid-cols-2">
      {suggestions.map(({ icon: Icon, text }) => (
        <button
          key={text}
          onClick={() => onSuggestion(text)}
          className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left text-sm font-medium text-foreground transition-all hover:border-accent/40 hover:bg-accent-soft hover:shadow-sm active:scale-[0.98]"
        >
          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <span className="leading-snug">{text}</span>
        </button>
      ))}
    </div>
  </div>
);

export default EmptyState;
