import type { ComponentType, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO, subDays } from "date-fns";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CalendarRange,
  ChevronRight,
  FileText,
  LineChart as LineChartIcon,
  Loader2,
  MessageSquareMore,
  RefreshCw,
  ShieldCheck,
  ShieldOff,
  Sparkles,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/auth/useAuth";
import AdminConsoleNav from "@/components/admin/AdminConsoleNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LineChart,
  Line,
  LineChart as RechartsLineChart,
  XAxis,
  YAxis,
} from "recharts";
import { fetchDashboardData } from "@/services/metricsApi";
import type { AnalyticsFeature } from "@/types/metrics";

const featureLabels: Record<AnalyticsFeature, string> = {
  ALL: "Todas",
  AUTH: "Auth",
  CHAT: "Chat",
  DOCUMENTS: "Documentos",
  TUTORIA: "TutorIA",
  OTHER: "Otros",
};

const rangeLabels = {
  "7d": "7 días",
  "30d": "30 días",
  "90d": "90 días",
  custom: "Personalizado",
} as const;

type RangePreset = keyof typeof rangeLabels;

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-AR").format(value);
}

function formatDateInput(value: Date) {
  return format(value, "yyyy-MM-dd");
}

function resolveRange(preset: RangePreset, customFrom: string, customTo: string) {
  const today = new Date();
  const end = formatDateInput(today);

  if (preset === "7d") {
    return { from: formatDateInput(subDays(today, 6)), to: end };
  }

  if (preset === "30d") {
    return { from: formatDateInput(subDays(today, 29)), to: end };
  }

  if (preset === "90d") {
    return { from: formatDateInput(subDays(today, 89)), to: end };
  }

  const from = customFrom || formatDateInput(subDays(today, 29));
  const to = customTo || end;
  return from <= to ? { from, to } : { from: to, to: from };
}

function mergeSeries(
  seriesMap: Record<string, { day: string; value: number }[]>,
  keys: string[],
) {
  const days = new Set<string>();
  keys.forEach((key) => seriesMap[key]?.forEach((point) => days.add(point.day)));

  return Array.from(days)
    .sort()
    .map((day) => {
      const row: Record<string, string | number> = { day };
      keys.forEach((key) => {
        const point = seriesMap[key]?.find((item) => item.day === day);
        row[key] = point?.value ?? 0;
      });
      return row;
    });
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  tone,
}: {
  title: string;
  value: number | string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  tone: "cyan" | "amber" | "emerald" | "rose" | "slate";
}) {
  const tones = {
    cyan: "border-cyan-500/20 bg-cyan-500/10 text-cyan-200",
    amber: "border-amber-500/20 bg-amber-500/10 text-amber-200",
    emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
    rose: "border-rose-500/20 bg-rose-500/10 text-rose-200",
    slate: "border-slate-500/20 bg-slate-500/10 text-slate-200",
  } as const;

  return (
    <Card className="border-slate-800/80 bg-slate-950/70 text-slate-100 shadow-2xl shadow-black/20">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">{title}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-semibold tracking-tight text-slate-50">{value}</span>
            </div>
            <p className="mt-2 max-w-[18rem] text-sm leading-5 text-slate-400">{description}</p>
          </div>
          <div className={`rounded-2xl border p-3 ${tones[tone]}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="overflow-hidden border-slate-800/80 bg-slate-950/70 text-slate-100 shadow-2xl shadow-black/20">
      <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-slate-800/80 p-5">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold tracking-tight text-slate-50">{title}</CardTitle>
          <CardDescription className="max-w-2xl text-sm text-slate-400">{description}</CardDescription>
        </div>
        {action}
      </CardHeader>
      <CardContent className="p-5">{children}</CardContent>
    </Card>
  );
}

function LoadingShell() {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-2xl bg-slate-800/60" />
        ))}
      </div>
      <Skeleton className="h-[420px] rounded-3xl bg-slate-800/60" />
      <div className="grid gap-4 xl:grid-cols-2">
        <Skeleton className="h-[360px] rounded-3xl bg-slate-800/60" />
        <Skeleton className="h-[360px] rounded-3xl bg-slate-800/60" />
      </div>
    </div>
  );
}

export default function MetricsPage() {
  const { refreshAccessToken, isAuthenticated } = useAuth();
  const [preset, setPreset] = useState<RangePreset>("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [feature, setFeature] = useState<AnalyticsFeature>("ALL");

  useEffect(() => {
    if (preset === "custom") {
      const fallback = formatDateInput(subDays(new Date(), 29));
      const today = formatDateInput(new Date());
      if (!customFrom) setCustomFrom(fallback);
      if (!customTo) setCustomTo(today);
    }
  }, [preset, customFrom, customTo]);

  const range = useMemo(() => resolveRange(preset, customFrom, customTo), [preset, customFrom, customTo]);
  const filters = useMemo(() => ({ from: range.from, to: range.to, feature }), [range.from, range.to, feature]);

  const metricsQuery = useQuery({
    queryKey: ["analytics-dashboard", filters.from, filters.to, filters.feature],
    queryFn: () => fetchDashboardData(filters, refreshAccessToken),
    enabled: isAuthenticated,
    staleTime: 30_000,
    retry: 1,
  });

  const data = metricsQuery.data;
  const lastUpdated = metricsQuery.dataUpdatedAt ? new Date(metricsQuery.dataUpdatedAt) : null;

  const featureChartData = data ? mergeSeries({
    chat: data.chatSeries,
    docs: data.documentSeries,
  }, ["chat", "docs"]) : [];

  const userChartData = data ? mergeSeries({
    active: data.activeUsersSeries,
    newUsers: data.newUsersSeries,
  }, ["active", "newUsers"]) : [];

  const overviewItems = data
    ? [
        { title: "Usuarios registrados", value: data.overview.registeredUsers, description: "Altas dentro del rango seleccionado.", icon: Users, tone: "cyan" as const },
        { title: "Usuarios activos", value: data.overview.activeUsers, description: "Usuarios con al menos una interacción.", icon: ShieldCheck, tone: "emerald" as const },
        { title: "Requests", value: data.overview.requests, description: "Peticiones totales capturadas por el filtro global.", icon: ArrowUpRight, tone: "cyan" as const },
        { title: "Errores", value: data.overview.errors, description: "Errores manejados y respuestas fallidas.", icon: AlertTriangle, tone: "rose" as const },
        { title: "Logins", value: data.overview.logins, description: "Inicios de sesión exitosos.", icon: ShieldCheck, tone: "emerald" as const },
        { title: "Chat", value: data.overview.chatMessages, description: "Mensajes enviados por usuarios autenticados.", icon: MessageSquareMore, tone: "cyan" as const },
        { title: "Documentos", value: data.overview.documentsUploaded, description: "Subidas procesadas por el servicio de documentos.", icon: FileText, tone: "amber" as const },
        { title: "Requests lentas", value: data.overview.slowRequests, description: "Requests que superan el umbral configurado en Spring.", icon: LineChartIcon, tone: "amber" as const },
      ]
    : [];

  const chartConfigs = {
    requests: { label: "Requests", color: "hsl(190 90% 58%)" },
    errors: { label: "Errores", color: "hsl(0 84% 60%)" },
    slow: { label: "Lentas", color: "hsl(35 92% 55%)" },
    chat: { label: "Chat", color: "hsl(152 55% 45%)" },
    docs: { label: "Documentos", color: "hsl(217 84% 59%)" },
    active: { label: "Activos", color: "hsl(190 90% 58%)" },
    newUsers: { label: "Nuevos", color: "hsl(35 92% 55%)" },
  } as const;

  return (
    <div className="min-h-screen bg-[#07111f] text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(148,163,184,0.09)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.09)_1px,transparent_1px)] bg-[size:32px_32px] opacity-20" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(180deg,rgba(7,17,31,0.06)_0%,rgba(7,17,31,0.86)_55%,rgba(7,17,31,1)_100%)]" />

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <AdminConsoleNav current="dashboard" />
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
        >
          <div className="max-w-3xl">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge className="border-cyan-500/30 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/10">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Monitoreo interno
              </Badge>
              <Badge variant="outline" className="border-slate-700 bg-slate-950/70 text-slate-300">
                <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                Solo administración
              </Badge>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
              Dashboard de métricas y monitoreo
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
              Actividad real del sistema, error budget, uso de chat y documentos, y
              top endpoints. Los IDs de ruta se normalizan antes de persistir.
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-3xl border border-slate-800/80 bg-slate-950/70 p-4 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Rango</p>
                <p className="mt-1 text-sm text-slate-200">{range.from} → {range.to}</p>
              </div>
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-cyan-200">
                <CalendarRange className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-slate-800/80 pt-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Última actualización</p>
                <p className="mt-1 text-sm text-slate-200">
                  {lastUpdated ? format(lastUpdated, "dd/MM/yyyy HH:mm") : "Sin datos aún"}
                </p>
              </div>
              <Button
                variant="outline"
                className="border-slate-700 bg-transparent text-slate-200 hover:bg-slate-900 hover:text-slate-50"
                onClick={() => metricsQuery.refetch()}
              >
                {metricsQuery.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Refrescar
              </Button>
            </div>
          </div>
        </motion.div>

        <Card className="mb-6 border-slate-800/80 bg-slate-950/70 text-slate-100 shadow-2xl shadow-black/20">
          <CardContent className="grid gap-4 p-5 xl:grid-cols-[1.1fr_0.9fr_0.9fr_0.6fr]">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Periodo</p>
              <Select value={preset} onValueChange={(value) => setPreset(value as RangePreset)}>
                <SelectTrigger className="border-slate-800 bg-slate-900/60 text-slate-100">
                  <SelectValue placeholder="Elegir rango" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(rangeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Desde</p>
              <Input
                type="date"
                value={preset === "custom" ? customFrom : range.from}
                onChange={(e) => {
                  setPreset("custom");
                  setCustomFrom(e.target.value);
                }}
                className="border-slate-800 bg-slate-900/60 text-slate-100"
              />
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Hasta</p>
              <Input
                type="date"
                value={preset === "custom" ? customTo : range.to}
                onChange={(e) => {
                  setPreset("custom");
                  setCustomTo(e.target.value);
                }}
                className="border-slate-800 bg-slate-900/60 text-slate-100"
              />
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Feature</p>
              <Select value={feature} onValueChange={(value) => setFeature(value as AnalyticsFeature)}>
                <SelectTrigger className="border-slate-800 bg-slate-900/60 text-slate-100">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(featureLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {metricsQuery.isLoading ? (
          <LoadingShell />
        ) : metricsQuery.error ? (
          <Card className="border-slate-800/80 bg-slate-950/70 text-slate-100 shadow-2xl shadow-black/20">
            <CardContent className="flex items-start gap-4 p-6">
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-rose-200">
                <ShieldOff className="h-4 w-4" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-slate-50">No se pudo cargar el dashboard</h2>
                <p className="max-w-2xl text-sm text-slate-400">
                  {metricsQuery.error instanceof Error ? metricsQuery.error.message : "Error desconocido"}
                </p>
                <Button
                  className="mt-2 bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                  onClick={() => metricsQuery.refetch()}
                >
                  Reintentar
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : data ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {overviewItems.map((item) => (
                <MetricCard key={item.title} {...item} />
              ))}
            </div>

            <SectionCard
              title="Series diarias"
              description="Los gráficos usan el rango seleccionado y agrupan por día. La vista se refresca al pedirla o al recargar la página."
              action={
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <BarChart3 className="h-4 w-4 text-cyan-300" />
                  Agregado diario
                </div>
              }
            >
              <Tabs defaultValue="requests" className="w-full">
                <TabsList className="grid h-auto w-full grid-cols-3 bg-slate-900/60 p-1 text-slate-400">
                  <TabsTrigger value="requests">Requests</TabsTrigger>
                  <TabsTrigger value="features">Features</TabsTrigger>
                  <TabsTrigger value="users">Usuarios</TabsTrigger>
                </TabsList>

                <TabsContent value="requests" className="mt-5">
                  <ChartContainer
                    config={{
                      requests: chartConfigs.requests,
                      errors: chartConfigs.errors,
                      slow: chartConfigs.slow,
                    }}
                    className="h-[340px] w-full"
                  >
                    <RechartsLineChart
                      data={mergeSeries(
                        { requests: data.requestSeries, errors: data.errorSeries, slow: data.slowRequestSeries },
                        ["requests", "errors", "slow"],
                      )}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.14)" />
                      <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={10} tickFormatter={(value) => format(parseISO(String(value)), "dd/MM")} />
                      <YAxis tickLine={false} axisLine={false} tickMargin={10} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Line type="monotone" dataKey="requests" stroke="var(--color-requests)" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="errors" stroke="var(--color-errors)" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="slow" stroke="var(--color-slow)" strokeWidth={2} dot={false} />
                    </RechartsLineChart>
                  </ChartContainer>
                </TabsContent>

                <TabsContent value="features" className="mt-5">
                  <ChartContainer
                    config={{
                      chat: chartConfigs.chat,
                      docs: chartConfigs.docs,
                    }}
                    className="h-[340px] w-full"
                  >
                    <BarChart data={featureChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.14)" />
                      <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={10} tickFormatter={(value) => format(parseISO(String(value)), "dd/MM")} />
                      <YAxis tickLine={false} axisLine={false} tickMargin={10} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="chat" fill="var(--color-chat)" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="docs" fill="var(--color-docs)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </TabsContent>

                <TabsContent value="users" className="mt-5">
                  <ChartContainer
                    config={{
                      active: chartConfigs.active,
                      newUsers: chartConfigs.newUsers,
                    }}
                    className="h-[340px] w-full"
                  >
                    <LineChart data={userChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.14)" />
                      <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={10} tickFormatter={(value) => format(parseISO(String(value)), "dd/MM")} />
                      <YAxis tickLine={false} axisLine={false} tickMargin={10} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Line type="monotone" dataKey="active" stroke="var(--color-active)" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="newUsers" stroke="var(--color-newUsers)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ChartContainer>
                </TabsContent>
              </Tabs>
            </SectionCard>

            <div className="grid gap-6 xl:grid-cols-2">
              <SectionCard
                title="Requests por endpoint"
                description="Los paths llegan normalizados desde el backend para agrupar IDs, UUIDs y valores dinámicos."
                action={<Badge variant="outline" className="border-slate-700 text-slate-300">Top 8</Badge>}
              >
                <div className="overflow-hidden rounded-2xl border border-slate-800/80">
                  <Table>
                    <TableHeader className="bg-slate-900/70">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-slate-400">Servicio</TableHead>
                        <TableHead className="text-slate-400">Método</TableHead>
                        <TableHead className="text-slate-400">Endpoint</TableHead>
                        <TableHead className="text-right text-slate-400">Requests</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.endpoints.map((row) => (
                        <TableRow key={`${row.serviceName}-${row.method}-${row.endpoint}`}>
                          <TableCell className="font-medium text-slate-100">{row.serviceName}</TableCell>
                          <TableCell className="text-slate-300">{row.method}</TableCell>
                          <TableCell className="max-w-[18rem] truncate text-slate-300">{row.endpoint}</TableCell>
                          <TableCell className="text-right font-semibold text-slate-50">{formatNumber(row.value)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </SectionCard>

              <SectionCard
                title="Usuarios con más requests"
                description="Ranking útil para consumo por usuario y soporte operativo."
                action={<Badge variant="outline" className="border-slate-700 text-slate-300">Top 8</Badge>}
              >
                <div className="overflow-hidden rounded-2xl border border-slate-800/80">
                  <Table>
                    <TableHeader className="bg-slate-900/70">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-slate-400">Usuario</TableHead>
                        <TableHead className="text-slate-400">Email</TableHead>
                        <TableHead className="text-right text-slate-400">Requests</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.topUsers.map((row) => (
                        <TableRow key={row.email}>
                          <TableCell className="font-medium text-slate-100">{row.name}</TableCell>
                          <TableCell className="max-w-[16rem] truncate text-slate-300">{row.email}</TableCell>
                          <TableCell className="text-right font-semibold text-slate-50">{formatNumber(row.value)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </SectionCard>
            </div>

            <Card className="border-slate-800/80 bg-slate-950/70 text-slate-100 shadow-2xl shadow-black/20">
              <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-amber-200">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-100">Notas de lectura</p>
                    <p className="text-sm text-slate-400">
                      El dashboard muestra eventos exactos en el rango elegido. Los eventos detallados se mantienen 30 días en backend y luego se agregan por día.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-500">
                  <ChevronRight className="h-4 w-4 text-cyan-300" />
                  LearnSoft / Production
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  );
}
