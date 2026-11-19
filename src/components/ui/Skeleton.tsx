import { Loader2 } from 'lucide-react'

export function PageLoader({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-500">
      <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      <p className="text-sm">{label}</p>
    </div>
  )
}

export function ModuleCardSkeleton() {
  return (
    <div className="card flex min-h-[250px] flex-col p-5">
      <div className="flex items-center justify-between">
        <div className="skeleton h-5 w-24" />
        <div className="skeleton h-4 w-14" />
      </div>
      <div className="skeleton mt-5 h-5 w-3/4" />
      <div className="skeleton mt-3 h-3.5 w-full" />
      <div className="skeleton mt-2 h-3.5 w-2/3" />
      <div className="skeleton mt-5 h-4 w-48" />
      <div className="skeleton mt-3 h-1.5 w-full" />
      <div className="mt-auto flex items-center justify-between pt-6">
        <div className="skeleton h-8 w-28 rounded-full" />
        <div className="skeleton h-4 w-20" />
      </div>
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="card p-5">
      <div className="skeleton h-3 w-28" />
      <div className="skeleton mt-4 h-8 w-16" />
      <div className="skeleton mt-3 h-3 w-36" />
    </div>
  )
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="card divide-y divide-line overflow-hidden">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 px-5 py-4">
          <div className="skeleton h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-40" />
            <div className="skeleton h-3 w-56" />
          </div>
          <div className="skeleton h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  )
}

export function DetailSkeleton() {
  return (
    <div className="space-y-5">
      <div className="card p-6">
        <div className="skeleton h-5 w-24" />
        <div className="skeleton mt-4 h-8 w-2/3" />
        <div className="skeleton mt-3 h-4 w-1/2" />
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="card h-[420px] lg:col-span-2" />
        <div className="card h-[320px]" />
      </div>
    </div>
  )
}
