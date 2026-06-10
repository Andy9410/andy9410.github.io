export function WhiteboardInjectionShimmer() {
  return (
    <div
      className="pointer-events-none absolute left-4 right-4 top-4 z-20 max-w-xl rounded-2xl border border-white/12 bg-slate-950/40 px-4 py-3 shadow-[0_18px_55px_rgba(2,6,23,0.26)] backdrop-blur-md"
      role="status"
      aria-live="polite"
      aria-label="Planificando la resolución antes de mostrarla en la pizarra"
    >
      <div className="flex items-center gap-3">
        <span className="relative flex h-3 w-3 shrink-0 items-center justify-center">
          <span className="absolute h-3 w-3 rounded-full bg-emerald-200/30 animate-ping" />
          <span className="h-2 w-2 rounded-full bg-emerald-100 shadow-[0_0_14px_rgba(209,250,229,0.7)]" />
        </span>
        <span className="font-['Caveat'] text-xl font-semibold tracking-wide text-emerald-50/90">
          Planificando el paso a paso...
        </span>
      </div>
      <div className="mt-2 grid gap-1.5 pl-5">
        <div className="h-1.5 w-4/5 rounded-full bg-white/12 animate-pulse" />
        <div className="h-1.5 w-2/3 rounded-full bg-white/10 animate-pulse [animation-delay:160ms]" />
      </div>
    </div>
  );
}
