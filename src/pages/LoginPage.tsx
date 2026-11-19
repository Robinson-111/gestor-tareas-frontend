import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { AuthShell } from '@/components/layout/AuthShell'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { getApiErrorMessage, getApiFieldErrors } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { useLogin } from '@/hooks/useAuth'

interface LocationState {
  from?: { pathname?: string }
}

export function LoginPage() {
  const access = useAuthStore((state) => state.access)
  const login = useLogin()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as LocationState | null)?.from?.pathname ?? '/modules'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState('')
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  if (access) return <Navigate to="/modules" replace />

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setFormError('')
    setErrors({})

    const nextErrors: Record<string, string[]> = {}
    if (!email.trim()) nextErrors.email = ['El correo electrónico es obligatorio.']
    if (!password) nextErrors.password = ['La contraseña es obligatoria.']

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    login.mutate(
      { email: email.trim(), password },
      {
        onSuccess: () => navigate(from, { replace: true }),
        onError: (error) => {
          const fieldErrors = getApiFieldErrors(error)
          setErrors(fieldErrors)
          if (Object.keys(fieldErrors).length === 0) {
            setFormError(getApiErrorMessage(error))
          }
        },
      },
    )
  }

  return (
    <AuthShell footer={<>© {new Date().getFullYear()} TaskFlow · Gestor de tareas</>}>
      <div className="mb-7 text-center">
        <h1 className="text-[26px] font-bold tracking-[-0.03em] text-slate-900">
          Bienvenido de nuevo
        </h1>
        <p className="mt-1.5 text-[13px] text-slate-500">
          Inicia sesión para acceder a tus módulos de equipo
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-slate-100/80 p-1">
        <span className="flex h-9 items-center justify-center rounded-lg bg-white text-[12px] font-semibold text-slate-900 shadow-sm">
          Iniciar Sesión
        </span>
        <Link
          to="/register"
          className="flex h-9 items-center justify-center rounded-lg text-[12px] font-semibold text-slate-500 transition hover:text-slate-800"
        >
          Crear Cuenta
        </Link>
      </div>

      {formError ? (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{formError}</p>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="email" className="text-[12px] font-semibold text-slate-700">
              Correo electrónico
            </label>
            <span className="text-[10px] text-slate-400">Obligatorio</span>
          </div>
          <Input
            id="email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="ana@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={errors.email ?? errors.non_field_errors}
            leftIcon={<Mail className="h-4 w-4" />}
            className="h-10"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="text-[12px] font-semibold text-slate-700">
              Contraseña
            </label>
            <Link
              to="/forgot-password"
              className="text-[11px] font-semibold text-brand-600 transition hover:text-brand-700"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={errors.password}
            leftIcon={<Lock className="h-4 w-4" />}
            className="h-10"
            rightSlot={
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />
        </div>

        <Button type="submit" size="lg" className="w-full" loading={login.isPending}>
          Iniciar Sesión
          {!login.isPending ? <ArrowRight className="h-4 w-4" /> : null}
        </Button>
      </form>

      <p className="mt-6 text-center text-[12px] text-slate-500">
        ¿No tienes una cuenta?{' '}
        <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">
          Crear cuenta
        </Link>
      </p>
    </AuthShell>
  )
}
