import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { FileText, Loader2, RefreshCw, Search, Users } from "lucide-react";
import { useAuth } from "@/auth/useAuth";
import AdminConsoleNav from "@/components/admin/AdminConsoleNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  fetchAdminDocumentDetail,
  fetchAdminDocumentMetrics,
  fetchAdminDocuments,
} from "@/services/adminDocumentsApi";
import type { AdminDocumentSummary } from "@/types/adminDocuments";

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-UY").format(value);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Sin uso";
  return format(parseISO(value), "dd/MM/yyyy HH:mm");
}

function buildPageNumbers(page: number, totalPages: number) {
  if (totalPages <= 1) return [0];
  const pages = new Set<number>([0, totalPages - 1, page - 1, page, page + 1].filter((value) => value >= 0 && value < totalPages));
  return Array.from(pages).sort((a, b) => a - b);
}

function MetricCard({
  title,
  value,
  description,
}: {
  title: string;
  value: number;
  description: string;
}) {
  return (
    <Card className="border-slate-800/80 bg-slate-950/70 text-slate-100 shadow-2xl shadow-black/20">
      <CardContent className="p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">{title}</p>
        <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-50">{formatNumber(value)}</div>
        <p className="mt-2 text-sm leading-5 text-slate-400">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function DocumentsPage() {
  const { refreshAccessToken, isAuthenticated } = useAuth();
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [email, setEmail] = useState("");
  const [filename, setFilename] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<AdminDocumentSummary | null>(null);

  const filters = useMemo(() => ({ page, size, email, filename }), [page, size, email, filename]);
  const metricFilters = useMemo(() => ({ email, filename }), [email, filename]);

  const query = useQuery({
    queryKey: ["admin-documents", filters],
    queryFn: () => fetchAdminDocuments(filters, refreshAccessToken),
    enabled: isAuthenticated,
    staleTime: 15_000,
  });

  const metricsQuery = useQuery({
    queryKey: ["admin-document-metrics", metricFilters],
    queryFn: () => fetchAdminDocumentMetrics(metricFilters, refreshAccessToken),
    enabled: isAuthenticated,
    staleTime: 15_000,
  });

  const detailQuery = useQuery({
    queryKey: ["admin-document-detail", selectedDocument?.id],
    queryFn: () => fetchAdminDocumentDetail(selectedDocument!.id, refreshAccessToken),
    enabled: Boolean(selectedDocument),
    staleTime: 15_000,
  });

  const pageNumbers = buildPageNumbers(page, query.data?.totalPages ?? 1);
  const lastUpdated = query.dataUpdatedAt ? new Date(query.dataUpdatedAt) : null;

  return (
    <div className="min-h-screen bg-[#07111f] text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(148,163,184,0.09)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.09)_1px,transparent_1px)] bg-[size:32px_32px] opacity-20" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(180deg,rgba(7,17,31,0.06)_0%,rgba(7,17,31,0.86)_55%,rgba(7,17,31,1)_100%)]" />

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <AdminConsoleNav current="documents" />

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge className="border-cyan-500/30 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/10">
                <FileText className="mr-1.5 h-3.5 w-3.5" />
                Biblioteca
              </Badge>
              <Badge variant="outline" className="border-slate-700 bg-slate-950/70 text-slate-300">
                <Users className="mr-1.5 h-3.5 w-3.5" />
                Uso por documento
              </Badge>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">Documentos</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
              Inventario de documentos subidos, con métricas de consultas, usuarios únicos y última vez usado.
            </p>
          </div>
          <div className="flex flex-col gap-3 rounded-3xl border border-slate-800/80 bg-slate-950/70 p-4 shadow-2xl shadow-black/20">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Última actualización</p>
              <p className="mt-1 text-sm text-slate-200">
                {lastUpdated ? format(lastUpdated, "dd/MM/yyyy HH:mm") : "Sin datos aún"}
              </p>
            </div>
            <Button
              variant="outline"
              className="border-slate-700 bg-transparent text-slate-200 hover:bg-slate-900 hover:text-slate-50"
              onClick={() => {
                void query.refetch();
                void metricsQuery.refetch();
              }}
            >
              {query.isFetching || metricsQuery.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refrescar
            </Button>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metricsQuery.isLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-28 rounded-2xl bg-slate-800/60" />
              ))
            : metricsQuery.data && (
                <>
                  <MetricCard title="Documentos totales" value={metricsQuery.data.totalDocuments} description="Inventario visible con el filtro actual." />
                  <MetricCard title="Usados hoy" value={metricsQuery.data.documentsUsedToday} description="Documentos consultados hoy." />
                  <MetricCard title="Usuarios únicos hoy" value={metricsQuery.data.uniqueUsersToday} description="Usuarios distintos con consultas hoy." />
                  <MetricCard title="Uploads hoy" value={metricsQuery.data.uploadsToday} description="Altas registradas durante el día." />
                </>
              )}
        </div>

        <Card className="mb-6 border-slate-800/80 bg-slate-950/70 text-slate-100 shadow-2xl shadow-black/20">
          <CardHeader className="border-b border-slate-800/80 pb-4">
            <CardTitle className="text-lg text-slate-50">Filtros</CardTitle>
            <CardDescription className="text-slate-400">Búsqueda automática por propietario o nombre de archivo.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 p-5 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Propietario</p>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  value={email}
                  onChange={(e) => {
                    setPage(0);
                    setEmail(e.target.value);
                  }}
                  className="border-slate-800 bg-slate-900/60 pl-10 text-slate-100"
                  placeholder="usuario@dominio.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Archivo</p>
              <Input
                value={filename}
                onChange={(e) => {
                  setPage(0);
                  setFilename(e.target.value);
                }}
                className="border-slate-800 bg-slate-900/60 text-slate-100"
                placeholder="nombre.pdf"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800/80 bg-slate-950/70 text-slate-100 shadow-2xl shadow-black/20">
          <CardHeader className="border-b border-slate-800/80">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-lg text-slate-50">Listado de documentos</CardTitle>
                <CardDescription className="text-slate-400">Ordenados por última actividad o fecha de carga.</CardDescription>
              </div>
              <Badge variant="outline" className="border-slate-700 text-slate-300">
                {formatNumber(query.data?.totalElements ?? 0)} resultados
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {query.isLoading ? (
              <div className="space-y-2 p-5">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-14 rounded-xl bg-slate-800/60" />
                ))}
              </div>
            ) : query.error ? (
              <div className="p-6 text-sm text-rose-300">
                {query.error instanceof Error ? query.error.message : "No se pudo cargar la tabla."}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-900/70">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-slate-400">Documento</TableHead>
                        <TableHead className="text-slate-400">Propietario</TableHead>
                        <TableHead className="text-right text-slate-400">Chunks</TableHead>
                        <TableHead className="text-right text-slate-400">Consultas</TableHead>
                        <TableHead className="text-right text-slate-400">Usuarios</TableHead>
                        <TableHead className="text-slate-400">Upload</TableHead>
                        <TableHead className="text-slate-400">Último uso</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {query.data?.content.map((document) => (
                        <TableRow
                          key={document.id}
                          className="cursor-pointer border-slate-800/80 hover:bg-slate-900/50"
                          onClick={() => setSelectedDocument(document)}
                        >
                          <TableCell>
                            <div className="min-w-[220px]">
                              <div className="font-medium text-slate-100">{document.filename}</div>
                              <div className="text-xs text-slate-400">{document.fileType} · {document.pageCount ?? 0} páginas</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-300">{document.ownerEmail}</TableCell>
                          <TableCell className="text-right font-semibold text-slate-50">{formatNumber(document.chunkCount)}</TableCell>
                          <TableCell className="text-right font-semibold text-slate-50">{formatNumber(document.queryCount)}</TableCell>
                          <TableCell className="text-right font-semibold text-slate-50">{formatNumber(document.uniqueUsers)}</TableCell>
                          <TableCell className="text-slate-300">{formatDate(document.uploadDate)}</TableCell>
                          <TableCell className="text-slate-300">{formatDate(document.lastUsedAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex flex-col gap-4 border-t border-slate-800/80 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="text-sm text-slate-400">Página {page + 1} de {Math.max(query.data?.totalPages ?? 1, 1)}</div>
                  <Pagination className="mx-0 w-auto justify-start lg:justify-end">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (page > 0) setPage((current) => current - 1);
                          }}
                          className={cn(page === 0 && "pointer-events-none opacity-40")}
                        />
                      </PaginationItem>
                      {pageNumbers.map((pageNumber, index) => {
                        const previous = pageNumbers[index - 1];
                        const showGap = previous !== undefined && pageNumber - previous > 1;
                        return (
                          <div key={pageNumber} className="flex items-center gap-1">
                            {showGap && (
                              <PaginationItem>
                                <PaginationEllipsis />
                              </PaginationItem>
                            )}
                            <PaginationItem>
                              <PaginationLink
                                href="#"
                                isActive={pageNumber === page}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setPage(pageNumber);
                                }}
                                className="border-slate-700 text-slate-200 hover:bg-slate-900"
                              >
                                {pageNumber + 1}
                              </PaginationLink>
                            </PaginationItem>
                          </div>
                        );
                      })}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (page + 1 < (query.data?.totalPages ?? 1)) setPage((current) => current + 1);
                          }}
                          className={cn(page + 1 >= (query.data?.totalPages ?? 1) && "pointer-events-none opacity-40")}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={Boolean(selectedDocument)} onOpenChange={(open) => !open && setSelectedDocument(null)}>
        <DialogContent className="max-w-3xl border-slate-800 bg-slate-950 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-slate-50">{detailQuery.data?.filename ?? selectedDocument?.filename}</DialogTitle>
            <DialogDescription className="text-slate-400">Detalle operativo y métricas del documento.</DialogDescription>
          </DialogHeader>
          {detailQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 rounded-2xl bg-slate-800/60" />
              <Skeleton className="h-40 rounded-2xl bg-slate-800/60" />
            </div>
          ) : detailQuery.error ? (
            <div className="text-sm text-rose-300">
              {detailQuery.error instanceof Error ? detailQuery.error.message : "No se pudo cargar el detalle."}
            </div>
          ) : detailQuery.data ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-slate-800/80 bg-slate-900/60 text-slate-100">
                <CardContent className="space-y-3 p-5 text-sm">
                  <div><span className="text-slate-400">ID:</span> {detailQuery.data.id}</div>
                  <div><span className="text-slate-400">Propietario:</span> {detailQuery.data.ownerEmail}</div>
                  <div><span className="text-slate-400">Tipo:</span> {detailQuery.data.fileType}</div>
                  <div><span className="text-slate-400">Upload:</span> {formatDate(detailQuery.data.uploadDate)}</div>
                  <div><span className="text-slate-400">Descargable:</span> {detailQuery.data.downloadAvailable ? "Sí" : "No"}</div>
                </CardContent>
              </Card>
              <Card className="border-slate-800/80 bg-slate-900/60 text-slate-100">
                <CardContent className="space-y-3 p-5 text-sm">
                  <div><span className="text-slate-400">Páginas:</span> {detailQuery.data.pageCount ?? 0}</div>
                  <div><span className="text-slate-400">Chunks:</span> {formatNumber(detailQuery.data.chunkCount)}</div>
                  <div><span className="text-slate-400">Consultas:</span> {formatNumber(detailQuery.data.queryCount)}</div>
                  <div><span className="text-slate-400">Usuarios únicos:</span> {formatNumber(detailQuery.data.uniqueUsers)}</div>
                  <div><span className="text-slate-400">Último uso:</span> {formatDate(detailQuery.data.lastUsedAt)}</div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
