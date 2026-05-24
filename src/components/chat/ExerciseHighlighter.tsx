import type { BBox } from "@/types/chat";

interface Props {
  bbox: BBox;
  scale: number;
  pageHeight: number;
}

export function ExerciseHighlighter({ bbox, scale, pageHeight }: Props) {
  return (
    <div
      style={{
        position: "absolute",
        left: bbox.x0 * scale,
        top: (pageHeight - bbox.y1) * scale,
        width: (bbox.x1 - bbox.x0) * scale,
        height: (bbox.y1 - bbox.y0) * scale,
        background: "rgba(255, 235, 59, 0.4)",
        border: "2px solid #FBC02D",
        borderRadius: "2px",
        pointerEvents: "none",
      }}
    />
  );
}
