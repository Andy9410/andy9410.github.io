import { useEffect, useMemo, useState } from "react";
import type { ElementType } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  Globe,
  LineChart as LineChartIcon,
  MessageSquareMore,
  MousePointerClick,
  PieChart as PieChartIcon,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import LearnSoftLogo from "@/components/auth/LearnSoftLogo";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Phase = 0 | 1 | 2 | 3 | 4 | 5;

const timeline = [
  { label: "Acceso", hint: "Login y entrada", duration: 3800 },
  { label: "Resumen", hint: "KPIs y visión general", duration: 7600 },
  { label: "Actividad", hint: "Gráfico de 30 días", duration: 7600 },
  { label: "IA", hint: "Distribución por tema", duration: 7200 },
  { label: "Documentos", hint: "Top consultados y performance", duration: 7600 },
  { label: "Insights", hint: "Lectura inteligente y cierre", duration: 8000 },
] as const;

const kpiTargets = [
  { label: "Usuarios activos", value: 1248, icon: Users, accent: "text-cyan-200" },
  { label: "Chats creados", value: 5432, icon: MessageSquareMore, accent: "text-emerald-200" },
  { label: "Documentos procesados", value: 3127, icon: FileText, accent: "text-amber-200" },
  { label: "Preguntas respondidas", value: 28591, icon: BrainCircuit, accent: "text-violet-200" },
] as const;

const activitySeries = [
  710, 724, 738, 750, 766, 781, 799, 818, 831, 850,
  870, 892, 908, 927, 945, 968, 990, 1012, 1034, 1061,
  1088, 1110, 1139, 1168, 1184, 1207, 1221, 1233, 1240, 1248,
].map((value, index) => ({
  day: `D${index + 1}`,
  value,
}));

const aiUsage = [
  { label: "Programación", value: 45, color: "#22d3ee" },
  { label: "Matemática", value: 30, color: "#34d399" },
  { label: "Física", value: 15, color: "#fbbf24" },
  { label: "Otros", value: 10, color: "#a78bfa" },
];

const documents = [
  { name: "Álgebra Lineal.pdf", sessions: "482 consultas", time: "6m 21s" },
  { name: "Pascal Básico.pdf", sessions: "361 consultas", time: "5m 12s" },
  { name: "Programación I.pdf", sessions: "318 consultas", time: "7m 08s" },
  { name: "Matemática Discreta.pdf", sessions: "274 consultas", time: "4m 49s" },
];

const performanceCards = [
  { label: "Tiempo promedio de respuesta", value: "2.1 s", tone: "emerald" },
  { label: "OCR exitoso", value: "96%", tone: "emerald" },
  { label: "Precisión RAG", value: "92%", tone: "emerald" },
  { label: "Conversaciones activas", value: "184", tone: "emerald" },
] as const;

const insights = [
  "Los ejercicios de Programación representan el mayor volumen de consultas.",
  "El uso aumentó un 23% respecto del período anterior.",
  "Los usuarios que utilizan documentos tienen sesiones 3 veces más largas.",
];

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function useCountUp(target: number, active: boolean, duration = 1400) {
  const [value, setValue] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!active) {
      setValue(0);
      return;
    }

    if (reduceMotion) {
      setValue(target);
      return;
    }

    let raf = 0;
    const start = performance.now();

    const frame = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = easeOutCubic(progress);
      setValue(Math.round(target * eased));
      if (progress < 1) {
        raf = requestAnimationFrame(frame);
      }
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [active, duration, reduceMotion, target]);

  return value;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-ES").format(value);
}

function buildSectorPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}

function polarToCartesian(cx: number, cy: number, r: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleInRadians),
    y: cy + r * Math.sin(angleInRadians),
  };
}

function DemoLoginCard() {
  return (
    <motion.div
      className="flex min-h-screen items-center justify-center px-4"
      initial={{ opacity: 0, scale: 0.98, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 1.03, y: -10 }}
      transition={{ duration: 0.8 }}
    >
      <Card className="w-full max-w-md border-white/10 bg-white/6 text-white shadow-[0_30px_120px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <LearnSoftLogo variant="glass" size="lg" withText className="text-white" />
            <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-100">Acceso seguro</Badge>
          </div>

          <div className="mt-8 space-y-5">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-slate-400">TutorIA / LearnSoft</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                Iniciar sesión
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                La demo arranca con una sesión docente activa y abre la sección de métricas.
              </p>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Email</div>
                <div className="mt-2 text-sm text-slate-200">docente@learnsoft.edu</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Contraseña</div>
                <div className="mt-2 text-sm text-slate-200">••••••••••</div>
              </div>
            </div>

            <motion.div
              className="overflow-hidden rounded-2xl bg-cyan-500"
              initial={{ scaleX: 0.35 }}
              animate={{ scaleX: [0.35, 0.98, 1] }}
              transition={{ duration: 2.2, ease: "easeOut" }}
              style={{ originX: 0 }}
            >
              <div className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-slate-950">
                <MousePointerClick className="h-4 w-4" />
                Ingresando
              </div>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function Sidebar({ currentPhase }: { currentPhase: Phase }) {
  const items = [
    { label: "Inicio", icon: Globe },
    { label: "TutorIA", icon: MessageSquareMore },
    { label: "Métricas", icon: LineChartIcon, active: true },
    { label: "Contenidos", icon: FileText },
    { label: "Ajustes", icon: Sparkles },
  ];

  return (
    <aside className="relative hidden w-[290px] flex-col border-r border-white/10 bg-slate-950/55 px-4 py-5 backdrop-blur-xl lg:flex">
      <div className="flex items-center gap-3">
        <LearnSoftLogo variant="glass" size="md" withText className="text-white" />
      </div>

      <div className="mt-8 space-y-1">
        {items.map((item, index) => {
          const active = item.active;
          return (
            <div
              key={item.label}
              className={cn(
                "relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-all",
                active
                  ? "bg-cyan-500/12 text-cyan-100 ring-1 ring-cyan-400/30"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-100",
              )}
            >
              <item.icon className={cn("h-4 w-4", active && "text-cyan-300")} />
              <span className="font-medium">{item.label}</span>
              {active && (
                <motion.span
                  className="absolute inset-0 rounded-2xl bg-cyan-400/10"
                  animate={{ opacity: [0.25, 0.5, 0.25] }}
                  transition={{ duration: 2.2, repeat: Infinity }}
                />
              )}

              {active && currentPhase >= 1 && (
                <motion.div
                  className="absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.9)]"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                />
              )}
              {active && currentPhase >= 1 && (
                <motion.div
                  className="absolute -right-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full border border-cyan-300/40"
                  animate={{ scale: [0.9, 1.08, 0.95] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                />
              )}
              {active && currentPhase >= 1 && index === 2 && (
                <motion.div
                  className="absolute -left-2 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-cyan-300"
                  initial={{ x: 0, y: -8 }}
                  animate={{ x: 0, y: 0 }}
                  transition={{ duration: 0.7 }}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-auto rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Demo en video</div>
        <div className="mt-2 text-sm font-medium text-slate-100">40 segundos de recorrido visual</div>
        <div className="mt-3 h-2 rounded-full bg-slate-800">
          <motion.div
            className="h-2 rounded-full bg-cyan-400"
            animate={{ width: `${Math.min((currentPhase + 1) * 16.5, 100)}%` }}
            transition={{ duration: 0.7 }}
          />
        </div>
      </div>
    </aside>
  );
}

function MetricTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: ElementType;
}) {
  return (
    <motion.div
      className="rounded-3xl border border-white/8 bg-white/6 p-5 shadow-[0_16px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55 }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">{label}</p>
          <div className="mt-3 text-4xl font-semibold tracking-tight text-white">
            {formatNumber(value)}
          </div>
        </div>
        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-200">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </motion.div>
  );
}

function LineDemo({ active }: { active: boolean }) {
  const [cursorIndex, setCursorIndex] = useState(0);

  useEffect(() => {
    if (!active) {
      setCursorIndex(0);
      return;
    }

    const id = window.setInterval(() => {
      setCursorIndex((current) => (current + 1) % activitySeries.length);
    }, 180);

    return () => window.clearInterval(id);
  }, [active]);

  const point = activitySeries[cursorIndex];
  const cursorLeft = `${(cursorIndex / (activitySeries.length - 1)) * 100}%`;

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Actividad diaria</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Crecimiento sostenido durante 30 días</h3>
        </div>
        <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-100">
          Zoom suave y tooltip
        </Badge>
      </div>

      <motion.div
        className="relative h-[340px] rounded-[1.7rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_55%),linear-gradient(180deg,rgba(2,6,23,0.85),rgba(15,23,42,0.95))] p-4"
        animate={{ scale: [0.98, 1.015, 1] }}
        transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 0.8 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={activitySeries}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" />
            <XAxis dataKey="day" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              content={({ active, payload }) => (
                <div className={cn(
                  "rounded-2xl border border-cyan-400/20 bg-slate-950/95 px-3 py-2 shadow-2xl shadow-black/40 backdrop-blur-xl transition-opacity",
                  active ? "opacity-100" : "opacity-0",
                )}>
                  <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Actividad</div>
                  <div className="mt-1 text-sm font-semibold text-white">
                    {payload?.[0]?.payload?.day ?? point.day}
                  </div>
                  <div className="text-cyan-200">{formatNumber(payload?.[0]?.value as number ?? point.value)} eventos</div>
                </div>
              )}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#22d3ee"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 7, stroke: "#0f172a", strokeWidth: 3, fill: "#67e8f9" }}
              isAnimationActive
              animationDuration={1800}
            />
          </LineChart>
        </ResponsiveContainer>

        <motion.div
          className="pointer-events-none absolute inset-y-4 w-px bg-cyan-300/70 shadow-[0_0_18px_rgba(34,211,238,0.95)]"
          animate={{ left: cursorLeft }}
          transition={{ duration: 0.16, ease: "linear" }}
        />
        <motion.div
          className="pointer-events-none absolute"
          style={{ left: cursorLeft, top: 26 }}
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        >
          <div className="relative -translate-x-1/2">
            <div className="absolute -inset-3 rounded-full bg-cyan-400/20 blur-md" />
            <div className="relative rounded-2xl border border-cyan-300/30 bg-slate-950/95 px-3 py-2 text-center shadow-[0_18px_50px_rgba(0,0,0,0.4)]">
              <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">{point.day}</div>
              <div className="text-sm font-semibold text-white">{formatNumber(point.value)}</div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function PieDemo({ active }: { active: boolean }) {
  const [sliceCount, setSliceCount] = useState(0);

  useEffect(() => {
    if (!active) {
      setSliceCount(0);
      return;
    }

    setSliceCount(1);
    const ids = [
      window.setTimeout(() => setSliceCount(2), 650),
      window.setTimeout(() => setSliceCount(3), 1300),
      window.setTimeout(() => setSliceCount(4), 1950),
    ];

    return () => ids.forEach((id) => window.clearTimeout(id));
  }, [active]);

  const arcs = useMemo(() => {
    const cx = 180;
    const cy = 180;
    const r = 126;
    let start = -90;

    return aiUsage.map((item, index) => {
      const sweep = (item.value / 100) * 360;
      const end = start + sweep;
      const d = buildSectorPath(cx, cy, r, start, end);
      const mid = start + sweep / 2;
      const labelPos = polarToCartesian(cx, cy, r + 40, mid);
      const show = index < sliceCount;

      const itemColor = item.color;
      start = end;
      return {
        ...item,
        d,
        labelPos,
        show,
        itemColor,
      };
    });
  }, [sliceCount]);

  return (
    <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/50 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Uso de IA</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Distribución por dominio de consulta</h3>
          </div>
          <Badge className="border-violet-500/20 bg-violet-500/10 text-violet-100">Entrada por segmentos</Badge>
        </div>

        <div className="relative mt-4 h-[360px] rounded-[1.7rem] border border-white/10 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.08),transparent_55%),linear-gradient(180deg,rgba(2,6,23,0.88),rgba(15,23,42,0.95))] p-4">
          <svg viewBox="0 0 360 360" className="h-full w-full overflow-visible">
            <g transform="translate(0 0)">
              {arcs.map((arc, index) => (
                <motion.path
                  key={arc.label}
                  d={arc.d}
                  fill={arc.itemColor}
                  stroke="rgba(15,23,42,0.85)"
                  strokeWidth={4}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: arc.show ? 1 : 0, scale: arc.show ? 1 : 0.92 }}
                  transition={{ duration: 0.55, delay: index * 0.14 }}
                  style={{ transformOrigin: "180px 180px" }}
                />
              ))}

              <circle cx="180" cy="180" r="68" fill="rgba(2,6,23,0.86)" stroke="rgba(148,163,184,0.18)" />
              <text x="180" y="170" textAnchor="middle" fill="#e2e8f0" fontSize="18" fontWeight="700">
                TutorIA
              </text>
              <text x="180" y="192" textAnchor="middle" fill="#94a3b8" fontSize="11">
                Consultas por temática
              </text>
            </g>
          </svg>

          <div className="absolute inset-x-6 bottom-6 grid grid-cols-2 gap-3 text-xs text-slate-300 md:grid-cols-4">
            {aiUsage.map((item, index) => (
              <div
                key={item.label}
                className={cn(
                  "rounded-2xl border px-3 py-2 transition-all",
                  index < sliceCount
                    ? "border-white/10 bg-white/8 text-white"
                    : "border-white/5 bg-white/5 text-slate-400",
                )}
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                  <span className="font-medium">{item.label}</span>
                </div>
                <div className="text-lg font-semibold text-white">{item.value}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-slate-950/50 p-5">
        <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Lectura inteligente</p>
        <div className="mt-4 space-y-3">
          {aiUsage.map((item, index) => (
            <motion.div
              key={item.label}
              className="rounded-2xl border border-white/10 bg-white/6 p-4"
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: index < sliceCount ? 1 : 0.35, x: index < sliceCount ? 0 : 18 }}
              transition={{ duration: 0.45, delay: index * 0.12 }}
            >
              <div className="text-sm font-semibold text-white">{item.label}</div>
              <div className="mt-1 text-sm text-slate-400">
                {item.label === "Programación" && "Mayor demanda de explicaciones paso a paso y correcciones de código."}
                {item.label === "Matemática" && "Consultas frecuentes sobre resolución y visualización de ejercicios."}
                {item.label === "Física" && "Uso constante, pero concentrado en preguntas puntuales."}
                {item.label === "Otros" && "Casos esporádicos de repaso y orientación general."}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DocsAndPerformance({ active }: { active: boolean }) {
  const [visibleRows, setVisibleRows] = useState(0);

  useEffect(() => {
    if (!active) {
      setVisibleRows(0);
      return;
    }

    setVisibleRows(1);
    const ids = documents.slice(1).map((_, index) =>
      window.setTimeout(() => setVisibleRows(index + 2), 420 * (index + 1)),
    );
    return () => ids.forEach((id) => window.clearTimeout(id));
  }, [active]);

  return (
    <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
      <div className="rounded-[2rem] border border-white/10 bg-slate-950/50 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Documentos más consultados</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Lecturas que más sostienen sesiones largas</h3>
          </div>
          <Badge className="border-cyan-500/20 bg-cyan-500/10 text-cyan-100">Top documentos</Badge>
        </div>

        <div className="mt-4 overflow-hidden rounded-[1.7rem] border border-white/10">
          <table className="w-full border-collapse">
            <thead className="bg-white/[0.04] text-left text-[11px] uppercase tracking-[0.24em] text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Documento</th>
                <th className="px-4 py-3 font-medium">Consultas</th>
                <th className="px-4 py-3 font-medium">Tiempo medio</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc, index) => (
                <motion.tr
                  key={doc.name}
                  className="border-t border-white/8 bg-slate-950/20"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: index < visibleRows ? 1 : 0.18, y: index < visibleRows ? 0 : 12 }}
                  transition={{ duration: 0.45, delay: index * 0.12 }}
                >
                  <td className="px-4 py-4">
                    <div className="font-medium text-white">{doc.name}</div>
                  </td>
                  <td className="px-4 py-4 text-slate-300">{doc.sessions}</td>
                  <td className="px-4 py-4 text-slate-300">{doc.time}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-5">
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/50 p-5">
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Rendimiento del sistema</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {performanceCards.map((item, index) => (
              <motion.div
                key={item.label}
                className="rounded-2xl border border-emerald-400/18 bg-emerald-400/8 p-4"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: index < 4 ? 1 : 0.3, y: 0 }}
                transition={{ duration: 0.45, delay: index * 0.1 }}
              >
                <div className="flex items-center gap-2 text-emerald-200">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-[11px] uppercase tracking-[0.24em]">{item.label}</span>
                </div>
                <div className="mt-3 text-3xl font-semibold text-white">{item.value}</div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-slate-950/50 p-5">
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Actividad reciente</p>
          <div className="mt-4 grid gap-3">
            {performanceCards.map((item, index) => (
              <div key={item.label} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                <div className="text-sm text-slate-300">{item.label}</div>
                <div className="rounded-full bg-emerald-400/15 px-3 py-1 text-sm font-semibold text-emerald-200">
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function InsightsPanel() {
  return (
    <motion.div
      className="rounded-[2rem] border border-cyan-400/15 bg-[linear-gradient(180deg,rgba(8,15,31,0.9),rgba(8,15,31,0.55))] p-6 shadow-[0_25px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65 }}
    >
      <div className="flex items-center gap-3">
        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-200">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Insights inteligentes</p>
          <h3 className="mt-1 text-xl font-semibold text-white">Lectura sugerida por IA</h3>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {insights.map((item, index) => (
          <motion.div
            key={item}
            className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/5 p-4"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: index * 0.16 }}
          >
            <div className="mt-1 h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.75)]" />
            <p className="text-sm leading-6 text-slate-200">{item}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export default function TutoriaMetricsDemoPage() {
  const [phase, setPhase] = useState<Phase>(0);
  const totalProgress = useMemo(() => {
    return timeline.slice(0, phase + 1).reduce((acc, item) => acc + item.duration, 0);
  }, [phase]);
  const totalDuration = timeline.reduce((acc, item) => acc + item.duration, 0);

  const countUsers = useCountUp(kpiTargets[0].value, phase >= 1);
  const countChats = useCountUp(kpiTargets[1].value, phase >= 1);
  const countDocs = useCountUp(kpiTargets[2].value, phase >= 1);
  const countQuestions = useCountUp(kpiTargets[3].value, phase >= 1);

  useEffect(() => {
    const timeouts = timeline.map((item, index) =>
      window.setTimeout(() => setPhase(index as Phase), timeline.slice(0, index).reduce((acc, step) => acc + step.duration, 0)),
    );

    const finalTimeout = window.setTimeout(() => setPhase(5), totalDuration);

    return () => {
      timeouts.forEach((id) => window.clearTimeout(id));
      window.clearTimeout(finalTimeout);
    };
  }, [totalDuration]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07111f] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:28px_28px] opacity-20" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.12),transparent_28%)]" />
      <div className="relative flex min-h-screen">
        <Sidebar currentPhase={phase} />

        <main className="relative flex min-h-screen flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-white/8 bg-slate-950/45 px-4 py-3 backdrop-blur-xl lg:px-7">
            <div className="flex items-center gap-3">
              <LearnSoftLogo variant="glass" size="md" withText className="text-white" />
              <div className="hidden h-8 w-px bg-white/10 md:block" />
              <div className="hidden flex-col md:flex">
                <span className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Sección</span>
                <span className="text-sm text-slate-200">TutorIA / Métricas</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge className="border-cyan-500/20 bg-cyan-500/10 text-cyan-100">
                Video demo
              </Badge>
              <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-100">
                {Math.min(45, Math.round((totalProgress / totalDuration) * 45))} s aprox.
              </Badge>
            </div>
          </div>

          <div className="flex-1 p-4 lg:p-6">
            <AnimatePresence mode="wait">
              {phase === 0 ? (
                <DemoLoginCard key="login" />
              ) : (
                <motion.div
                  key="dashboard"
                  className="relative space-y-5"
                  initial={{ opacity: 0, scale: 1.01 }}
                  animate={{ opacity: 1, scale: phase === 5 ? 0.95 : 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.65 }}
                >
                  <motion.div
                    className="rounded-[2rem] border border-white/10 bg-slate-950/50 p-5 shadow-[0_25px_90px_rgba(0,0,0,0.28)] backdrop-blur-xl"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                      <div className="max-w-3xl">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <Badge className="border-cyan-500/20 bg-cyan-500/10 text-cyan-100">
                            <MousePointerClick className="mr-1.5 h-3.5 w-3.5" />
                            Click en Métricas
                          </Badge>
                          <Badge className="border-white/10 bg-white/5 text-slate-200">
                            <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
                            Últimos 30 días
                          </Badge>
                        </div>
                        <h1 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">
                          Métricas de TutorIA
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
                          Analizá el uso real de la plataforma con una lectura ejecutiva, actividad diaria,
                          distribución temática de IA, documentos más consultados y salud operativa.
                        </p>
                      </div>
                      <div className="grid gap-2 text-right">
                        <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Recorrido</div>
                        <div className="text-sm text-slate-200">{timeline[Math.min(phase, 5)].label}</div>
                        <div className="h-2 w-56 rounded-full bg-white/8">
                          <motion.div
                            className="h-2 rounded-full bg-cyan-400"
                            animate={{ width: `${Math.min(100, ((phase + 1) / 6) * 100)}%` }}
                            transition={{ duration: 0.7 }}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {phase >= 1 && (
                    <motion.section
                      className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6 }}
                    >
                      <MetricTile label={kpiTargets[0].label} value={countUsers} icon={kpiTargets[0].icon} />
                      <MetricTile label={kpiTargets[1].label} value={countChats} icon={kpiTargets[1].icon} />
                      <MetricTile label={kpiTargets[2].label} value={countDocs} icon={kpiTargets[2].icon} />
                      <MetricTile label={kpiTargets[3].label} value={countQuestions} icon={kpiTargets[3].icon} />
                    </motion.section>
                  )}

                  {phase >= 2 && (
                    <LineDemo active={phase >= 2} />
                  )}

                  {phase >= 3 && (
                    <PieDemo active={phase >= 3} />
                  )}

                  {phase >= 4 && (
                    <DocsAndPerformance active={phase >= 4} />
                  )}

                  {phase >= 5 && (
                    <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
                      <InsightsPanel />

                      <motion.div
                        className="relative flex min-h-[340px] items-center justify-center overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.14),transparent_38%),linear-gradient(180deg,rgba(2,6,23,0.96),rgba(15,23,42,0.98))] p-8"
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                      >
                        <motion.div
                          className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.1),transparent_35%)]"
                          animate={{ opacity: [0.45, 0.7, 0.45] }}
                          transition={{ duration: 3, repeat: Infinity }}
                        />
                        <div className="relative text-center">
                          <LearnSoftLogo variant="glass" size="xl" withText className="justify-center text-white" />
                          <div className="mx-auto mt-6 max-w-md text-sm leading-6 text-slate-300">
                            <span className="font-medium text-white">Conocé cómo aprenden tus estudiantes con métricas impulsadas por IA.</span>
                          </div>
                          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                            <Button className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
                              Explorar métricas
                            </Button>
                            <Button variant="outline" className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10">
                              Ver demo otra vez
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {phase >= 5 && (
        <motion.div
          className="pointer-events-none fixed inset-0 flex items-center justify-center bg-slate-950/50 backdrop-blur-[1px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.9, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <LearnSoftLogo variant="glass" size="xl" withText className="justify-center text-white" />
            <p className="mt-6 text-base text-slate-200">
              Conocé cómo aprenden tus estudiantes con métricas impulsadas por IA.
            </p>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
