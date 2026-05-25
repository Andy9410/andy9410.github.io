import * as Sentry from "@sentry/react";
import { createRoot } from "react-dom/client";
import { pdfjs } from "react-pdf";
import App from "./App.tsx";
import "./index.css";

// Worker de pdf.js: import local por Vite para evitar CDNs externos.
// Debe estar en el entry point (no en componentes lazy) para evitar
// race conditions con React.lazy.
import workerUrl from "react-pdf/node_modules/pdfjs-dist/build/pdf.worker.min.mjs?url";
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

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
