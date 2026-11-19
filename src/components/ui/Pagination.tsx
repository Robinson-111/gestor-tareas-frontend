import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  page: number
  totalPages: number
  total: number
  from: number
  to: number
  onChange: (page: number) => void
  itemLabel?: string
  className?: string
}

function buildPages(page: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 6) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const pages: (number | 'ellipsis')[] = [1]
  if (page > 3) pages.push('ellipsis')

  const start = Math.max(2, page - 1)
  const end = Math.min(totalPages - 1, page + 1)
  for (let current = start; current <= end; current += 1) pages.push(current)

  if (page < totalPages - 2) pages.push('ellipsis')
  pages.push(totalPages)
  return pages
}

export function Pagination({
  page,
  totalPages,
  total,
  from,
  to,
  onChange,
  itemLabel = 'registros',
  className,
}: PaginationProps) {
  if (totalPages <= 1) {
    return (
      <div className={cn('flex items-center justify-between px-1 py-3 text-xs text-slate-500', className)}>
        <span>
          Mostrando <strong className="text-slate-700">{total}</strong> {itemLabel}
        </span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-between gap-3 px-1 py-3 text-xs text-slate-500 sm:flex-row',
        className,
      )}
    >
      <span>
        Mostrando <strong className="text-slate-700">{from}</strong> –{' '}
        <strong className="text-slate-700">{to}</strong> de{' '}
        <strong className="text-slate-700">{total}</strong> {itemLabel}
      </span>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex h-8 items-center gap-1 rounded-lg px-2 font-medium text-slate-500 transition hover:bg-white hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Anterior</span>
        </button>

        {buildPages(page, totalPages).map((item, index) =>
          item === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className="px-1 text-slate-400">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onChange(item)}
              className={cn(
                'h-8 min-w-8 rounded-lg px-2 text-xs font-semibold transition',
                item === page
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/20'
                  : 'text-slate-500 hover:bg-white hover:text-slate-800',
              )}
            >
              {item}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex h-8 items-center gap-1 rounded-lg px-2 font-medium text-slate-500 transition hover:bg-white hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className="hidden sm:inline">Siguiente</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
