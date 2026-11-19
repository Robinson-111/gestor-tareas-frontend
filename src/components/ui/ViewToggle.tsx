import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ViewOption<T extends string> {
  key: T
  label: string
  icon: LucideIcon
}

interface ViewToggleProps<T extends string> {
  views: ViewOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}

export function ViewToggle<T extends string>({
  views,
  value,
  onChange,
  className,
}: ViewToggleProps<T>) {
  return (
    <div className={cn('inline-flex h-9 items-center rounded-lg border border-line bg-white p-0.5', className)}>
      {views.map((view) => {
        const active = view.key === value
        const Icon = view.icon
        return (
          <button
            key={view.key}
            type="button"
            onClick={() => onChange(view.key)}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[12px] font-semibold transition',
              active
                ? 'bg-brand-50 text-brand-700'
                : 'text-slate-400 hover:text-slate-700',
            )}
            aria-pressed={active}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{view.label}</span>
          </button>
        )
      })}
    </div>
  )
}
