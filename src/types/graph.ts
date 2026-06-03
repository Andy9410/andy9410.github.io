export interface GraphResult {
  type: "image" | "svg" | "whiteboard";
  expression: string;
  data: string;
  title?: string;
}
