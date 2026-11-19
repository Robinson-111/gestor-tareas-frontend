import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, ArrowLeft, ArrowRight, MailCheck, Mail } from 'lucide-react'
import { AuthShell } from '@/components/layout/AuthShell'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { getApiErrorMessage, getApiFieldErrors } from '@/lib/api'
import { usePasswordReset } from '@/hooks/useAuth'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function ForgotPasswordPage() {
  const request = usePasswordReset()

  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [formError, setFormError] = useState('')
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setFormError('')
    setErrors({})

    const nextErrors: Record<string, string[]> = {}
    if (!email.trim()) {
      nextErrors.email = ['El correo electrónico es obligatorio.']
    } else if (!EMAIL_REGEX.test(email.trim())) {
      nextErrors.email = ['Ingresa un correo electrónico válido.']
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    request.mutate(
      { email: email.trim() },
      {
        onSuccess: () => setSent(true),
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

  if (sent) {
    return (
      <AuthShell footer={<>© {new Date().getFullYear()} TaskFlow · Gestor de tareas</>}>
        <div className="mb-7 text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <MailCheck className="h-6 w-6" />
          </span>
          <h1 className="text-[26px] font-bold tracking-[-0.03em] text-slate-900">
            Revisa tu correo
          </h1>
          <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
            Si <span className="font-semibold text-slate-700">{email}</span> está registrado,
            te enviamos un enlace para restablecer tu contraseña. El enlace expira en 1 hora.
          </p>
        </div>

        <div className="space-y-3">
          <Link to="/login" className="block">
            <Button size="lg" className="w-full">
              Volver a iniciar sesión
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <button
            type="button"
            onClick={() => {
              setSent(false)
              setEmail('')
            }}
            className="flex h-9 w-full items-center justify-center rounded-lg text-[12px] font-semibold text-slate-500 transition hover:text-slate-800"
          >
            Usar otro correo
          </button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell footer={<>© {new Date().getFullYear()} TaskFlow · Gestor de tareas</>}>
      <div className="mb-7 text-center">
        <h1 className="text-[26px] font-bold tracking-[-0.03em] text-slate-900">
          Recupera tu acceso
        </h1>
        <p className="mt-1.5 text-[13px] text-slate-500">
          Escribe tu correo y te enviaremos un enlace para crear una nueva contraseña
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
          label="Correo electrónico"
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

        <Button type="submit" size="lg" className="w-full !mt-6" loading={request.isPending}>
          Enviar enlace de recuperación
          {!request.isPending ? <ArrowRight className="h-4 w-4" /> : null}
        </Button>
      </form>

      <Link
        to="/login"
        className="mt-6 flex items-center justify-center gap-1.5 text-[12px] font-semibold text-slate-500 transition hover:text-slate-800"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Volver a iniciar sesión
      </Link>
    </AuthShell>
  )
}
