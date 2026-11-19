import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface FilterTab<T extends string> {
  key: T
  label: string
  count?: number
  icon?: ReactNode
}

interface FilterTabsProps<T extends string> {
  tabs: FilterTab<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
  tone?: 'solid' | 'soft'
}

export function FilterTabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
  tone = 'soft',
}: FilterTabsProps<T>) {
  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {tabs.map((tab) => {
        const active = tab.key === value
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={cn(
              'inline-flex h-9 items-center gap-2 rounded-lg px-3 text-[12px] font-semibold transition',
              active
                ? tone === 'solid'
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/20'
                  : 'bg-white text-brand-700 shadow-card ring-1 ring-inset ring-brand-100'
                : 'text-slate-500 hover:bg-white/70 hover:text-slate-800',
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' ? (
              <span
                className={cn(
                  'rounded-md px-1.5 py-0.5 text-[10px] font-bold',
                  active
                    ? tone === 'solid'
                      ? 'bg-white/20 text-white'
                      : 'bg-brand-50 text-brand-600'
                    : 'bg-slate-200/70 text-slate-500',
                )}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
