import { pdfjs } from "react-pdf";
import workerUrl from "react-pdf/node_modules/pdfjs-dist/build/pdf.worker.min.mjs?url";

export const pdfWorkerSrc = workerUrl;

export function configurePdfWorker() {
  if (pdfjs.GlobalWorkerOptions.workerSrc !== pdfWorkerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;
  }

  return pdfWorkerSrc;
}

configurePdfWorker();
