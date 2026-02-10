import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CTASection from "@/components/CTASection";
import ScrollReveal from "@/components/ScrollReveal";
import { GraduationCap, CheckCircle2, BookOpen, Lightbulb, Clock, Users, Target, FileText, CalendarDays, FileSearch } from "lucide-react";

const faculties = ["FING (Udelar)", "ORT", "UCU", "UTU", "Otras privadas"];
const topics = ["Programación 1 y 2", "Algoritmos", "Estructuras de datos", "POO", "Bases de datos", "Diseño de software", "Matemática discreta", "Lógica", "Arquitectura de computadoras"];

const benefits = [
  { icon: Lightbulb, title: "Comprensión profunda", desc: "No memorizamos soluciones. Trabajamos hasta que entiendas el porqué de cada concepto, para que puedas resolver cualquier variante en el examen." },
  { icon: BookOpen, title: "Práctica con ejercicios reales", desc: "Usamos parciales y exámenes anteriores de tu facultad. Simulamos condiciones reales para que llegues preparado." },
  { icon: Clock, title: "Horarios flexibles", desc: "Coordinamos según tu disponibilidad: mañana, tarde, noche o fines de semana. Tú eliges cuándo estudiar." },
  { icon: Users, title: "Sesiones 1:1 personalizadas", desc: "Cada clase se adapta a tu ritmo. No hay grupo que te frene ni que te apure." },
  { icon: Target, title: "Enfoque en tus debilidades", desc: "Identificamos exactamente qué temas te cuestan más y los atacamos con estrategia." },
  { icon: FileText, title: "Material complementario", desc: "Ejercicios adicionales, resúmenes y guías de estudio entre sesiones para que refuerces lo aprendido." },
];

const cursoItems = [
  "Acompañamiento durante toda la cursada",
  "Clases regulares semanales o quincenales",
  "Resolución de dudas en tiempo real",
  "Seguimiento del progreso y ajuste del plan",
  "Soporte por WhatsApp entre clases",
];

const examenItems = [
  "Enfoque intensivo previo al examen",
  "Resolución de parciales y exámenes reales",
  "Estrategias de estudio y gestión del tiempo",
  "Refuerzo de conceptos clave y debilidades",
  "Simulación de examen en condiciones reales",
];

const ApoyoPage = () => (
  <div className="min-h-screen">
    <Navbar />
    <main>
      {/* Hero */}
      <section className="section-padding bg-background" aria-labelledby="apoyo-hero-heading">
        <div className="container-narrow">
          <ScrollReveal>
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-warning-border bg-warning-soft px-4 py-1.5">
                <GraduationCap className="h-4 w-4 text-warning" />
                <span className="text-sm font-semibold text-warning">Para estudiantes universitarios</span>
              </div>
              <h1 id="apoyo-hero-heading" className="text-4xl font-extrabold leading-tight sm:text-5xl md:text-6xl">
                Apoyo académico para <span className="text-warning">aprobar tus materias</span> de programación
              </h1>
              <p className="mt-6 text-lg text-muted-foreground">
                Tutorías individuales diseñadas para ayudarte a comprender los conceptos más complejos y llegar preparado a tus exámenes. Sin importar tu facultad o carrera.
              </p>
              <a href="#contacto" className="mt-8 inline-flex rounded-lg bg-warning px-8 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-warning/90">
                Agendar clase de prueba
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Subservicios */}
      <section className="section-padding bg-section-alt" aria-labelledby="subservicios-heading">
        <div className="container-narrow">
          <ScrollReveal>
            <h2 id="subservicios-heading" className="text-center text-3xl font-extrabold sm:text-4xl">Dos formas de ayudarte</h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
              Elegí la modalidad que mejor se adapte a tu situación actual.
            </p>
          </ScrollReveal>

          <div className="mt-14 grid gap-8 sm:grid-cols-2">
            <ScrollReveal delay={0.1}>
              <article className="h-full rounded-xl border border-border bg-card p-8">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-warning-soft">
                  <CalendarDays className="h-6 w-6 text-warning" />
                </div>
                <h3 className="text-xl font-bold text-primary">Curso con seguimiento</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Acompañamiento continuo durante la cursada. Ideal si querés ir al día y no acumular dudas.
                </p>
                <ul className="mt-6 space-y-2">
                  {cursoItems.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <article className="h-full rounded-xl border border-accent-border bg-card p-8">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent-soft">
                  <FileSearch className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-xl font-bold text-primary">Preparación de exámenes</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Enfoque intensivo para llegar preparado al parcial o examen. Trabajamos con ejercicios reales de tu facultad.
                </p>
                <ul className="mt-6 space-y-2">
                  {examenItems.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Qué cubrimos */}
      <section className="section-padding bg-background" aria-labelledby="cubrimos-heading">
        <div className="container-narrow">
          <ScrollReveal>
            <h2 id="cubrimos-heading" className="text-center text-3xl font-extrabold sm:text-4xl">¿Qué cubrimos?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
              Trabajamos con las materias más exigentes de las carreras de informática e ingeniería en sistemas.
            </p>
          </ScrollReveal>

          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            <ScrollReveal delay={0.1}>
              <div className="rounded-xl border border-border bg-card p-8">
                <div className="mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-bold">Facultades y carreras</h3>
                </div>
                <div className="space-y-2">
                  {faculties.map((f) => (
                    <div key={f} className="flex items-center gap-3 rounded-lg bg-secondary px-4 py-3">
                      <CheckCircle2 className="h-5 w-5 text-accent" />
                      <span className="font-medium">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <div className="rounded-xl border border-border bg-card p-8">
                <div className="mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-bold">Materias y temas</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {topics.map((t) => (
                    <span key={t} className="rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium">
                      {t}
                    </span>
                  ))}
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  ¿Tu materia no está en la lista? Escribime y lo evaluamos juntos.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="section-padding bg-section-alt" aria-labelledby="beneficios-heading">
        <div className="container-narrow">
          <ScrollReveal>
            <h2 id="beneficios-heading" className="text-center text-3xl font-extrabold sm:text-4xl">¿Por qué estudiar conmigo?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
              No soy un profesor más. Soy alguien que pasó por lo mismo que vos y sabe exactamente qué necesitás para aprobar.
            </p>
          </ScrollReveal>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b, i) => (
              <ScrollReveal key={b.title} delay={i * 0.1}>
                <article className="h-full rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-warning-soft">
                    <b.icon className="h-6 w-6 text-warning" />
                  </div>
                  <h4 className="font-semibold text-primary">{b.title}</h4>
                  <p className="mt-2 text-sm text-muted-foreground">{b.desc}</p>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="section-padding bg-background" aria-labelledby="como-funciona-heading">
        <div className="container-narrow">
          <ScrollReveal>
            <div className="mx-auto max-w-2xl text-center">
              <h2 id="como-funciona-heading" className="text-3xl font-extrabold sm:text-4xl">¿Cómo funciona?</h2>
              <div className="mt-8 space-y-6 text-left">
                {[
                  { num: "1", title: "Escribime", desc: "Contame qué materia estás cursando, qué temas te cuestan y cuándo es tu próximo parcial." },
                  { num: "2", title: "Clase de prueba gratuita", desc: "Nos juntamos 30 minutos para conocernos, evaluar tu nivel y armar un plan." },
                  { num: "3", title: "Arrancamos", desc: "Empezamos con las clases regulares, enfocados en lo que necesitás para aprobar." },
                  { num: "4", title: "Seguimiento continuo", desc: "Entre clases tenés soporte por WhatsApp para consultas rápidas." },
                ].map((s, i) => (
                  <div key={s.num} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warning text-sm font-bold text-primary-foreground">{s.num}</div>
                      {i < 3 && <div className="w-0.5 flex-1 bg-warning/30" />}
                    </div>
                    <div className="pb-6">
                      <h4 className="font-semibold text-primary">{s.title}</h4>
                      <p className="text-sm text-muted-foreground">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <CTASection />
    </main>
    <Footer />
  </div>
);

export default ApoyoPage;
