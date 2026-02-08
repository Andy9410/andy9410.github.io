import { Building2, Target, FolderOpen, Users, Monitor } from "lucide-react";
import { Link } from "react-router-dom";
import ScrollReveal from "@/components/ScrollReveal";

const steps = [
  { num: 1, title: "Fundamentos", desc: "HTML, CSS, JavaScript básico" },
  { num: 2, title: "Desarrollo Web", desc: "React, APIs, bases de datos" },
  { num: 3, title: "Proyectos reales", desc: "Portafolio con 2-3 proyectos" },
  { num: 4, title: "Búsqueda laboral", desc: "CV, LinkedIn, entrevistas" },
];

const highlights = [
  { icon: Target, title: "Enfoque en empleabilidad", desc: "Aprendes lo que las empresas realmente piden en entrevistas." },
  { icon: FolderOpen, title: "Portafolio desde el día 1", desc: "Construyes proyectos reales que puedes mostrar a empleadores." },
  { icon: Users, title: "Mentoría de carrera", desc: "Te ayudo a preparar tu CV, LinkedIn y entrevistas técnicas." },
];

const CarreraSection = () => (
  <section id="carrera" className="section-padding bg-background">
    <div className="container-narrow">
      <div className="grid items-start gap-12 lg:grid-cols-2">
        <ScrollReveal>
          <div className="rounded-xl border border-border bg-card p-8">
            <div className="mb-6 flex items-center gap-2">
              <Monitor className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold">Plan de estudio orientado a tu primer empleo</h3>
            </div>

            <div className="space-y-0">
              {steps.map((s, i) => (
                <div key={s.num} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">{s.num}</div>
                    {i < steps.length - 1 && <div className="w-0.5 flex-1 bg-accent/30" />}
                  </div>
                  <div className="pb-8">
                    <h4 className="font-semibold text-primary">{s.title}</h4>
                    <p className="text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-lg bg-accent-soft p-4">
              <p className="text-sm">
                <span className="font-semibold text-accent">Duración estimada:</span>{" "}
                <span className="text-muted-foreground">4-6 meses con dedicación de 10-15 horas semanales</span>
              </p>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent-border bg-accent-soft px-4 py-1.5">
              <Building2 className="h-4 w-4 text-accent" />
              <span className="text-sm font-semibold text-accent">Para reconversión laboral</span>
            </div>

            <h2 className="text-3xl font-extrabold leading-tight sm:text-4xl">
              Inicia tu carrera en tecnología con un plan claro
            </h2>

            <p className="mt-4 text-muted-foreground">
              Acompañamiento estructurado para adultos que quieren entrar al mundo IT. Sin requisitos previos, con foco en resultados.
            </p>

            <div className="mt-8 space-y-6">
              {highlights.map((h) => (
                <div key={h.title} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft">
                    <h.icon className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-primary">{h.title}</h4>
                    <p className="text-sm text-muted-foreground">{h.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link to="/carrera-it" className="mt-8 inline-flex rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90">
              Conocer más
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </div>
  </section>
);

export default CarreraSection;
