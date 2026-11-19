import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Compass, LayoutGrid, LifeBuoy, ListChecks, SearchX } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function NotFoundPage() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className="flex min-h-[calc(100dvh-140px)] flex-col items-center justify-center px-4 py-8 text-center">
      <span className="rounded-md bg-brand-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-600">
        Error 404 · No encontrado
      </span>

      <div className="relative mt-6 select-none">
        <p className="text-[92px] font-black leading-none tracking-[-0.08em] text-slate-200 sm:text-[112px]">
          4
          <span className="relative mx-2 inline-flex h-[76px] w-[76px] translate-y-[-4px] items-center justify-center rounded-2xl border border-line bg-white align-middle shadow-soft sm:h-[92px] sm:w-[92px]">
            <SearchX className="h-9 w-9 text-brand-500 sm:h-11 sm:w-11" />
          </span>
          4
        </p>
        <span className="absolute right-[24%] top-2 h-3 w-3 rounded-full bg-emerald-400 ring-4 ring-emerald-100" />
      </div>

      <h1 className="mt-4 max-w-lg text-[24px] font-bold leading-tight tracking-[-0.03em] text-slate-900 sm:text-[28px]">
        La página o elemento que buscas no existe o fue movido
      </h1>
      <p className="mt-2 max-w-md text-[13px] leading-relaxed text-slate-500">
        Es posible que el módulo o la tarea haya sido eliminada por su propietario, o que el enlace
        ingresado contenga un error de tipeo.
      </p>
      <p className="mt-2 max-w-md truncate text-[11px] text-slate-400">
        Ruta solicitada: <code className="rounded bg-slate-100 px-1.5 py-0.5">{location.pathname}</code>
      </p>

      <div className="mt-6 flex w-full max-w-2xl flex-col gap-2 rounded-2xl border border-line bg-white p-3 shadow-card sm:flex-row sm:items-center sm:justify-center">
        <Button onClick={() => navigate('/modules')} className="sm:flex-1">
          <LayoutGrid className="h-4 w-4" />
          Volver a Mis Módulos
        </Button>
        <Button variant="outline" onClick={() => navigate('/explore')} className="sm:flex-1">
          <Compass className="h-4 w-4" />
          Explorar otros
        </Button>
        <Button variant="outline" onClick={() => navigate('/tasks')} className="sm:flex-1">
          <ListChecks className="h-4 w-4" />
          Ver Tareas
        </Button>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-[10px] text-slate-400">
        <span>Espacio de trabajo TaskFlow activo</span>
        <span className="h-1 w-1 rounded-full bg-slate-300" />
        <Link to="/modules" className="inline-flex items-center gap-1 font-medium hover:text-brand-600">
          <LifeBuoy className="h-3 w-3" />
          Centro de soporte
        </Link>
      </div>
    </div>
  )
}
