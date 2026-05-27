import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import LearnSoftLogo from './LearnSoftLogo'

interface AuthLayoutProps {
  children: ReactNode
  mode: 'login' | 'register'
}

export default function AuthLayout({ children, mode }: AuthLayoutProps) {
  return (
    <div
      className="flex min-h-screen w-full"
      style={{ fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif" }}
    >
      {/* ─── Left: imagen full-cover (solo desktop) ─────────── */}
      <div className="relative hidden lg:block lg:w-2/3">
        <img
          src="/login.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      {/* ─── Right: panel formulario ────────────────────────── */}
      <div className="relative flex w-full flex-col items-center justify-center overflow-hidden bg-slate-50 px-4 py-6 lg:w-1/3 lg:px-6 lg:py-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden lg:block"
          style={{
            background:
              'radial-gradient(circle at 20% 20%, rgba(45,212,191,0.12), transparent 32%), radial-gradient(circle at 80% 10%, rgba(37,99,235,0.1), transparent 30%), linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          }}
        />

        {/* Imagen de fondo solo en mobile */}
        <img
          src="/login.png"
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover lg:hidden"
        />

        {/* Logo + formulario en el mismo contenedor para alineación perfecta */}
        <div className="relative z-10 mx-auto w-full max-w-[540px] lg:max-w-[360px]">

          {/* Logo alineado a la izquierda del contenedor */}
          <motion.div
            className="mb-8 flex justify-center"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link to="/">
              <LearnSoftLogo variant="default" size="md" withText />
            </Link>
          </motion.div>

          {/* Formulario */}
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            {/* Card: visible en mobile, desaparece en desktop */}
            <div className="rounded-2xl border border-black/[0.07] bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06),0_1px_4px_rgba(0,0,0,0.04)] lg:contents">
              {children}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
