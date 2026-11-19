import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  label: string
  className?: string
  tone?: 'brand' | 'success' | 'warning'
  size?: 'sm' | 'md'
}

const TONES = {
  brand: 'bg-brand-600',
  success: 'bg-emerald-500',
  warning: 'bg-amber-400',
}

export function ProgressBar({
  value,
  label,
  className,
  tone = 'brand',
  size = 'sm',
}: ProgressBarProps) {
  const progress = Math.min(100, Math.max(0, Math.round(value)))

  return (
    <div
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn(
        'w-full overflow-hidden rounded-full bg-slate-100',
        size === 'sm' ? 'h-1.5' : 'h-2',
        className,
      )}
    >
      <div
        className={cn('h-full rounded-full transition-all duration-500', TONES[tone])}
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
