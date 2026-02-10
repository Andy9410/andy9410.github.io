import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CTASection from "@/components/CTASection";
import ScrollReveal from "@/components/ScrollReveal";
import { Sparkles, MessageCircle, Lightbulb, Image, Bot, Zap, Shield, TrendingUp, CheckCircle2 } from "lucide-react";

const modules = [
  { icon: MessageCircle, title: "Uso de ChatGPT y asistentes", desc: "Aprende a conversar con IA para obtener respuestas útiles en tu día a día laboral y personal. Desde consultas simples hasta tareas complejas." },
  { icon: Lightbulb, title: "El arte de los prompts", desc: "Domina la técnica de hacer preguntas claras y estructuradas para obtener mejores resultados. La diferencia entre un prompt malo y uno bueno es enorme." },
  { icon: Image, title: "Generación de imágenes", desc: "Crea imágenes profesionales con DALL-E, Midjourney y otras herramientas. Para presentaciones, redes sociales o proyectos creativos." },
  { icon: Bot, title: "Agentes e integración diaria", desc: "Descubre cómo los agentes de IA pueden automatizar tareas repetitivas y ahorrarte horas de trabajo cada semana." },
  { icon: Shield, title: "Privacidad y seguridad", desc: "Entiende qué datos compartís con las herramientas de IA, cómo proteger tu información y usar la tecnología de forma responsable." },
  { icon: TrendingUp, title: "Mantenerte actualizado", desc: "El mundo de la IA cambia cada semana. Te enseño cómo mantenerte al día sin agobiarte ni perder tiempo." },
];

const learnItems = [
  "Qué es la IA y cómo funciona (sin tecnicismos)",
  "Cómo usar ChatGPT efectivamente",
  "Escribir prompts que funcionan",
  "Generar imágenes con IA",
  "Automatizar tareas cotidianas",
  "Herramientas de IA para el trabajo",
  "Privacidad y seguridad al usar IA",
  "Mantenerte actualizado sin agobiarte",
];

const IAPage = () => (
  <div className="min-h-screen">
    <Navbar />
    <main>
      {/* Hero */}
      <section className="section-padding bg-background">
        <div className="container-narrow">
          <ScrollReveal>
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent-border bg-accent-soft px-4 py-1.5">
                <Sparkles className="h-4 w-4 text-accent" />
                <span className="text-sm font-semibold text-accent">IA al alcance</span>
              </div>
              <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl md:text-6xl">
                Alfabetización en IA para adultos <span className="text-accent">que no quieren quedarse atrás</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground">
                La inteligencia artificial ya está aquí. No necesitas ser programador para usarla a tu favor. Aprende a comunicarte con las herramientas que están transformando el mundo laboral.
              </p>
              <a href="#contacto" className="mt-8 inline-flex rounded-lg bg-accent px-8 py-3.5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90">
                Quiero aprender IA
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Qué vas a aprender */}
      <section className="section-padding bg-section-alt">
        <div className="container-narrow">
          <ScrollReveal>
            <h2 className="text-center text-3xl font-extrabold sm:text-4xl">¿Qué vas a aprender?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
              Un recorrido práctico y sin tecnicismos por las herramientas de IA más útiles del momento.
            </p>
          </ScrollReveal>

          <div className="mx-auto mt-14 max-w-2xl">
            <ScrollReveal delay={0.1}>
              <div className="rounded-xl border border-border bg-card p-8">
                <div className="mb-6 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-accent" />
                  <h3 className="text-lg font-bold">Temario completo</h3>
                </div>
                <div className="space-y-2">
                  {learnItems.map((item) => (
                    <div key={item} className="flex items-center gap-3 rounded-lg bg-accent-soft px-4 py-3">
                      <Sparkles className="h-4 w-4 shrink-0 text-accent" />
                      <span className="text-sm font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Módulos */}
      <section className="section-padding bg-background">
        <div className="container-narrow">
          <ScrollReveal>
            <h2 className="text-center text-3xl font-extrabold sm:text-4xl">Módulos en detalle</h2>
          </ScrollReveal>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((m, i) => (
              <ScrollReveal key={m.title} delay={i * 0.1}>
                <div className="h-full rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent-soft">
                    <m.icon className="h-6 w-6 text-accent" />
                  </div>
                  <h4 className="font-semibold text-primary">{m.title}</h4>
                  <p className="mt-2 text-sm text-muted-foreground">{m.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Para quién */}
      <section className="section-padding bg-section-alt">
        <div className="container-narrow">
          <ScrollReveal>
            <div className="mx-auto max-w-2xl rounded-xl border border-accent-border bg-card p-8">
              <h3 className="text-center text-2xl font-bold">Ideal para</h3>
              <div className="mt-6 space-y-3">
                {[
                  "Profesionales que quieren integrar IA a su trabajo",
                  "Emprendedores buscando ventaja competitiva",
                  "Personas curiosas que no quieren quedarse atrás",
                  "Adultos sin conocimientos técnicos previos",
                  "Equipos que necesitan capacitación en IA",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-lg bg-accent-soft px-4 py-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-accent" />
                    <span className="text-sm font-medium">{item}</span>
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

export default IAPage;
