import { useState, useCallback, useEffect } from "react";
import { listDocuments } from "@/services/documentApi";
import type { DocumentOut } from "@/services/documentApi";

export function useDocuments(token: string | null) {
  const [documents, setDocuments] = useState<DocumentOut[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const docs = await listDocuments(token);
      setDocuments(docs);
    } catch {
      // silent — badge just stays at 0
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { documents, refresh, loading };
}
