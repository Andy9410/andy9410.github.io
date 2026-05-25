import * as Sentry from "@sentry/react";
import { createRoot } from "react-dom/client";
import { pdfjs } from "react-pdf";
import App from "./App.tsx";
import "./index.css";

// Worker de pdf.js vía cdnjs para producción.
// El import local con Vite fallaba en Fly.io porque el MIME type
// de .mjs no se servía correctamente.
// Usamos CDN en vez de import local para evitar ese problema.
pdfjs.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  enabled: import.meta.env.PROD,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

createRoot(document.getElementById("root")!).render(<App />);
