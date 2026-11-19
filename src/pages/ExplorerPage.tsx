import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Compass,
  Crown,
  Info,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { FilterTabs } from '@/components/ui/FilterTabs'
import { InfoBanner } from '@/components/ui/InfoBanner'
import { Pagination } from '@/components/ui/Pagination'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { SearchInput } from '@/components/ui/SearchInput'
import { ModuleCardSkeleton } from '@/components/ui/Skeleton'
import { getApiErrorMessage } from '@/lib/api'
import {
  MODULE_STATE_LABEL,
  MODULE_STATE_STYLES,
  cn,
  formatRelative,
  moduleCode,
  percentage,
} from '@/lib/utils'
import { useClaimModule, useExploreModules, useJoinModule } from '@/hooks/useModules'
import { toast } from '@/stores/toast'

type ExploreFilter = 'TODOS' | 'RECLAMABLES' | 'CON_EQUIPO'
type SortKey = 'recent' | 'name' | 'tasks'

const PAGE_SIZE = 6

export function ExplorerPage() {
  const query = useExploreModules()
  const joinModule = useJoinModule()
  const claimModule = useClaimModule()
  const navigate = useNavigate()

  const [filter, setFilter] = useState<ExploreFilter>('TODOS')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortKey>('recent')
  const [page, setPage] = useState(1)

  const modules = query.data ?? []
  const claimableCount = modules.filter((module) => !module.has_owner).length
  const withTeamCount = modules.filter((module) => module.has_owner).length

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    const items = modules.filter((module) => {
      const matchesFilter =
        filter === 'TODOS' ||
        (filter === 'RECLAMABLES' && !module.has_owner) ||
        (filter === 'CON_EQUIPO' && module.has_owner)
      const matchesSearch =
        !term ||
        module.name.toLowerCase().includes(term) ||
        module.description.toLowerCase().includes(term) ||
        (module.owner_name ?? '').toLowerCase().includes(term) ||
        (module.creator_name ?? '').toLowerCase().includes(term) ||
        moduleCode(module.id).toLowerCase().includes(term)
      return matchesFilter && matchesSearch
    })

    return [...items].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name, 'es')
      if (sort === 'tasks') return b.total_tasks - a.total_tasks
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [modules, filter, search, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const from = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const to = Math.min(safePage * PAGE_SIZE, filtered.length)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [filter, search, sort])

  const handleJoin = (moduleId: number) => {
    joinModule.mutate(moduleId, {
      onSuccess: () => {
        toast.success('Te uniste al módulo', 'Ya formas parte del equipo como MEMBER.')
        navigate(`/modules/${moduleId}`)
      },
      onError: (error) => {
        toast.error('No se pudo unir al módulo', getApiErrorMessage(error))
      },
    })
  }

  const handleClaim = (moduleId: number) => {
    claimModule.mutate(moduleId, {
      onSuccess: () => {
        toast.success('Módulo reclamado', 'Ahora eres el OWNER del módulo.')
        navigate(`/modules/${moduleId}`)
      },
      onError: (error) => {
        toast.error('No se pudo reclamar', getApiErrorMessage(error))
      },
    })
  }

  return (
    <div className="space-y-5">
      {claimableCount > 0 ? (
        <InfoBanner
          icon={Crown}
          title={
            <>
              Módulos disponibles para Reclamar
              <span className="rounded-md bg-white/70 px-1.5 py-0.5 text-[9px] font-bold text-brand-600 ring-1 ring-inset ring-brand-100">
                RF-15 / RN-06
              </span>
            </>
          }
          description={
            <>
              <strong>{claimableCount}</strong>{' '}
              {claimableCount === 1 ? 'módulo quedó' : 'módulos quedaron'} sin propietario activo
              debido a una desvinculación o resignación de equipo. Cualquier integrante con sesión
              iniciada puede asumir la titularidad.
            </>
          }
          action={
            <Button
              size="sm"
              onClick={() => {
                setFilter('RECLAMABLES')
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            >
              <Crown className="h-4 w-4" />
              Ver Reclamables ({claimableCount})
            </Button>
          }
        />
      ) : null}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <nav className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            <span>Organización</span>
            <span className="text-slate-300">/</span>
            <span className="text-brand-600">Espacios públicos</span>
          </nav>
          <h1 className="page-title mt-2">Explorar Espacios de Trabajo</h1>
          <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-slate-500">
            Descubre nuevos módulos de la organización o reclama módulos huérfanos que quedaron
            sin propietario.
          </p>
        </div>

        <div className="flex items-center gap-2.5 rounded-xl border border-line bg-white px-3.5 py-2.5 text-[11px] text-slate-500 shadow-card">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <Info className="h-4 w-4" />
          </span>
          <span>
            <span className="block font-semibold text-slate-700">
              {modules.length} {modules.length === 1 ? 'espacio disponible' : 'espacios disponibles'}
            </span>
            <span className="block text-slate-400">
              {claimableCount} para reclamar · {withTeamCount} con equipo activo
            </span>
          </span>
        </div>
      </div>

      {query.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <ModuleCardSkeleton key={item} />
          ))}
        </div>
      ) : query.isError ? (
        <EmptyState
          icon={Compass}
          title="No pudimos cargar los módulos"
          description={getApiErrorMessage(query.error)}
          action={
            <Button variant="outline" onClick={() => void query.refetch()}>
              Reintentar
            </Button>
          }
        />
      ) : modules.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="No hay módulos por explorar"
          description="Ya participas en todos los módulos disponibles. Vuelve más tarde o crea el tuyo propio desde Mis Módulos."
          action={<Button onClick={() => navigate('/modules')}>Ir a Mis Módulos</Button>}
        />
      ) : (
        <>
          <div className="card space-y-3 p-3 sm:p-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <FilterTabs
                value={filter}
                onChange={setFilter}
                tabs={[
                  { key: 'TODOS', label: 'Todos los Módulos', count: modules.length },
                  {
                    key: 'RECLAMABLES',
                    label: 'Sin Propietario (Reclamables)',
                    count: claimableCount,
                  },
                  { key: 'CON_EQUIPO', label: 'Con Equipo Activo', count: withTeamCount },
                ]}
              />

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Filtrar por nombre o clave…"
                  className="sm:w-[240px]"
                />
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as SortKey)}
                  className="h-10 cursor-pointer rounded-xl border border-line bg-white px-3 text-[12px] font-semibold text-slate-600 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10"
                  aria-label="Ordenar módulos"
                >
                  <option value="recent">Recientes primero</option>
                  <option value="name">Nombre A–Z</option>
                  <option value="tasks">Más tareas</option>
                </select>
              </div>
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={Compass}
              title="Sin resultados"
              description="No hay módulos que coincidan con los filtros seleccionados."
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch('')
                    setFilter('TODOS')
                  }}
                >
                  Limpiar filtros
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {paginated.map((module) => {
                const joining = joinModule.isPending && joinModule.variables === module.id
                const claiming = claimModule.isPending && claimModule.variables === module.id
                const busy = joining || claiming
                const progress = percentage(module.completed_tasks, module.total_tasks)

                return (
                  <article
                    key={module.id}
                    className="card surface-hover flex flex-col p-5"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.04em] text-slate-400">
                        {moduleCode(module.id)}
                      </span>
                      <Badge className={cn('ml-auto border-0 ring-0', MODULE_STATE_STYLES[module.state])}>
                        {MODULE_STATE_LABEL[module.state]}
                      </Badge>
                    </div>

                    <h2 className="mt-3.5 text-[18px] font-bold leading-snug tracking-[-0.02em] text-slate-900">
                      {module.name}
                    </h2>
                    <p className="mt-1.5 line-clamp-2 min-h-[38px] text-[12.5px] leading-relaxed text-slate-500">
                      {module.description || 'Sin descripción.'}
                    </p>

                    <div className="mt-4 rounded-xl border border-line/70 bg-slate-50/60 p-2.5">
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                          Creador Original
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] font-semibold text-slate-700">
                          <Users className="h-3 w-3 text-slate-400" />
                          {module.creator_name ?? `Usuario #${module.creator ?? '—'}`}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="mb-1.5 flex items-center justify-between gap-3 text-[10px] font-semibold">
                        <span className="uppercase tracking-[0.1em] text-slate-400">
                          Avance de Tareas ({module.total_tasks} en total)
                        </span>
                        <span className="text-slate-600">{progress}% Completado</span>
                      </div>
                      <ProgressBar
                        value={progress}
                        label={`Avance de ${module.name}`}
                        tone={progress === 100 && module.total_tasks > 0 ? 'success' : 'brand'}
                      />
                      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-medium text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                          {module.pending_tasks} pendientes
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                          {module.in_progress_tasks} en curso
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          {module.completed_tasks} completadas
                        </span>
                      </p>
                    </div>

                    <div className="mt-auto flex flex-col gap-3 border-t border-line/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <span className="inline-flex items-center gap-1.5 text-[10px] text-slate-400">
                        <Zap className="h-3 w-3" />
                        Actualizado {formatRelative(module.updated_at)}
                      </span>

                      <div className="flex items-center gap-2">
                        {module.has_owner ? (
                          <Button
                            size="sm"
                            variant="soft"
                            loading={joining}
                            disabled={busy}
                            onClick={() => handleJoin(module.id)}
                          >
                            {!joining ? <UserPlus className="h-4 w-4" /> : null}
                            Unirse como Miembro
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            loading={claiming}
                            disabled={busy}
                            onClick={() => handleClaim(module.id)}
                          >
                            {!claiming ? <Crown className="h-4 w-4" /> : null}
                            Reclamar como OWNER
                          </Button>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}

          <div className="card px-3">
            <Pagination
              page={safePage}
              totalPages={totalPages}
              total={filtered.length}
              from={from}
              to={to}
              onChange={setPage}
              itemLabel="módulos"
            />
          </div>
        </>
      )}
    </div>
  )
}
