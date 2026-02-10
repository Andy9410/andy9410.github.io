import { Users, Target, MessageSquare, Compass } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

const points = [
  { icon: Users, text: "Sesiones 1:1 adaptadas a tu perfil, ritmo y objetivos" },
  { icon: Target, text: "Plan personalizado según tu situación académica o profesional" },
  { icon: MessageSquare, text: "Seguimiento continuo entre clases con soporte por WhatsApp" },
  { icon: Compass, text: "Orientación académica y profesional para tomar mejores decisiones" },
];

const MentoriaSection = () => (
  <section id="mentoria" className="section-padding bg-section-alt" aria-labelledby="mentoria-heading">
    <div className="container-narrow">
      <ScrollReveal>
        <div className="mx-auto max-w-3xl text-center">
          <h2 id="mentoria-heading" className="text-3xl font-extrabold sm:text-4xl">
            Mentoría personalizada en cada paso
          </h2>
          <p className="mt-4 text-muted-foreground">
            No es solo una clase: es un acompañamiento real, continuo y adaptado a vos. Trabajo con cada estudiante de forma individual para asegurar que avance con confianza.
          </p>
        </div>
      </ScrollReveal>

      <div className="mt-14 grid gap-6 sm:grid-cols-2">
        {points.map((p, i) => (
          <ScrollReveal key={p.text} delay={i * 0.1}>
            <div className="flex gap-4 rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent-soft">
                <p.icon className="h-6 w-6 text-accent" />
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground font-medium self-center">{p.text}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </div>
  </section>
);

export default MentoriaSection;
