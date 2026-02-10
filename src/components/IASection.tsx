import { Sparkles, MessageCircle, Lightbulb, Image, Bot, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import ScrollReveal from "@/components/ScrollReveal";

const topics = [
  { icon: MessageCircle, title: "Uso de ChatGPT y asistentes", desc: "Aprende a conversar con IA para obtener respuestas útiles en tu día a día." },
  { icon: Lightbulb, title: "El arte de los prompts", desc: "Domina la técnica de hacer preguntas claras para obtener mejores resultados." },
  { icon: Image, title: "Generación de imágenes", desc: "Crea imágenes con DALL-E, Midjourney y otras herramientas visuales." },
  { icon: Bot, title: "Agentes e integración diaria", desc: "Descubre cómo los agentes de IA pueden automatizar tareas repetitivas." },
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

const IASection = () => (
  <section id="ia" className="section-padding bg-section-alt" aria-labelledby="ia-heading">
    <div className="container-narrow">
      <div className="grid items-start gap-12 lg:grid-cols-2">
        <ScrollReveal>
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent-border bg-accent-soft px-4 py-1.5">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-sm font-semibold text-accent">Nueva vertical</span>
            </div>

            <h2 id="ia-heading" className="text-3xl font-extrabold leading-tight sm:text-4xl">
              Alfabetización en IA para adultos que no quieren quedarse atrás
            </h2>

            <p className="mt-4 text-muted-foreground">
              La inteligencia artificial ya está aquí. No necesitas ser programador para usarla a tu favor. Aprende a comunicarte con las herramientas que están transformando el mundo laboral.
            </p>

            <div className="mt-8 space-y-6">
              {topics.map((t) => (
                <div key={t.title} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                    <t.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-primary">{t.title}</h4>
                    <p className="text-sm text-muted-foreground">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link to="/ia-para-adultos" className="mt-8 inline-flex rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90">
              Conocer más
            </Link>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <div className="rounded-xl border border-border bg-card p-8">
            <div className="mb-6 flex items-center gap-2">
              <Zap className="h-5 w-5 text-accent" />
              <h3 className="text-lg font-bold">¿Qué vas a aprender?</h3>
            </div>

            <div className="space-y-2">
              {learnItems.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-lg bg-accent-soft px-4 py-3">
                  <Sparkles className="h-4 w-4 shrink-0 text-accent" />
                  <span className="text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-lg bg-accent-soft border border-accent-border p-4">
              <p className="text-sm">
                <span className="font-semibold text-accent">Ideal para:</span>{" "}
                <span className="text-muted-foreground">Profesionales, emprendedores y cualquier persona que quiera entender y usar IA sin necesidad de conocimientos técnicos previos.</span>
              </p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  </section>
);

export default IASection;
