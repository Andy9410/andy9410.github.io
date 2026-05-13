import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, UserPlus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/auth/useAuth'
import AuthLayout from '@/components/auth/AuthLayout'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

const schema = z
  .object({
    name:            z.string().min(2, 'Mínimo 2 caracteres'),
    email:           z.string().email('Email inválido'),
    password:        z.string().min(8, 'Mínimo 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine(d => d.password === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>

const inputClass = [
  'w-full rounded-xl px-4 py-3 text-sm text-slate-800 outline-none transition-all duration-200',
  'placeholder:text-slate-400',
  'bg-white border border-slate-200',
  'focus:border-[hsl(170,80%,50%)] focus:ring-2 focus:ring-[hsla(170,80%,50%,0.15)] focus:bg-white',
].join(' ')

export default function RegisterPage() {
  const { register }              = useAuth()
  const navigate                  = useNavigate()
  const [show, setShow]           = useState(false)
  const [serverErr, setServerErr] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  })
  const { isSubmitting } = form.formState

  async function onSubmit(v: FormValues) {
    setServerErr(null)
    try {
      await register({ name: v.name, email: v.email, password: v.password })
      navigate('/chat', { replace: true })
    } catch (e) {
      setServerErr(e instanceof Error ? e.message : 'Error inesperado')
    }
  }

  return (
    <AuthLayout mode="register">

      {/* Header */}
      <div className="mb-6">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest" style={{ color: 'hsl(170,80%,50%)' }}>
          Empezá hoy
        </p>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Creá tu cuenta</h2>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3.5">

          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(221,70%,55%)' }}>
                Nombre completo
              </FormLabel>
              <FormControl>
                <input placeholder="Juan Pérez" autoComplete="name"
                  className={inputClass} {...field} />
              </FormControl>
              <FormMessage className="text-xs text-red-400 mt-1" />
            </FormItem>
          )} />

          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(221,70%,55%)' }}>
                Email
              </FormLabel>
              <FormControl>
                <input type="email" placeholder="vos@ejemplo.com" autoComplete="email"
                  className={inputClass} {...field} />
              </FormControl>
              <FormMessage className="text-xs text-red-400 mt-1" />
            </FormItem>
          )} />

          <FormField control={form.control} name="password" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(221,70%,55%)' }}>
                Contraseña
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <input type={show ? 'text' : 'password'} placeholder="Mín. 8 caracteres"
                    autoComplete="new-password" className={`${inputClass} pr-11`} {...field} />
                  <button type="button" tabIndex={-1} onClick={() => setShow(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: '#94A3B8' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#64748B')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#94A3B8')}
                  >
                    {show ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </FormControl>
              <FormMessage className="text-xs text-red-400 mt-1" />
            </FormItem>
          )} />

          <FormField control={form.control} name="confirmPassword" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(221,70%,55%)' }}>
                Confirmar contraseña
              </FormLabel>
              <FormControl>
                <input type={show ? 'text' : 'password'} placeholder="Repetí la contraseña"
                  autoComplete="new-password" className={inputClass} {...field} />
              </FormControl>
              <FormMessage className="text-xs text-red-400 mt-1" />
            </FormItem>
          )} />

          <AnimatePresence>
            {serverErr && (
              <motion.div
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden rounded-xl border px-4 py-2.5 text-sm"
                style={{ borderColor: 'rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.08)', color: '#F87171' }}
              >
                {serverErr}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={{ scale: isSubmitting ? 1 : 1.015 }}
            whileTap={{ scale: isSubmitting ? 1 : 0.985 }}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
            style={{
              background: 'linear-gradient(135deg, hsl(170,80%,44%), hsl(170,80%,56%))',
              boxShadow: '0 4px 16px hsla(170,80%,50%,0.3)',
            }}
          >
            {isSubmitting
              ? <Loader2 size={15} className="animate-spin" />
              : <><UserPlus size={14} /> Crear cuenta</>
            }
          </motion.button>
        </form>
      </Form>

      <div className="mt-5 flex items-center gap-3">
        <div className="h-px flex-1" style={{ background: 'rgba(0,0,0,0.06)' }} />
        <span className="text-xs" style={{ color: '#94A3B8' }}>¿ya tenés cuenta?</span>
        <div className="h-px flex-1" style={{ background: 'rgba(0,0,0,0.06)' }} />
      </div>

      <Link to="/login"
        className="mt-4 flex w-full items-center justify-center rounded-xl py-3 text-sm font-semibold transition-all duration-200 text-slate-500 hover:text-slate-800"
        style={{ background: '#F8FAFC', border: '1px solid rgba(0,0,0,0.08)' }}
      >
        Ingresar a mi cuenta
      </Link>
    </AuthLayout>
  )
}
