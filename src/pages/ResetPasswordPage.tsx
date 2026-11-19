import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AlertCircle, ArrowRight, Eye, EyeOff, Link2Off, Lock } from 'lucide-react'
import { AuthShell } from '@/components/layout/AuthShell'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { getApiErrorMessage, getApiFieldErrors } from '@/lib/api'
import { usePasswordResetConfirm } from '@/hooks/useAuth'
import { toast } from '@/stores/toast'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const uidb64 = searchParams.get('uidb64')
  const token = searchParams.get('token')
  const invalidLink = !uidb64 || !token

  const confirm = usePasswordResetConfirm()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState('')
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  if (invalidLink) {
    return (
      <AuthShell footer={<>© {new Date().getFullYear()} TaskFlow · Gestor de tareas</>}>
        <div className="mb-7 text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
            <Link2Off className="h-6 w-6" />
          </span>
          <h1 className="text-[26px] font-bold tracking-[-0.03em] text-slate-900">
            Enlace no válido
          </h1>
          <p className="mt-1.5 text-[13px] text-slate-500">
            Este enlace de recuperación es inválido o ya expiró. Solicita uno nuevo para
            continuar.
          </p>
        </div>

        <Link to="/forgot-password" className="block">
          <Button size="lg" className="w-full">
            Solicitar un nuevo enlace
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </AuthShell>
    )
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setFormError('')
    setErrors({})

    const nextErrors: Record<string, string[]> = {}
    if (!password) {
      nextErrors.new_password = ['La nueva contraseña es obligatoria.']
    } else if (password.length < 8) {
      nextErrors.new_password = ['La contraseña debe tener al menos 8 caracteres.']
    }
    if (!confirmPassword) {
      nextErrors.confirm_password = ['Debe confirmar la nueva contraseña.']
    } else if (password !== confirmPassword) {
      nextErrors.confirm_password = ['Las contraseñas no coinciden.']
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    confirm.mutate(
      {
        uidb64: uidb64 as string,
        token: token as string,
        new_password: password,
        confirm_password: confirmPassword,
      },
      {
        onSuccess: () => {
          toast.success('Contraseña actualizada', 'Inicia sesión con tu nueva contraseña.')
          navigate('/login', { replace: true })
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
        <h1 className="text-[26px] font-bold tracking-[-0.03em] text-slate-900">
          Nueva contraseña
        </h1>
        <p className="mt-1.5 text-[13px] text-slate-500">
          Crea una contraseña segura. Al guardarla, tus sesiones activas se cerrarán
        </p>
      </div>

      {formError ? (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{formError}</p>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Nueva contraseña"
          type={showPassword ? 'text' : 'password'}
          name="new_password"
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.new_password ?? errors.non_field_errors}
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

        <Button type="submit" size="lg" className="w-full !mt-6" loading={confirm.isPending}>
          Guardar nueva contraseña
          {!confirm.isPending ? <ArrowRight className="h-4 w-4" /> : null}
        </Button>
      </form>
    </AuthShell>
  )
}
