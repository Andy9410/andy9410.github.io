import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Code2, BookOpen, Sparkles, Brain, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import LearnSoftLogo from './LearnSoftLogo'

const T = {
  accent:       'hsl(170,80%,50%)',
  accentLight:  'hsl(170,80%,65%)',
  accentDark:   'hsl(170,80%,38%)',
  accentGlow:   'hsla(170,80%,50%,0.25)',
  accentSoft:   'hsla(170,80%,50%,0.08)',
  accentBorder: 'hsla(170,80%,50%,0.25)',
  panelLeft:    '#F0F4FF',
  panelRight:   '#FFFFFF',
  card:         '#FFFFFF',
  cardBorder:   'rgba(0,0,0,0.07)',
  grid:         'hsla(170,80%,50%,0.07)',
  text:         '#0F172A',
  textSub:      'hsl(221,70%,45%)',
  muted:        'hsl(221,70%,55%)',
  faint:        'hsl(221,60%,65%)',
  featureBg:    '#F8FAFF',
  featureBorder:'hsla(170,80%,50%,0.15)',
}

interface AuthLayoutProps {
  children: ReactNode
  mode: 'login' | 'register'
}

const features = [
  { icon: Code2,    label: 'Mentoría en programación', desc: 'Clases 1:1 personalizadas' },
  { icon: Brain,    label: 'Tutor IA adaptativo',      desc: 'Aprende a tu ritmo' },
  { icon: BookOpen, label: 'Currículum estructurado',  desc: 'Desde cero hasta profesional' },
  { icon: Sparkles, label: 'Proyectos reales',         desc: 'Portfolio desde el día 1' },
]

const codeLines = [
  'const learn = () => grow()',
  'import { mentor } from "learnsoft"',
  'while (curious) { code() }',
  'fn solve(problem: Problem)',
  'git commit -m "new skill"',
  'export default Developer',
]

export default function AuthLayout({ children, mode }: AuthLayoutProps) {
  return (
    <div
      className="flex min-h-screen w-full"
      style={{ fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif", background: '#FFFFFF' }}
    >
      {/* ─── Left: Branding Panel ─────────────────────────────── */}
      <div
        className="relative hidden lg:flex lg:w-[58%] flex-col overflow-hidden"
        style={{ background: `linear-gradient(150deg, #EEF2FF 0%, #F0F4FF 50%, #E8EFFE 100%)` }}
      >
        {/* Grid */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(${T.grid} 1px, transparent 1px),
              linear-gradient(90deg, ${T.grid} 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Orbs */}
        <motion.div
          className="pointer-events-none absolute rounded-full"
          style={{
            width: 480, height: 480, top: -140, left: -140,
            background: `radial-gradient(circle, hsla(170,80%,60%,0.18), transparent 65%)`,
            filter: 'blur(80px)',
          }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="pointer-events-none absolute rounded-full"
          style={{
            width: 300, height: 300, bottom: 40, right: -60,
            background: `radial-gradient(circle, hsla(253,60%,70%,0.15), transparent 65%)`,
            filter: 'blur(60px)',
          }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        />

        {/* Floating code lines */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {codeLines.map((line, i) => (
            <motion.div
              key={i}
              className="absolute whitespace-nowrap font-mono"
              style={{
                top: `${12 + i * 13}%`,
                left: `${i % 2 === 0 ? -5 : 55}%`,
                color: `hsla(170,80%,45%,${0.07 + (i % 3) * 0.03})`,
                fontSize: '11px',
              }}
              animate={{ x: i % 2 === 0 ? [0, 10, 0] : [0, -10, 0], opacity: [0.5, 0.9, 0.5] }}
              transition={{ duration: 6 + i * 1.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.8 }}
            >
              {line}
            </motion.div>
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full px-14 py-12">

          {/* Logo */}
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Link to="/">
              <LearnSoftLogo variant="default" size="md" withText />
            </Link>
          </motion.div>

          {/* Hero */}
          <motion.div
            className="flex flex-col gap-8"
            initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {/* Isotipo + badge */}
            <div className="flex items-center gap-4">
              <div
                className="flex items-center justify-center rounded-2xl"
                style={{
                  width: 72, height: 72,
                  background: '#FFFFFF',
                  border: `1px solid ${T.accentBorder}`,
                  boxShadow: `0 0 24px ${T.accentGlow}, 0 4px 16px rgba(0,0,0,0.06)`,
                }}
              >
                <span
                  className="text-2xl font-black tracking-tighter"
                  style={{ color: 'hsl(221,80%,50%)' }}
                >
                  {'</>'}
                </span>
              </div>
              <div
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
                style={{ background: 'hsla(221,80%,50%,0.08)', border: '1px solid hsla(221,80%,50%,0.25)', color: 'hsl(221,80%,50%)' }}
              >
                <Sparkles size={11} />
                Plataforma SaaS educativa
              </div>
            </div>

            {/* Headline */}
            <div className="flex flex-col gap-3">
              <h1 className="text-4xl xl:text-[44px] font-extrabold leading-[1.1] tracking-tight" style={{ color: T.text }}>
                Tu carrera en tech,{' '}
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: `linear-gradient(90deg, ${T.accent}, ${T.accentLight})` }}
                >
                  empieza acá
                </span>
              </h1>
              <p className="text-sm leading-relaxed max-w-sm" style={{ color: T.muted }}>
                Mentoría 1:1, tutor IA y proyectos reales. Todo lo que necesitás para pasar de cero a profesional.
              </p>
            </div>

            {/* Features grid */}
            <div className="grid grid-cols-2 gap-3">
              {features.map(({ icon: Icon, label, desc }) => (
                <div
                  key={label}
                  className="flex items-start gap-3 rounded-xl p-3"
                  style={{ background: T.featureBg, border: `1px solid ${T.featureBorder}` }}
                >
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg mt-0.5"
                    style={{ background: T.accentSoft, border: `1px solid ${T.accentBorder}` }}
                  >
                    <Icon size={13} style={{ color: T.accent }} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold leading-tight" style={{ color: T.text }}>{label}</p>
                    <p className="text-xs mt-0.5" style={{ color: T.muted }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-semibold transition-opacity hover:opacity-70 w-fit"
              style={{ color: 'hsl(221,80%,50%)' }}
            >
              Conocer LearnSoft <ArrowRight size={13} />
            </Link>
          </motion.div>

          {/* Footer */}
          <motion.p
            className="text-xs"
            style={{ color: 'hsl(221,80%,50%)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.5 }}
          >
            © {new Date().getFullYear()} LearnSoft · learnsoft.uy
          </motion.p>
        </div>
      </div>

      {/* ─── Right: Form Panel ────────────────────────────────── */}
      <div
        className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-[42%]"
        style={{ background: '#FFFFFF' }}
      >
        {/* Mobile logo */}
        <div className="mb-10 lg:hidden">
          <LearnSoftLogo variant="default" size="md" withText />
        </div>

        <motion.div
          key={mode}
          className="w-full max-w-[360px]"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div
            className="rounded-2xl p-8"
            style={{
              background: '#FFFFFF',
              border: `1px solid rgba(0,0,0,0.07)`,
              boxShadow: '0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)',
            }}
          >
            {children}
          </div>

          <p className="mt-5 text-center text-xs" style={{ color: T.faint }}>
            learnsoft.uy
          </p>
        </motion.div>
      </div>
    </div>
  )
}
