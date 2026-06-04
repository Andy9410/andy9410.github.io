export type WhiteboardTool = "select" | "text" | "equation" | "pen" | "rect" | "circle" | "diamond" | "arrow" | "erase";

export type WhiteboardElementType = "text" | "equation" | "path" | "rect" | "circle" | "diamond" | "arrow";

export interface WhiteboardPoint {
  x: number;
  y: number;
}

export interface WhiteboardElement {
  id: string;
  type: WhiteboardElementType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  points?: WhiteboardPoint[];
  stroke?: string;
  fill?: string;
}

export interface WhiteboardData {
  version: number;
  elements: WhiteboardElement[];
}

export interface Whiteboard {
  id: string;
  conversationId: number;
  documentId?: number | null;
  exerciseLabel?: string | null;
  title: string;
  data: WhiteboardData;
  mode?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type WhiteboardEntryType =
  | "TEXT" | "STEP" | "FORMULA" | "DRAWING" | "HIGHLIGHT" | "SYSTEM_NOTE"
  | "TITLE" | "EXAMPLE" | "WARNING" | "QUESTION" | "DRAWING_INSTRUCTION";

export interface WhiteboardEntry {
  id: number;
  whiteboardId: string;
  conversationId: number;
  type: WhiteboardEntryType;
  content: string;
  orderIndex: number;
  metadata?: string | null;
}

export interface WhiteboardActionPayload {
  conversationId: number;
  whiteboardId: string;
  title?: string;
  mode?: string;
  entries?: WhiteboardEntry[];
  blocks?: WhiteboardEntry[];
}

export interface WhiteboardAction {
  type: "OPEN_WHITEBOARD" | "UPDATE_WHITEBOARD" | "INJECT_WHITEBOARD_CONTENT";
  payload: WhiteboardActionPayload;
}

export interface WhiteboardSuggestion {
  type: "whiteboard_suggestion";
  whiteboardId: string;
  title: string;
  elements: WhiteboardElement[];
}

export interface WhiteboardAnalysis {
  type: "whiteboard_analysis";
  whiteboardId: string;
  title: string;
  summary: string;
  observations: string[];
}

export type InterpretMode = "auto" | "math" | "algorithm" | "flowchart" | "text";

export interface WhiteboardInterpretation {
  type: "math" | "algorithm" | "flowchart" | "text" | "unknown";
  whiteboardId: string;
  title?: string;
  exerciseLabel?: string | null;
  documentId?: number | null;
  equation?: string | null;
  ocrText: string;
  structuredElements: string;
  semanticSummary: string;
  confidence: number;
}
