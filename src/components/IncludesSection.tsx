import { Video, CalendarDays, FileText, MessageSquare, CheckCircle2 } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

const benefits = [
  { icon: Video, title: "Clases por videollamada 1:1", desc: "Sesiones individuales de 1 hora por Google Meet o Zoom. Tú y yo, sin distracciones." },
  { icon: CalendarDays, title: "Horarios a tu medida", desc: "Coordinamos según tu disponibilidad. Mañana, tarde, noche o fines de semana." },
  { icon: FileText, title: "Material de apoyo incluido", desc: "Ejercicios, guías y recursos adicionales para que practiques entre sesiones." },
  { icon: MessageSquare, title: "Soporte entre clases", desc: "Consultas rápidas por WhatsApp para que no te quedes trabado." },
];

const plans = [
  { classes: "1 clase", price: "UYU $800", note: "Ideal para probar", featured: false },
  { classes: "4 clases", price: "UYU $2.800", note: "1 mes de acompañamiento", featured: true },
  { classes: "8 clases", price: "UYU $5.200", note: "2 meses intensivos", featured: false },
];

const IncludesSection = () => (
  <section id="incluye" className="section-padding bg-background" aria-labelledby="incluye-heading">
    <div className="container-narrow">
      <ScrollReveal>
        <div className="text-center">
          <h2 id="incluye-heading" className="text-3xl font-extrabold sm:text-4xl">¿Qué incluye exactamente?</h2>
          <p className="mt-4 text-muted-foreground">Transparencia total. Esto es lo que obtienes al tomar clases conmigo.</p>
        </div>
      </ScrollReveal>

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {benefits.map((b, i) => (
          <ScrollReveal key={b.title} delay={i * 0.1}>
            <div className="h-full rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
                <b.icon className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold text-primary">{b.title}</h4>
              <p className="mt-2 text-sm text-muted-foreground">{b.desc}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>

      <ScrollReveal delay={0.2}>
        <div className="mx-auto mt-20 max-w-3xl rounded-xl border border-border bg-card p-8">
          <h3 className="text-center text-2xl font-bold">Planes simples, sin letra chica</h3>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.classes}
                className={`rounded-xl border p-6 text-center transition-shadow ${
                  p.featured ? "border-accent shadow-lg" : "border-border"
                }`}
              >
                <p className="text-sm text-muted-foreground">{p.classes}</p>
                <p className="mt-2 text-2xl font-extrabold text-primary">{p.price}</p>
                <p className="mt-1 text-xs text-muted-foreground">{p.note}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-lg bg-accent-soft p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-primary">Primera clase gratuita:</span> Agendamos 30 minutos para conocernos, evaluar tu nivel y definir un plan de estudio personalizado.
            </p>
          </div>
        </div>
      </ScrollReveal>
    </div>
  </section>
);

export default IncludesSection;
