import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToastStore, type ToastVariant } from '@/stores/toast'

const VARIANTS: Record<ToastVariant, { icon: typeof CheckCircle2; styles: string }> = {
  success: {
    icon: CheckCircle2,
    styles: 'text-emerald-600 bg-emerald-50 ring-emerald-600/10',
  },
  error: {
    icon: XCircle,
    styles: 'text-red-600 bg-red-50 ring-red-600/10',
  },
  info: {
    icon: Info,
    styles: 'text-brand-600 bg-brand-50 ring-brand-600/10',
  },
}

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts)
  const remove = useToastStore((state) => state.remove)

  return (
    <div
      className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:items-end"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((item) => {
        const variant = VARIANTS[item.variant]
        const Icon = variant.icon

        return (
          <div
            key={item.id}
            className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-float animate-slide-up"
            role="status"
          >
            <span
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset',
                variant.styles,
              )}
            >
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">{item.title}</p>
              {item.description ? (
                <p className="mt-0.5 text-sm text-slate-500">{item.description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => remove(item.id)}
              className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Cerrar notificación"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
