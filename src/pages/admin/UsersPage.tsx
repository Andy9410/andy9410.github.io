import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Eye, Loader2, RefreshCw, Search, ShieldCheck, Users } from "lucide-react";
import { useAuth } from "@/auth/useAuth";
import { Link } from "react-router-dom";
import AdminConsoleNav from "@/components/admin/AdminConsoleNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { fetchAdminUsers } from "@/services/adminUsersApi";

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-UY").format(value);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Sin login";
  return format(parseISO(value), "dd/MM/yyyy HH:mm");
}

function buildPageNumbers(page: number, totalPages: number) {
  if (totalPages <= 1) return [0];
  const pages = new Set<number>([0, totalPages - 1, page - 1, page, page + 1].filter((value) => value >= 0 && value < totalPages));
  return Array.from(pages).sort((a, b) => a - b);
}

export default function UsersPage() {
  const { refreshAccessToken, isAuthenticated } = useAuth();
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const filters = useMemo(() => ({ page, size, email, name }), [page, size, email, name]);

  const query = useQuery({
    queryKey: ["admin-users", filters],
    queryFn: () => fetchAdminUsers(filters, refreshAccessToken),
    enabled: isAuthenticated,
    staleTime: 15_000,
  });

  const pageNumbers = buildPageNumbers(page, query.data?.totalPages ?? 1);
  const lastUpdated = query.dataUpdatedAt ? new Date(query.dataUpdatedAt) : null;

  return (
    <div className="min-h-screen bg-[#07111f] text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(148,163,184,0.09)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.09)_1px,transparent_1px)] bg-[size:32px_32px] opacity-20" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(180deg,rgba(7,17,31,0.06)_0%,rgba(7,17,31,0.86)_55%,rgba(7,17,31,1)_100%)]" />

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <AdminConsoleNav current="users" />

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge className="border-cyan-500/30 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/10">
                <Users className="mr-1.5 h-3.5 w-3.5" />
                Acceso y cuentas
              </Badge>
              <Badge variant="outline" className="border-slate-700 bg-slate-950/70 text-slate-300">
                <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                Actividad por login
              </Badge>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">Usuarios</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
              Lista básica de cuentas con rol, fecha de alta y último login. Estado activo si hubo login en los últimos 30 días.
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
              onClick={() => query.refetch()}
            >
              {query.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refrescar
            </Button>
          </div>
        </div>

        <Card className="mb-6 border-slate-800/80 bg-slate-950/70 text-slate-100 shadow-2xl shadow-black/20">
          <CardHeader className="border-b border-slate-800/80 pb-4">
            <CardTitle className="text-lg text-slate-50">Filtros</CardTitle>
            <CardDescription className="text-slate-400">Búsqueda por nombre o email con actualización automática.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 p-5 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Email</p>
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
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Nombre</p>
              <Input
                value={name}
                onChange={(e) => {
                  setPage(0);
                  setName(e.target.value);
                }}
                className="border-slate-800 bg-slate-900/60 text-slate-100"
                placeholder="Nombre de la cuenta"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800/80 bg-slate-950/70 text-slate-100 shadow-2xl shadow-black/20">
          <CardHeader className="border-b border-slate-800/80">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-lg text-slate-50">Cuentas</CardTitle>
                <CardDescription className="text-slate-400">Ordenadas por último login y fecha de alta. Desde acá también podés abrir el perfil de aprendizaje de cada usuario.</CardDescription>
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
                        <TableHead className="text-slate-400">Nombre</TableHead>
                        <TableHead className="text-slate-400">Email</TableHead>
                        <TableHead className="text-slate-400">Rol</TableHead>
                        <TableHead className="text-slate-400">Fecha alta</TableHead>
                        <TableHead className="text-slate-400">Último login</TableHead>
                        <TableHead className="text-slate-400">Estado</TableHead>
                        <TableHead className="text-right text-slate-400">Perfil</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {query.data?.content.map((user) => (
                        <TableRow key={user.id} className="border-slate-800/80">
                          <TableCell className="font-medium text-slate-100">{user.name}</TableCell>
                          <TableCell className="text-slate-300">{user.email}</TableCell>
                          <TableCell className="text-slate-300">{user.role}</TableCell>
                          <TableCell className="text-slate-300">{formatDate(user.createdAt)}</TableCell>
                          <TableCell className="text-slate-300">{formatDate(user.lastLoginAt)}</TableCell>
                          <TableCell>
                            {user.active ? (
                              <Badge className="border-emerald-500/30 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/15">Activo</Badge>
                            ) : (
                              <Badge variant="outline" className="border-slate-700 text-slate-300">Inactivo</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              asChild
                              variant="outline"
                              className="border-slate-700 bg-transparent text-slate-200 hover:bg-slate-900 hover:text-slate-50"
                            >
                              <Link to={`/admin/users/${encodeURIComponent(user.email)}/profile`}>
                                <Eye className="h-4 w-4" />
                                Ver perfil
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex flex-col gap-4 border-t border-slate-800/80 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="text-sm text-slate-400">
                    Página {page + 1} de {Math.max(query.data?.totalPages ?? 1, 1)}
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
    </div>
  );
}
