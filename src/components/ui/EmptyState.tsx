import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  secondaryAction?: ReactNode
  compact?: boolean
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  compact,
}: EmptyStateProps) {
  return (
    <div
      className={
        compact
          ? 'flex flex-col items-center justify-center px-6 py-10 text-center'
          : 'flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-white px-6 py-16 text-center shadow-card'
      }
    >
      <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100/60 text-brand-500 ring-1 ring-inset ring-brand-100">
        <Icon className="h-7 w-7" />
        <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-400 text-white">
          <span className="h-1.5 w-1.5 rounded-full bg-white" />
        </span>
      </span>
      <h3 className="mt-5 text-lg font-bold tracking-tight text-slate-900">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">{description}</p>
      ) : null}
      {action || secondaryAction ? (
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          {action}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  )
}
