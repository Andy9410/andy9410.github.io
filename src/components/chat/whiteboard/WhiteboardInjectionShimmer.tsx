import type { CSSProperties } from "react";
import { Shimmer } from "@/components/ui/shimmer";

export function WhiteboardInjectionShimmer() {
  return (
    <div
      className="pointer-events-none absolute left-4 right-4 top-4 z-20 max-w-xl rounded-2xl border border-white/15 bg-slate-950/45 px-4 py-3 shadow-[0_18px_55px_rgba(2,6,23,0.32)] backdrop-blur-md"
      style={{
        "--shimmer-base": "rgba(240, 253, 244, 0.58)",
        "--shimmer-highlight": "rgba(255, 255, 255, 1)",
      } as CSSProperties}
      role="status"
      aria-live="polite"
      aria-label="Inyectando resolución en la pizarra"
    >
      <div className="flex items-center gap-3">
        <span className="relative h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-200 shadow-[0_0_18px_rgba(187,247,208,0.9)]">
          <span className="absolute inset-0 rounded-full bg-emerald-200/70 animate-ping" />
        </span>
        <Shimmer as="span" duration={1.35} spread={92} className="font-['Caveat'] text-xl font-semibold tracking-wide">
          Inyectando resolución en la pizarra...
        </Shimmer>
      </div>
      <div className="mt-2 grid gap-1.5 pl-5">
        <div className="h-1.5 w-4/5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-transparent via-white/55 to-transparent animate-[wb-shimmer_1.3s_ease-in-out_infinite]" />
        </div>
        <div className="h-1.5 w-2/3 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-transparent via-white/45 to-transparent animate-[wb-shimmer_1.45s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
}
