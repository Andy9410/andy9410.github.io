import { Award, Briefcase, GraduationCap, Heart, Linkedin } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import mentorPhoto from "@/assets/mentor-photo.jpeg";

const milestones = [
  { icon: GraduationCap, label: "Formación universitaria en Ingeniería en Sistemas" },
  { icon: Briefcase, label: "+12 años de experiencia en desarrollo de software" },
  { icon: Award, label: "Mentor en empresa IT" },
  { icon: Heart, label: "Apasionado por acompañar procesos de aprendizaje en adultos" },
];

const MentorSection = () => (
  <section id="mentor" className="section-padding bg-section-alt" aria-labelledby="mentor-heading">
    <div className="container-narrow">
      <ScrollReveal>
        <div className="mx-auto max-w-3xl text-center">
          <h2 id="mentor-heading" className="text-3xl font-extrabold sm:text-4xl">
            Tu Mentor
          </h2>
          <p className="mt-4 text-muted-foreground">
            Conocé a la persona que te va a acompañar en cada paso del camino.
          </p>
        </div>
      </ScrollReveal>

      <div className="mt-14 flex flex-col items-center gap-10 md:flex-row md:items-start md:gap-14">
        {/* Photo */}
        <ScrollReveal className="shrink-0">
          <div className="relative mx-auto w-52 h-52 md:w-60 md:h-60 overflow-hidden rounded-2xl border-4 border-accent/30 shadow-lg">
            <img
              src={mentorPhoto}
              alt="Foto del mentor de LearnSoft"
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        </ScrollReveal>

        {/* Bio */}
        <ScrollReveal delay={0.15} className="flex-1 text-center md:text-left">
          <h3 className="text-2xl font-bold text-primary">Hola, soy tu mentor</h3>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            Mi nombre es Andy Barreiro, soy desarrollador de software con más de 12 años de experiencia en desarrollo y educación tecnológica.
            Mi objetivo es acompañarte en el salto hacia una carrera en IT o ayudarte a mejorar tu rendimiento académico,
            con un enfoque práctico, cercano y adaptado a tu ritmo.
          </p>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            Mi recorrido incluye trabajo en empresas de tecnología y en formación IT.
            Hoy acompaño a personas adultas en su proceso de aprendizaje,
            integrando experiencia real de la industria con pedagogía aplicada y acompañamiento personalizado.
          </p>

          {/* Milestones */}
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {milestones.map((m, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft">
                  <m.icon className="h-5 w-5 text-accent" />
                </div>
                <span className="text-sm font-medium text-muted-foreground leading-snug self-center">
                  {m.label}
                </span>
              </li>
            ))}
          </ul>

              <a
            href="https://www.linkedin.com/in/andybarreiro"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-primary shadow-sm transition-all hover:shadow-md hover:border-accent hover:text-accent"
          >
            <Linkedin className="h-4 w-4" />
            Conectar en LinkedIn
          </a>  


        </ScrollReveal>
      </div>
    </div>
  </section>
);

export default MentorSection;
