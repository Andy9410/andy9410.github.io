import ScrollReveal from "@/components/ScrollReveal";

const CTASection = () => (
  <section id="contacto" className="section-padding bg-primary">
    <div className="container-narrow text-center">
      <ScrollReveal>
        <h2 className="text-3xl font-extrabold text-primary-foreground sm:text-4xl">
          ¿Listo para dar el primer paso?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
          Agendá una llamada gratuita de 30 minutos. Sin compromiso, sin presión. Solo una conversación para entender tu situación y ver cómo puedo ayudarte.
        </p>
        <a
          href="https://wa.me/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex rounded-lg bg-accent px-8 py-3.5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
        >
          Agendar llamada gratuita
        </a>
      </ScrollReveal>
    </div>
  </section>
);

export default CTASection;
