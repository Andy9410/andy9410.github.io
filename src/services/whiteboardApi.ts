import type { InterpretMode, ReasoningNode, Whiteboard, WhiteboardData, WhiteboardEntry, WhiteboardInterpretation } from "@/types/whiteboard";

const BASE_URL = import.meta.env.VITE_CHAT_API_URL ?? "http://localhost:8080";

const EMPTY_DATA: WhiteboardData = { version: 1, elements: [] };

interface WhiteboardRequest {
  documentId?: number;
  exerciseLabel?: string;
  title?: string;
  data?: WhiteboardData;
}

async function whiteboardFetch(path: string, token: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Content-Type", "application/json");

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) throw new Error(`${res.status}`);
  return res;
}

function normalizeWhiteboard(raw: Whiteboard): Whiteboard {
  return {
    ...raw,
    data: {
      version: raw.data?.version ?? 1,
      elements: Array.isArray(raw.data?.elements) ? raw.data.elements : [],
    },
  };
}

export async function listWhiteboards(conversationId: number, token: string): Promise<Whiteboard[]> {
  const res = await whiteboardFetch(`/api/conversations/${conversationId}/whiteboards`, token);
  const data = await res.json() as Whiteboard[];
  return data.map(normalizeWhiteboard);
}

export async function getActiveWhiteboard(conversationId: number, token: string): Promise<Whiteboard | null> {
  try {
    const res = await whiteboardFetch(`/api/conversations/${conversationId}/whiteboards/active`, token);
    return normalizeWhiteboard(await res.json() as Whiteboard);
  } catch (error) {
    if (error instanceof Error && error.message === "404") return null;
    throw error;
  }
}

export async function createWhiteboard(
  conversationId: number,
  token: string,
  request: WhiteboardRequest = {}
): Promise<Whiteboard> {
  const res = await whiteboardFetch(`/api/conversations/${conversationId}/whiteboards`, token, {
    method: "POST",
    body: JSON.stringify({ ...request, data: request.data ?? EMPTY_DATA }),
  });
  return normalizeWhiteboard(await res.json() as Whiteboard);
}

export async function updateWhiteboard(
  whiteboardId: string,
  token: string,
  request: WhiteboardRequest
): Promise<Whiteboard> {
  const res = await whiteboardFetch(`/api/whiteboards/${whiteboardId}`, token, {
    method: "PUT",
    body: JSON.stringify(request),
  });
  return normalizeWhiteboard(await res.json() as Whiteboard);
}

export async function openWhiteboardForTeaching(
  conversationId: number,
  token: string,
  title?: string
): Promise<Whiteboard> {
  const res = await whiteboardFetch(`/api/conversations/${conversationId}/whiteboards/open`, token, {
    method: "POST",
    body: JSON.stringify({ title: title ?? "Pizarra de enseñanza" }),
  });
  return normalizeWhiteboard(await res.json() as Whiteboard);
}

export async function addWhiteboardEntries(
  conversationId: number,
  whiteboardId: string,
  entries: Array<{ type: string; content: string; orderIndex: number }>,
  token: string
): Promise<WhiteboardEntry[]> {
  const res = await whiteboardFetch(
    `/api/conversations/${conversationId}/whiteboards/${whiteboardId}/entries`,
    token,
    { method: "POST", body: JSON.stringify({ entries }) }
  );
  return await res.json() as WhiteboardEntry[];
}

export async function getWhiteboardEntries(
  conversationId: number,
  whiteboardId: string,
  token: string
): Promise<WhiteboardEntry[]> {
  const res = await whiteboardFetch(
    `/api/conversations/${conversationId}/whiteboards/${whiteboardId}/entries`,
    token
  );
  return await res.json() as WhiteboardEntry[];
}

export async function injectWhiteboardContent(
  conversationId: number,
  whiteboardId: string,
  blocks: Array<{ type: string; content: string; orderIndex: number; metadata?: Record<string, unknown> }>,
  token: string
): Promise<WhiteboardEntry[]> {
  const res = await whiteboardFetch(
    `/api/conversations/${conversationId}/whiteboards/${whiteboardId}/inject`,
    token,
    { method: "POST", body: JSON.stringify({ blocks }) }
  );
  return await res.json() as WhiteboardEntry[];
}

export async function getReasoningTree(conversationId: number, token: string): Promise<ReasoningNode[]> {
  try {
    const res = await whiteboardFetch(`/api/conversations/${conversationId}/reasoning/tree`, token);
    return await res.json() as ReasoningNode[];
  } catch (error) {
    if (error instanceof Error && error.message === "404") return [];
    throw error;
  }
}

export async function updateReasoningNodeStatus(
  nodeId: number,
  conversationId: number,
  status: string,
  token: string
): Promise<ReasoningNode> {
  const res = await whiteboardFetch(
    `/api/reasoning/nodes/${nodeId}/status?conversationId=${conversationId}`,
    token,
    { method: "PATCH", body: JSON.stringify({ status }) }
  );
  return await res.json() as ReasoningNode;
}

export async function annotateWhiteboard(
  conversationId: number,
  whiteboardId: string,
  token: string,
  opts: {
    question?: string;
    selectedContent?: string;
    selectedType?: string;
    socraticMode?: boolean;
  } = {}
): Promise<WhiteboardEntry> {
  const res = await whiteboardFetch(
    `/api/conversations/${conversationId}/whiteboards/${whiteboardId}/annotate`,
    token,
    {
      method: "POST",
      body: JSON.stringify({
        conversationId,
        question: opts.question ?? null,
        selectedContent: opts.selectedContent ?? null,
        selectedType: opts.selectedType ?? null,
        socraticMode: opts.socraticMode ?? false,
      }),
    }
  );
  return await res.json() as WhiteboardEntry;
}

export async function interpretWhiteboard(
  token: string,
  request: {
    conversationId: number;
    whiteboardId: string;
    imageBase64: string;
    exerciseLabel?: string | null;
    interpretMode?: InterpretMode;
  }
): Promise<WhiteboardInterpretation> {
  const res = await whiteboardFetch("/tools/whiteboard/interpret", token, {
    method: "POST",
    body: JSON.stringify(request),
  });
  return await res.json() as WhiteboardInterpretation;
}
