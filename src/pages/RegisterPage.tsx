import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowRight, Eye, EyeOff, Lock, Mail, User } from 'lucide-react'
import { AuthShell } from '@/components/layout/AuthShell'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { getApiErrorMessage, getApiFieldErrors } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { useRegister } from '@/hooks/useAuth'
import { toast } from '@/stores/toast'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function RegisterPage() {
  const access = useAuthStore((state) => state.access)
  const register = useRegister()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState('')
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  if (access) return <Navigate to="/modules" replace />

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setFormError('')
    setErrors({})

    const nextErrors: Record<string, string[]> = {}
    if (!name.trim()) nextErrors.name = ['El nombre es obligatorio.']
    if (!email.trim()) {
      nextErrors.email = ['El correo electrónico es obligatorio.']
    } else if (!EMAIL_REGEX.test(email.trim())) {
      nextErrors.email = ['Ingresa un correo electrónico válido.']
    }
    if (!password) {
      nextErrors.password = ['La contraseña es obligatoria.']
    } else if (password.length < 8) {
      nextErrors.password = ['La contraseña debe tener al menos 8 caracteres.']
    }
    if (password !== confirmPassword) {
      nextErrors.confirm_password = ['Las contraseñas no coinciden.']
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    register.mutate(
      {
        name: name.trim(),
        email: email.trim(),
        password,
        confirm_password: confirmPassword,
      },
      {
        onSuccess: () => {
          toast.success('Cuenta creada', 'Ya formas parte de TaskFlow.')
          navigate('/modules', { replace: true })
        },
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
        <h1 className="text-[26px] font-bold tracking-[-0.03em] text-slate-900">Crea tu cuenta</h1>
        <p className="mt-1.5 text-[13px] text-slate-500">
          Empieza a organizar tus módulos y tareas en minutos
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-slate-100/80 p-1">
        <Link
          to="/login"
          className="flex h-9 items-center justify-center rounded-lg text-[12px] font-semibold text-slate-500 transition hover:text-slate-800"
        >
          Iniciar Sesión
        </Link>
        <span className="flex h-9 items-center justify-center rounded-lg bg-white text-[12px] font-semibold text-slate-900 shadow-sm">
          Crear Cuenta
        </span>
      </div>

      {formError ? (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{formError}</p>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Nombre completo"
          name="name"
          autoComplete="name"
          placeholder="Ana Torres"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={errors.name}
          leftIcon={<User className="h-4 w-4" />}
          className="h-10"
        />

        <Input
          label="Correo electrónico"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="ana@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
          leftIcon={<Mail className="h-4 w-4" />}
          className="h-10"
        />

        <Input
          label="Contraseña"
          type={showPassword ? 'text' : 'password'}
          name="password"
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
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

        <Input
          label="Confirmar contraseña"
          type={showPassword ? 'text' : 'password'}
          name="confirm_password"
          autoComplete="new-password"
          placeholder="Repite la contraseña"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          error={errors.confirm_password}
          leftIcon={<Lock className="h-4 w-4" />}
          className="h-10"
        />

        <Button type="submit" size="lg" className="w-full !mt-6" loading={register.isPending}>
          Crear Cuenta
          {!register.isPending ? <ArrowRight className="h-4 w-4" /> : null}
        </Button>
      </form>

      <p className="mt-6 text-center text-[12px] text-slate-500">
        ¿Ya tienes una cuenta?{' '}
        <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
          Iniciar sesión
        </Link>
      </p>
    </AuthShell>
  )
}
