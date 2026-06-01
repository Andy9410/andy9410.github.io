import type { WhiteboardData, WhiteboardElement } from "@/types/whiteboard";

const stroke = "#0f172a";
const minWidth = 960;
const minHeight = 540;
const padding = 48;

export function renderWhiteboardToPng(data: WhiteboardData): string {
  const canvas = document.createElement("canvas");
  const bounds = getBounds(data.elements);
  canvas.width = Math.max(minWidth, Math.ceil(bounds.maxX + padding));
  canvas.height = Math.max(minHeight, Math.ceil(bounds.maxY + padding));

  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = stroke;
  ctx.fillStyle = stroke;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.font = "700 24px sans-serif";

  data.elements.forEach((element) => drawElement(ctx, element));
  return canvas.toDataURL("image/png");
}

function drawElement(ctx: CanvasRenderingContext2D, element: WhiteboardElement) {
  const width = element.width ?? 140;
  const height = element.height ?? 72;

  if (element.type === "path") {
    const points = element.points ?? [];
    if (!points.length) return;
    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
    return;
  }

  if (element.type === "arrow") {
    drawArrow(ctx, element.x, element.y, element.x + width, element.y + (element.height ?? 0));
    return;
  }

  if (element.type === "text" || element.type === "equation") {
    if (element.text) ctx.fillText(element.text, element.x, element.y);
    return;
  }

  if (element.type === "circle") {
    ctx.beginPath();
    ctx.ellipse(element.x + width / 2, element.y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
    ctx.stroke();
    drawCenteredText(ctx, element.text ?? "", element.x, element.y, width, height);
    return;
  }

  if (element.type === "diamond") {
    ctx.beginPath();
    ctx.moveTo(element.x + width / 2, element.y);
    ctx.lineTo(element.x + width, element.y + height / 2);
    ctx.lineTo(element.x + width / 2, element.y + height);
    ctx.lineTo(element.x, element.y + height / 2);
    ctx.closePath();
    ctx.stroke();
    drawCenteredText(ctx, element.text ?? "", element.x, element.y, width, height);
    return;
  }

  ctx.beginPath();
  ctx.roundRect(element.x, element.y, width, height, 8);
  ctx.stroke();
  drawCenteredText(ctx, element.text ?? "", element.x, element.y, width, height);
}

function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  const angle = Math.atan2(y2 - y1, x2 - x1);
  const size = 14;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - size * Math.cos(angle - Math.PI / 6), y2 - size * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - size * Math.cos(angle + Math.PI / 6), y2 - size * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

function drawCenteredText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, height: number) {
  if (!text) return;
  const metrics = ctx.measureText(text);
  ctx.fillText(text, x + (width - metrics.width) / 2, y + height / 2 + 8);
}

function getBounds(elements: WhiteboardElement[]) {
  return elements.reduce(
    (bounds, element) => {
      if (element.type === "path") {
        (element.points ?? []).forEach((point) => {
          bounds.maxX = Math.max(bounds.maxX, point.x);
          bounds.maxY = Math.max(bounds.maxY, point.y);
        });
        return bounds;
      }
      bounds.maxX = Math.max(bounds.maxX, element.x + (element.width ?? 160));
      bounds.maxY = Math.max(bounds.maxY, element.y + (element.height ?? 80));
      return bounds;
    },
    { maxX: minWidth - padding, maxY: minHeight - padding }
  );
}
