import { useState, useCallback, useEffect } from "react";
import { listDocuments } from "@/services/documentApi";
import type { DocumentOut } from "@/services/documentApi";

export function useDocuments(token: string | null) {
  const [documents, setDocuments] = useState<DocumentOut[]>([]);

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      const docs = await listDocuments(token);
      setDocuments(docs);
    } catch {
      // silent — badge just stays at 0
    }
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { documents, refresh };
}
