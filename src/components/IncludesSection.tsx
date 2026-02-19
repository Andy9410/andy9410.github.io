import { GraduationCap, Sparkles, Check, Monitor } from "lucide-react";
import { motion } from "framer-motion";
import ScrollReveal from "@/components/ScrollReveal";
import { useState } from "react";
import CalendlyModal from "@/components/CalendlyModal";

const verticals = [
  {
    icon: GraduationCap,
    title: "Apoyo Académico",
    description:
      "Mentoría 1 a 1 para estudiantes universitarios de programación que necesitan preparación para parciales, exámenes o comprensión profunda de estructuras y algoritmos.",
    prices: [
      { label: "Hora individual", price: "450 UYU" },
      { label: "Pack 5 horas", price: "2.100 UYU", save: "Ahorrás 150 UYU" },
      { label: "Pack 10 horas", price: "3.800 UYU", save: "Ahorrás 700 UYU" },
    ],
    cta: "Reservar sesión",
    accent: "border-accent hover:shadow-accent/10",
    btnClass: "bg-accent text-accent-foreground hover:bg-accent/90",
  },
  {
    icon: Monitor,
    title: "Carrera IT",
    description:
      "Formación completa en desarrollo web desde cero hasta nivel profesional, con foco en proyectos reales y empleabilidad. Precio especial de lanzamiento.",
    prices: [
      { label: "Nivel 1 (lanzamiento)", price: "11.900 UYU", save: "Precio especial" },
      { label: "Nivel 2 (lanzamiento)", price: "15.900 UYU", save: "Precio especial" },
      { label: "Pack 1+2 (lanzamiento)", price: "23.900 UYU", save: "Mejor valor" },
    ],
    cta: "Quiero anotarme",
    accent: "border-primary hover:shadow-primary/10",
    btnClass: "bg-primary text-primary-foreground hover:bg-primary/90",
  },
  {
    icon: Sparkles,
    title: "Alfabetización en IA",
    description:
      "Entrenamiento práctico de alfabetización en Inteligencia Artificial para estudiantes y profesionales que quieren aprender a usar la IA de forma efectiva y aplicada en su estudio y trabajo diario.",
    prices: [
      { label: "Programa completo", price: "7900 UYU" },
    ],
    cta: "Comenzar ahora",
    accent: "border-accent hover:shadow-accent/10",
    btnClass: "bg-accent text-accent-foreground hover:bg-accent/90",
  },
];

const IncludesSection = () => {
  const [calendlyOpen, setCalendlyOpen] = useState(false);

  return (
    <section id="incluye" className="section-padding bg-background" aria-labelledby="precios-heading">
      <div className="container-narrow">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto">
            <h2 id="precios-heading" className="text-3xl font-extrabold sm:text-4xl">
              Planes y precios
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Elegí la vertical que se ajuste a tu objetivo. Todos los planes incluyen sesiones individuales por videollamada y soporte entre clases.
            </p>
          </div>
        </ScrollReveal>

        <div className="mt-14 grid gap-6 md:gap-8 md:grid-cols-3">
          {verticals.map((v, i) => (
            <ScrollReveal key={v.title} delay={i * 0.15}>
              <motion.div
                whileHover={{ y: -6, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={`relative flex h-full flex-col rounded-2xl border p-6 sm:p-8 transition-shadow hover:shadow-xl ${v.accent}`}
              >
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                  <v.icon className="h-6 w-6 text-primary" />
                </div>

                <h3 className="text-xl font-bold text-primary">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.description}</p>

                <div className="mt-6 flex-1 space-y-3">
                  {v.prices.map((p) => (
                    <div
                      key={p.label}
                      className="flex items-center justify-between gap-2 rounded-lg bg-secondary/60 px-4 py-3"
                    >
                      <div>
                        <span className="text-sm font-medium text-foreground">{p.label}</span>
                        {p.save && (
                          <span className="ml-2 text-xs text-accent font-medium">
                            {p.save}
                          </span>
                        )}
                      </div>
                      <span className="text-base font-bold text-primary whitespace-nowrap">{p.price}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setCalendlyOpen(true)}
                  className={`mt-6 w-full rounded-xl py-3 text-sm font-semibold transition-colors ${v.btnClass}`}
                >
                  {v.cta}
                </button>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={0.3}>
          <div className="mx-auto mt-12 flex max-w-2xl items-start gap-3 rounded-xl border border-accent-border bg-accent-soft p-5">
            <Check className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-primary">Primera consulta gratuita:</span> Agendamos 30 minutos para conocernos, evaluar tu nivel y definir un plan de estudio personalizado.
            </p>
          </div>
        </ScrollReveal>
      </div>

      <CalendlyModal open={calendlyOpen} onOpenChange={setCalendlyOpen} />
    </section>
  );
};

export default IncludesSection;
