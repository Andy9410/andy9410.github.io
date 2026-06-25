import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import {
  CalendarIcon,
  Loader2,
  MessageSquareText,
  RefreshCw,
  Search,
  UserRound,
  Users,
} from "lucide-react";
import { useAuth } from "@/auth/useAuth";
import AdminConsoleNav from "@/components/admin/AdminConsoleNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { fetchAdminUserLookup } from "@/services/adminUserLookupApi";
import {
  fetchAdminConversationDetail,
  fetchAdminConversationMetrics,
  fetchAdminConversations,
} from "@/services/adminConversationsApi";
import type { AdminConversationSummary } from "@/types/adminConversations";

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-UY").format(value);
}

function formatDate(value: string | null | undefined, withTime = true) {
  if (!value) return "Sin datos";
  const parsed = parseISO(value);
  return format(parsed, withTime ? "dd/MM/yyyy HH:mm" : "dd/MM/yyyy");
}

function DateFilter({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  const selected = value ? parseISO(`${value}T00:00:00`) : undefined;
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between border-slate-800 bg-slate-900/60 text-slate-100 hover:bg-slate-900"
          >
            <span>{value ? formatDate(`${value}T00:00:00`, false) : "Seleccionar"}</span>
            <CalendarIcon className="h-4 w-4 text-slate-400" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto border-slate-800 bg-slate-950 p-0 text-slate-100" align="start">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(date) => onChange(date ? format(date, "yyyy-MM-dd") : "")}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">{label}</div>
      <div className="mt-1 text-sm text-slate-100">{value}</div>
    </div>
  );
}

function ConversationStatusBadge({ active }: { active: boolean }) {
  return active ? (
    <Badge className="border-emerald-500/30 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/15">Activa</Badge>
  ) : (
    <Badge variant="outline" className="border-slate-700 text-slate-300">Inactiva</Badge>
  );
}

function buildPageNumbers(page: number, totalPages: number) {
  if (totalPages <= 1) return [0];
  const pages = new Set<number>([0, totalPages - 1, page - 1, page, page + 1].filter((value) => value >= 0 && value < totalPages));
  return Array.from(pages).sort((a, b) => a - b);
}

export default function ConversationsPage() {
  const { refreshAccessToken, isAuthenticated } = useAuth();
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<AdminConversationSummary | null>(null);

  const filters = useMemo(
    () => ({ page, size, email, name, title, from, to }),
    [page, size, email, name, title, from, to],
  );

  const metricsFilters = useMemo(
    () => ({ email, name, title, from, to }),
    [email, name, title, from, to],
  );

  const listQuery = useQuery({
    queryKey: ["admin-conversations", filters],
    queryFn: () => fetchAdminConversations(filters, refreshAccessToken),
    enabled: isAuthenticated,
    staleTime: 15_000,
  });

  const metricsQuery = useQuery({
    queryKey: ["admin-conversation-metrics", metricsFilters],
    queryFn: () => fetchAdminConversationMetrics(metricsFilters, refreshAccessToken),
    enabled: isAuthenticated,
    staleTime: 15_000,
  });

  const detailQuery = useQuery({
    queryKey: ["admin-conversation-detail", selectedConversation?.conversationId],
    queryFn: () => fetchAdminConversationDetail(selectedConversation!.conversationId, refreshAccessToken),
    enabled: Boolean(selectedConversation),
    staleTime: 15_000,
  });

  const userLookupQuery = useQuery({
    queryKey: ["admin-user-lookup", listQuery.data?.content.map((item) => item.userEmail).join("|")],
    queryFn: () => fetchAdminUserLookup(listQuery.data?.content.map((item) => item.userEmail) ?? [], refreshAccessToken),
    enabled: Boolean(listQuery.data?.content.length),
    staleTime: 30_000,
  });

  const pageNumbers = buildPageNumbers(page, listQuery.data?.totalPages ?? 1);
  const lastUpdated = listQuery.dataUpdatedAt ? new Date(listQuery.dataUpdatedAt) : null;

  const handleFilterChange = (setter: (value: string) => void) => (value: string) => {
    setPage(0);
    setter(value);
  };

  return (
    <div className="min-h-screen bg-[#07111f] text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(148,163,184,0.09)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.09)_1px,transparent_1px)] bg-[size:32px_32px] opacity-20" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(180deg,rgba(7,17,31,0.06)_0%,rgba(7,17,31,0.86)_55%,rgba(7,17,31,1)_100%)]" />

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <AdminConsoleNav current="conversations" />

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge className="border-cyan-500/30 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/10">
                <MessageSquareText className="mr-1.5 h-3.5 w-3.5" />
                TutorIA
              </Badge>
              <Badge variant="outline" className="border-slate-700 bg-slate-950/70 text-slate-300">
                <Users className="mr-1.5 h-3.5 w-3.5" />
                Actividad reciente
              </Badge>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
              Últimas conversaciones por usuario
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
              Vista operativa para revisar actividad real, detectar problemas y entender el uso de TutorIA por conversación.
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
                void listQuery.refetch();
                void metricsQuery.refetch();
              }}
            >
              {listQuery.isFetching || metricsQuery.isFetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
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
                  <MetricCard title="Conversaciones totales" value={metricsQuery.data.totalConversations} description="Total visible con el filtro actual." />
                  <MetricCard title="Activas hoy" value={metricsQuery.data.activeToday} description="Conversaciones con actividad registrada en el día." />
                  <MetricCard title="Usuarios únicos hoy" value={metricsQuery.data.uniqueUsersToday} description="Usuarios distintos que enviaron mensajes hoy." />
                  <MetricCard title="Mensajes hoy" value={metricsQuery.data.messagesToday} description="Mensajes capturados hoy en el rango operativo." />
                </>
              )}
        </div>

        <Card className="mb-6 border-slate-800/80 bg-slate-950/70 text-slate-100 shadow-2xl shadow-black/20">
          <CardHeader className="border-b border-slate-800/80 pb-4">
            <CardTitle className="text-lg text-slate-50">Filtros</CardTitle>
            <CardDescription className="text-slate-400">
              Buscar por usuario o conversación y acotar por ventana temporal.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-5">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Email</p>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  value={email}
                  onChange={(e) => handleFilterChange(setEmail)(e.target.value)}
                  className="border-slate-800 bg-slate-900/60 pl-10 text-slate-100"
                  placeholder="usuario@dominio.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Nombre</p>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  value={name}
                  onChange={(e) => handleFilterChange(setName)(e.target.value)}
                  className="border-slate-800 bg-slate-900/60 pl-10 text-slate-100"
                  placeholder="Nombre visible"
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Conversación</p>
              <Input
                value={title}
                onChange={(e) => handleFilterChange(setTitle)(e.target.value)}
                className="border-slate-800 bg-slate-900/60 text-slate-100"
                placeholder="Título generado"
              />
            </div>

            <DateFilter label="Desde" value={from} onChange={handleFilterChange(setFrom)} />
            <DateFilter label="Hasta" value={to} onChange={handleFilterChange(setTo)} />
          </CardContent>
        </Card>

        <Card className="border-slate-800/80 bg-slate-950/70 text-slate-100 shadow-2xl shadow-black/20">
          <CardHeader className="border-b border-slate-800/80">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-lg text-slate-50">Conversaciones recientes</CardTitle>
                <CardDescription className="text-slate-400">
                  Ordenadas por última actividad descendente.
                </CardDescription>
              </div>
              <Badge variant="outline" className="border-slate-700 text-slate-300">
                {formatNumber(listQuery.data?.totalElements ?? 0)} resultados
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {listQuery.isLoading ? (
              <div className="space-y-2 p-5">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-14 rounded-xl bg-slate-800/60" />
                ))}
              </div>
            ) : listQuery.error ? (
              <div className="p-6 text-sm text-rose-300">
                {listQuery.error instanceof Error ? listQuery.error.message : "No se pudo cargar la tabla."}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-900/70">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-slate-400">Usuario</TableHead>
                        <TableHead className="text-slate-400">Conversación</TableHead>
                        <TableHead className="text-slate-400">Último mensaje</TableHead>
                        <TableHead className="text-right text-slate-400">Mensajes</TableHead>
                        <TableHead className="text-slate-400">Creación</TableHead>
                        <TableHead className="text-slate-400">Última actividad</TableHead>
                        <TableHead className="text-slate-400">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {listQuery.data?.content.map((conversation) => (
                        <TableRow
                          key={conversation.conversationId}
                          className="cursor-pointer border-slate-800/80 hover:bg-slate-900/50"
                          onClick={() => setSelectedConversation(conversation)}
                        >
                          <TableCell>
                            <div className="min-w-[220px]">
                              <div className="font-medium text-slate-100">{userLookupQuery.data?.[conversation.userEmail]?.name ?? conversation.userName}</div>
                              <div className="max-w-[220px] truncate text-xs text-slate-400">{conversation.userEmail}</div>
                            </div>
                          </TableCell>
                          <TableCell className="min-w-[180px] text-slate-100">{conversation.title}</TableCell>
                          <TableCell className="max-w-[320px]">
                            <div className="line-clamp-2 text-sm text-slate-300">{conversation.lastMessage || "Sin mensajes"}</div>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-slate-50">{formatNumber(conversation.messageCount)}</TableCell>
                          <TableCell className="text-slate-300">{formatDate(conversation.createdAt)}</TableCell>
                          <TableCell className="text-slate-300">{formatDate(conversation.lastActivity)}</TableCell>
                          <TableCell><ConversationStatusBadge active={conversation.active} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex flex-col gap-4 border-t border-slate-800/80 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="text-sm text-slate-400">
                    Página {page + 1} de {Math.max(listQuery.data?.totalPages ?? 1, 1)}
                  </div>
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
                            if (page + 1 < (listQuery.data?.totalPages ?? 1)) setPage((current) => current + 1);
                          }}
                          className={cn(page + 1 >= (listQuery.data?.totalPages ?? 1) && "pointer-events-none opacity-40")}
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

      <Dialog open={Boolean(selectedConversation)} onOpenChange={(open) => !open && setSelectedConversation(null)}>
        <DialogContent className="max-h-[90vh] max-w-5xl border-slate-800 bg-slate-950 p-0 text-slate-100">
          <DialogHeader className="border-b border-slate-800/80 px-6 py-5">
            <DialogTitle className="text-xl text-slate-50">
              {detailQuery.data?.title ?? selectedConversation?.title ?? "Detalle de conversación"}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Historial completo y metadata operativa en orden cronológico real.
            </DialogDescription>
          </DialogHeader>

          {detailQuery.isLoading ? (
            <div className="space-y-4 p-6">
              <Skeleton className="h-24 rounded-2xl bg-slate-800/60" />
              <Skeleton className="h-80 rounded-2xl bg-slate-800/60" />
            </div>
          ) : detailQuery.error ? (
            <div className="p-6 text-sm text-rose-300">
              {detailQuery.error instanceof Error ? detailQuery.error.message : "No se pudo cargar el detalle."}
            </div>
          ) : detailQuery.data ? (
            <div className="grid gap-0 lg:grid-cols-[320px_1fr]">
              <div className="border-b border-slate-800/80 p-6 lg:border-b-0 lg:border-r">
                <div className="grid gap-3">
                  <DetailRow label="ID conversación" value={String(detailQuery.data.id)} />
                  <DetailRow label="Usuario" value={`${detailQuery.data.user.name} · ${detailQuery.data.user.email}`} />
                  <DetailRow label="Fecha creación" value={formatDate(detailQuery.data.createdAt)} />
                  <DetailRow label="Última actividad" value={formatDate(detailQuery.data.lastActivity)} />
                  <DetailRow label="Cantidad mensajes" value={formatNumber(detailQuery.data.messageCount)} />
                </div>
              </div>

              <ScrollArea className="h-[62vh]">
                <div className="space-y-4 p-6">
                  {detailQuery.data.messages.map((message, index) => {
                    const isUser = message.role === "USER";
                    return (
                      <div key={`${message.createdAt}-${index}`} className={cn("flex", isUser ? "justify-end" : "justify-start")}>
                        <div
                          className={cn(
                            "max-w-[85%] rounded-3xl border px-4 py-3 shadow-lg",
                            isUser
                              ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-50"
                              : "border-slate-800 bg-slate-900/80 text-slate-100"
                          )}
                        >
                          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em]">
                            <span>{isUser ? "Usuario" : "TutorIA"}</span>
                            <span className="text-slate-500">{formatDate(message.createdAt)}</span>
                          </div>
                          <div className="whitespace-pre-wrap text-sm leading-6 text-current/95">{message.content}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
