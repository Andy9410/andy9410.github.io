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
  createdAt?: string;
  updatedAt?: string;
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
