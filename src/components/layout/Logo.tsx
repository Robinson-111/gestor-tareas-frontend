import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LogoProps {
  compact?: boolean
  className?: string
  subtitle?: string | null
}

export function Logo({ compact = false, className, subtitle = 'Espacio Activo' }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#171A2B] text-white shadow-sm">
        <Check className="h-5 w-5" strokeWidth={3} />
      </span>
      {!compact ? (
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-bold leading-tight tracking-[-0.02em] text-slate-900">
            TaskFlow
          </span>
          {subtitle ? (
            <span className="block truncate text-[10px] font-medium text-slate-400">{subtitle}</span>
          ) : null}
        </span>
      ) : null}
    </div>
  )
}
