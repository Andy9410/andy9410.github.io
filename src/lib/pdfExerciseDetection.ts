import { pdfjs } from "react-pdf";
import type { TextItem } from "pdfjs-dist/types/src/display/api";
import type { BBox } from "@/types/chat";
import type { DetectedExercise } from "@/types/pdfExercises";

type PdfTextLine = {
  text: string;
  pageNumber: number;
  bbox: BBox;
};

type TextRun = {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

const TITLED_EXERCISE_RE =
  /\b(?:ejercicio|ej\.?|problema|exercise|problem)\s*(?:n[°ºo.]?\s*)?([0-9]+(?:\.[0-9]+)*(?:\.[a-z])?|[0-9]+\.[a-z])\b/i;

const NUMBERED_EXERCISE_RE =
  /^\s*(?:\(?)([0-9]+(?:\.[0-9]+)*(?:\.[a-z])?|[0-9]+\.[a-z])(?:\)?[).:-]?|\s+[.-])\s+(.{3,})/i;

function normalizeExerciseId(value: string) {
  return value.trim().replace(/\.$/, "").toLowerCase();
}

function exerciseTitle(line: string, id: string) {
  const trimmed = line.replace(/\s+/g, " ").trim();
  if (TITLED_EXERCISE_RE.test(trimmed)) return trimmed;
  return `Ejercicio ${id}`;
}

function findExerciseId(line: string) {
  const titled = line.match(TITLED_EXERCISE_RE);
  if (titled?.[1]) return normalizeExerciseId(titled[1]);

  const numbered = line.match(NUMBERED_EXERCISE_RE);
  if (!numbered?.[1]) return null;

  const id = normalizeExerciseId(numbered[1]);
  const body = numbered[2]?.trim() ?? "";

  if (!body || body.length < 3) return null;
  return id;
}

function itemToRun(item: TextItem): TextRun {
  const [, , , d, e, f] = item.transform;
  const height = Math.max(Math.abs(d), item.height || 10);

  return {
    text: item.str,
    x: e,
    y: f,
    width: item.width,
    height,
  };
}

function mergeRunsIntoLines(runs: TextRun[], pageNumber: number): PdfTextLine[] {
  const sorted = [...runs].sort((a, b) => {
    if (Math.abs(b.y - a.y) > 4) return b.y - a.y;
    return a.x - b.x;
  });

  const lines: TextRun[][] = [];

  for (const run of sorted) {
    if (!run.text.trim()) continue;
    const line = lines.find((candidate) => Math.abs(candidate[0].y - run.y) <= 4);
    if (line) {
      line.push(run);
    } else {
      lines.push([run]);
    }
  }

  return lines
    .map((lineRuns) => {
      const ordered = [...lineRuns].sort((a, b) => a.x - b.x);
      const text = ordered.map((run) => run.text).join(" ").replace(/\s+/g, " ").trim();
      const x0 = Math.min(...ordered.map((run) => run.x));
      const x1 = Math.max(...ordered.map((run) => run.x + run.width));
      const y0 = Math.min(...ordered.map((run) => run.y - run.height * 0.3));
      const y1 = Math.max(...ordered.map((run) => run.y + run.height));

      return {
        text,
        pageNumber,
        bbox: { x0, y0, x1, y1 },
      };
    })
    .filter((line) => line.text.length > 0);
}

export async function detectExercisesFromPdf(
  pdfData: Uint8Array,
): Promise<DetectedExercise[]> {
  const task = pdfjs.getDocument({ data: pdfData.slice() });
  const document = await task.promise;

  try {
    const detected = new Map<string, DetectedExercise>();

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const runs = textContent.items
        .filter((item): item is TextItem => "str" in item)
        .map(itemToRun);

      const lines = mergeRunsIntoLines(runs, pageNumber);

      for (const line of lines) {
        const exerciseId = findExerciseId(line.text);
        if (!exerciseId || detected.has(exerciseId)) continue;

        detected.set(exerciseId, {
          id: exerciseId,
          title: exerciseTitle(line.text, exerciseId),
          pageNumber,
          text: line.text,
          boundingBox: line.bbox,
        });
      }
    }

    return Array.from(detected.values()).sort((a, b) => {
      if (a.pageNumber !== b.pageNumber) return a.pageNumber - b.pageNumber;
      return a.id.localeCompare(b.id, undefined, { numeric: true });
    });
  } finally {
    document.destroy();
  }
}

export function mergeDetectedExercises(
  primary: DetectedExercise[],
  secondary: DetectedExercise[],
) {
  const byId = new Map<string, DetectedExercise>();

  for (const exercise of [...secondary, ...primary]) {
    byId.set(exercise.id, {
      ...byId.get(exercise.id),
      ...exercise,
      boundingBox: exercise.boundingBox ?? byId.get(exercise.id)?.boundingBox,
    });
  }

  return Array.from(byId.values()).sort((a, b) => {
    if (a.pageNumber !== b.pageNumber) return a.pageNumber - b.pageNumber;
    return a.id.localeCompare(b.id, undefined, { numeric: true });
  });
}
