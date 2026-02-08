import { Code2 } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border bg-background py-12">
    <div className="container-narrow">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Code2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-primary">LearnSoft</span>
        </div>
        <p className="max-w-md text-sm text-muted-foreground">
          Tutorías personalizadas en programación, desarrollo web e inteligencia artificial para adultos.
        </p>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} LearnSoft. Todos los derechos reservados.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
