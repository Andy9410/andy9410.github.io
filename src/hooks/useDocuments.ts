import { useState, useCallback, useEffect } from "react";
import { listDocuments } from "@/services/documentApi";
import { tokenStorage } from "@/auth/authService";
import type { DocumentOut } from "@/services/documentApi";

export function useDocuments(token: string | null) {
  const [documents, setDocuments] = useState<DocumentOut[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    // Usar token de localStorage si el prop está expirado (pudo haber sido refrescado)
    const effectiveToken = tokenStorage.getAccess() || token;
    if (!effectiveToken) return;
    setLoading(true);
    try {
      const docs = await listDocuments(effectiveToken);
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
