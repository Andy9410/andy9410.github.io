import type { WhiteboardElement } from "./whiteboard";

export interface LessonStep {
  id: string;
  title: string;
  explanation: string;
  elements: WhiteboardElement[];
}

export interface WhiteboardLesson {
  title: string;
  steps: LessonStep[];
}
