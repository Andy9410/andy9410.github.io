import { Lightbulb, BookOpen, Clock, CheckCircle2, GraduationCap, CalendarDays, FileSearch } from "lucide-react";
import { Link } from "react-router-dom";
import ScrollReveal from "@/components/ScrollReveal";

const faculties = ["FING (Udelar)", "ORT", "UCU", "UTU", "Otras privadas"];
const topics = ["Programación 1 y 2", "Algoritmos", "Estructuras de datos", "POO", "Bases de datos", "Diseño de software"];

const features = [
  { icon: Lightbulb, title: "Comprensión profunda", desc: "No memorizamos soluciones. Trabajamos hasta que entiendas el porqué." },
  { icon: BookOpen, title: "Práctica con ejercicios reales", desc: "Usamos parciales y exámenes anteriores de tu facultad." },
  { icon: Clock, title: "Horarios flexibles", desc: "Coordinamos según tu disponibilidad, incluso fines de semana." },
];

const ApoyoSection = () => (
  <section id="apoyo" className="section-padding bg-section-alt" aria-labelledby="apoyo-heading">
    <div className="container-narrow">
      <div className="grid items-start gap-12 lg:grid-cols-2">
        <ScrollReveal>
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-warning-border bg-warning-soft px-4 py-1.5">
              <GraduationCap className="h-4 w-4 text-warning" />
              <span className="text-sm font-semibold text-warning">Para estudiantes universitarios</span>
            </div>

            <h2 id="apoyo-heading" className="text-3xl font-extrabold leading-tight sm:text-4xl">
              Apoyo académico para aprobar tus materias de programación
            </h2>

            <p className="mt-4 text-muted-foreground">
              Tutorías individuales diseñadas para ayudarte a comprender los conceptos más complejos y llegar preparado a tus exámenes.
            </p>

            {/* Subservicios */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <article className="rounded-xl border border-border bg-card p-5">
                <div className="mb-3 flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-warning" />
                  <h3 className="text-sm font-bold text-primary">Curso con seguimiento</h3>
                </div>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-warning" />Acompañamiento durante la cursada</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-warning" />Clases regulares semanales</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-warning" />Resolución de dudas en tiempo real</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-warning" />Seguimiento del progreso</li>
                </ul>
              </article>

              <article className="rounded-xl border border-accent-border bg-card p-5">
                <div className="mb-3 flex items-center gap-2">
                  <FileSearch className="h-5 w-5 text-accent" />
                  <h3 className="text-sm font-bold text-primary">Preparación de exámenes</h3>
                </div>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />Enfoque intensivo pre-examen</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />Resolución de parciales reales</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />Estrategias de estudio efectivas</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />Refuerzo de conceptos clave</li>
                </ul>
              </article>
            </div>

            <div className="mt-8 space-y-6">
              {features.map((f) => (
                <div key={f.title} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warning-soft">
                    <f.icon className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-primary">{f.title}</h4>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link to="/apoyo-universitario" className="mt-8 inline-flex rounded-lg bg-warning px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-warning/90">
              Conocer más
            </Link>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <div className="rounded-xl border border-border bg-card p-8">
            <div className="mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold">Carreras y facultades que cubrimos</h3>
            </div>

            <div className="space-y-2">
              {faculties.map((f) => (
                <div key={f} className="flex items-center gap-3 rounded-lg bg-secondary px-4 py-3">
                  <CheckCircle2 className="h-5 w-5 text-accent" />
                  <span className="font-medium">{f}</span>
                </div>
              ))}
            </div>

            <p className="mt-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">Temas principales</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {topics.map((t) => (
                <span key={t} className="rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium">{t}</span>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  </section>
);

export default ApoyoSection;
