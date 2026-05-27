import type { DetectedExercise } from "@/types/pdfExercises";

const BASE_URL = import.meta.env.VITE_DOCUMENT_API_URL ?? "http://localhost:8083";

export interface DocumentOut {
  id: number;
  filename: string;
  file_type: string;
  upload_date: string;
  page_count: number | null;
  chunk_count: number;
  download_available?: boolean;
}

export interface UploadResult {
  document_id: number | null;
  filename: string;
  chunk_count: number;
  page_count: number | null;
  file_type: string | null;
  status: string;
  message: string | null;
}

async function docFetch(path: string, token: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) throw new Error(`${res.status}`);
  return res;
}

export async function uploadDocuments(files: File[], token: string): Promise<UploadResult[]> {
  const form = new FormData();
  for (const file of files) form.append("files", file);

  const res = await docFetch("/documents/upload", token, {
    method: "POST",
    body: form,
  });
  return res.json() as Promise<UploadResult[]>;
}

export async function listDocuments(token: string): Promise<DocumentOut[]> {
  const res = await docFetch("/documents", token);
  return res.json() as Promise<DocumentOut[]>;
}

export async function deleteDocumentApi(id: number, token: string): Promise<void> {
  await docFetch(`/documents/${id}`, token, { method: "DELETE" });
}

export interface ExerciseOut {
  number: string;
  page: number;
  bbox?: { x0: number; y0: number; x1: number; y1: number };
  title?: string;
}

export async function listExercises(documentId: number, token: string): Promise<ExerciseOut[]> {
  const res = await docFetch(`/documents/${documentId}/exercises`, token);
  return res.json() as Promise<ExerciseOut[]>;
}

export function exerciseOutToDetected(exercise: ExerciseOut): DetectedExercise {
  return {
    id: exercise.number,
    title: exercise.title || `Ejercicio ${exercise.number}`,
    pageNumber: exercise.page,
    text: exercise.title || `Ejercicio ${exercise.number}`,
    boundingBox: exercise.bbox,
  };
}
