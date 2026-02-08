import { useState } from "react";
import { Code2, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";

const navLinks = [
  { label: "Apoyo Universitario", href: "/apoyo-universitario", isRoute: true },
  { label: "Carrera IT", href: "/carrera-it", isRoute: true },
  { label: "IA para Adultos", href: "/ia-para-adultos", isRoute: true },
  { label: "¿Qué incluye?", href: "#incluye", isRoute: false },
  { label: "Tu Mentor", href: "#mentor", isRoute: false },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <nav className="container-narrow flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Code2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-primary">LearnSoft</span>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((l) =>
            l.isRoute ? (
              <Link key={l.href} to={l.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                {l.label}
              </Link>
            ) : (
              <a key={l.href} href={l.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                {l.label}
              </a>
            )
          )}
        </div>

        <a href="#contacto" className="hidden rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 md:inline-flex">
          Empezar ahora
        </a>

        {/* Mobile toggle */}
        <button onClick={() => setOpen(!open)} className="md:hidden text-primary" aria-label="Menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-border bg-background px-4 pb-4 md:hidden">
          {navLinks.map((l) =>
            l.isRoute ? (
              <Link key={l.href} to={l.href} onClick={() => setOpen(false)} className="block py-3 text-sm font-medium text-muted-foreground">
                {l.label}
              </Link>
            ) : (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block py-3 text-sm font-medium text-muted-foreground">
                {l.label}
              </a>
            )
          )}
          <a href="#contacto" onClick={() => setOpen(false)} className="mt-2 block rounded-lg bg-primary px-5 py-2.5 text-center text-sm font-semibold text-primary-foreground">
            Empezar ahora
          </a>
        </div>
      )}
    </header>
  );
};

export default Navbar;
