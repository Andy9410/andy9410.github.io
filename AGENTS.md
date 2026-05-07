# Learnsoft — Frontend

Landing page de academia de programación. React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui.

## Stack

- **Framework:** React 18 + TypeScript
- **Build:** Vite
- **Estilos:** Tailwind CSS + shadcn/ui (componentes en `src/components/ui/`)
- **Routing:** React Router v6
- **Server state:** TanStack Query
- **Formularios:** react-hook-form + Zod
- **Animaciones:** framer-motion (ScrollReveal)
- **Scheduling:** react-calendly

## Estructura

```
src/
├── pages/          # Index, IAPage, CarreraPage, ApoyoPage, NotFound
├── components/     # Secciones de la landing (Hero, Navbar, Footer, CTA…)
│   └── ui/         # Primitivas shadcn/ui — no editar directamente
├── config/         # calendly.ts
├── hooks/          # use-mobile, use-toast
└── lib/            # utils.ts (cn helper)
```

## Comandos

```bash
npm run dev       # servidor de desarrollo en localhost:8080
npm run build     # build de producción
npm run test      # tests con Vitest
npm run lint      # ESLint
```

## Convenciones

- Nuevos componentes de sección van en `src/components/`, no en `ui/`.
- Usar el helper `cn()` de `src/lib/utils.ts` para clases condicionales con Tailwind.
- Los colores y espaciados semánticos (`accent`, `section-alt`, `container-narrow`) están definidos en `tailwind.config.ts` — usarlos en lugar de valores hardcoded.
- Envolver bloques que deben animarse al hacer scroll en `<ScrollReveal>`.
- Para añadir páginas nuevas: crear el componente en `src/pages/` y registrar la ruta en `src/App.tsx`.
- Los componentes shadcn/ui se agregan con `npx shadcn-ui add <componente>`, nunca copiando a mano.
