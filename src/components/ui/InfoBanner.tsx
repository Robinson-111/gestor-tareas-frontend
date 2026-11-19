import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface InfoBannerProps {
  icon: LucideIcon
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  tone?: 'brand' | 'mint' | 'amber' | 'slate'
  className?: string
}

const TONES = {
  brand: 'border-brand-100 bg-brand-50/70 text-brand-900 [&_.banner-icon]:bg-white [&_.banner-icon]:text-brand-600',
  mint: 'border-emerald-100 bg-emerald-50/70 text-emerald-900 [&_.banner-icon]:bg-white [&_.banner-icon]:text-emerald-600',
  amber: 'border-amber-100 bg-amber-50/70 text-amber-900 [&_.banner-icon]:bg-white [&_.banner-icon]:text-amber-600',
  slate: 'border-line bg-white text-slate-800 [&_.banner-icon]:bg-slate-100 [&_.banner-icon]:text-slate-500',
}

export function InfoBanner({
  icon: Icon,
  title,
  description,
  action,
  tone = 'brand',
  className,
}: InfoBannerProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-2xl border px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5',
        TONES[tone],
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="banner-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-sm">
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-[13px] font-semibold">
            {title}
          </div>
          {description ? (
            <div className="mt-0.5 text-[12px] leading-relaxed opacity-75">{description}</div>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0 sm:pl-4">{action}</div> : null}
    </div>
  )
}
