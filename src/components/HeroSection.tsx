import { GraduationCap, Building2, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import ScrollReveal from "@/components/ScrollReveal";

const services = [
  {
    icon: GraduationCap,
    title: "Apoyo Universitario",
    description: "Preparación de parciales y exámenes para FING, ORT, UCU y más.",
    href: "/apoyo-universitario",
    accent: false,
  },
  {
    icon: Building2,
    title: "Carrera IT",
    description: "Reconversión laboral con foco en empleabilidad y portafolio.",
    href: "/carrera-it",
    accent: true,
  },
  {
    icon: Sparkles,
    title: "IA para Adultos",
    description: "Aprende a usar ChatGPT, generar imágenes y no quedarte atrás.",
    href: "/ia-para-adultos",
    accent: false,
  },
];

const HeroSection = () => (
  <section className="section-padding bg-background">
    <div className="container-narrow text-center">
      <ScrollReveal>
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-2">
          <span className="h-2 w-2 rounded-full bg-accent" />
          <span className="text-sm font-medium text-muted-foreground">Clases 1:1 por videollamada</span>
        </div>

        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl md:text-6xl">
          Aprende desarrollo de software{" "}
          <span className="text-accent">con acompañamiento real</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Tutorías personalizadas adaptadas a tu objetivo: aprobar la facultad o iniciar tu carrera en tecnología.
        </p>
      </ScrollReveal>

      <div className="mt-16 grid gap-6 sm:grid-cols-3">
        {services.map((s, i) => (
          <ScrollReveal key={s.title} delay={i * 0.1}>
            <Link
              to={s.href}
              className={`group block rounded-xl border p-6 text-left transition-all hover:shadow-lg ${
                s.accent ? "border-accent bg-background shadow-md" : "border-border bg-background hover:border-accent/50"
              }`}
            >
              <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg ${s.accent ? "bg-accent-soft" : "bg-secondary"}`}>
                <s.icon className={`h-6 w-6 ${s.accent ? "text-accent" : "text-primary"}`} />
              </div>
              <h3 className="text-lg font-semibold text-primary">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent transition-transform group-hover:translate-x-1">
                Ver más <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </ScrollReveal>
        ))}
      </div>
    </div>
  </section>
);

export default HeroSection;
