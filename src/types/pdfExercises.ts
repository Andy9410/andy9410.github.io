import type { BBox } from "@/types/chat";

export interface ExerciseLocation {
  pageNumber: number;
  boundingBox?: BBox;
}

export type DetectedExercise = {
  id: string;
  title: string;
  pageNumber: number;
  text: string;
  boundingBox?: BBox;
};
