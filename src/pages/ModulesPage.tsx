import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  Compass,
  Crown,
  FolderKanban,
  LayoutGrid,
  List,
  Plus,
  Sparkles,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { FilterTabs } from '@/components/ui/FilterTabs'
import { InfoBanner } from '@/components/ui/InfoBanner'
import { ModuleCardSkeleton } from '@/components/ui/Skeleton'
import { Pagination } from '@/components/ui/Pagination'
import { SearchInput } from '@/components/ui/SearchInput'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { ViewToggle } from '@/components/ui/ViewToggle'
import { Avatar } from '@/components/ui/Avatar'
import { AvatarGroup } from '@/components/ui/AvatarGroup'
import { ModuleCard } from '@/components/modules/ModuleCard'
import { ModuleFormModal } from '@/components/modules/ModuleFormModal'
import { getApiErrorMessage } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { useClaimModule, useClaimableModules, useWorkspaceOverview } from '@/hooks/useModules'
import {
  MODULE_STATE_DOT,
  MODULE_STATE_LABEL,
  cn,
  formatMonthYear,
  moduleCode,
  percentage,
} from '@/lib/utils'
import { toast } from '@/stores/toast'
import type { ModuleOverview, ModuleState } from '@/types'

type ModuleFilter = 'TODOS' | ModuleState
type SortKey = 'recent' | 'name' | 'progress'
type ViewMode = 'grid' | 'list'

const PAGE_SIZE = 8

export function ModulesPage() {
  const user = useAuthStore((state) => state.user)
  const { modulesQuery, overviews, activeModules, isEnriching } = useWorkspaceOverview()
  const claimableQuery = useClaimableModules()
  const claimModule = useClaimModule()
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<ModuleFilter>('TODOS')
  const [sort, setSort] = useState<SortKey>('recent')
  const [view, setView] = useState<ViewMode>('grid')
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)

  const claimable = claimableQuery.data ?? []

  const counts = useMemo(
    () => ({
      TODOS: overviews.length,
      PENDIENTE: overviews.filter(({ module }) => module.state === 'PENDIENTE').length,
      EN_CURSO: overviews.filter(({ module }) => module.state === 'EN_CURSO').length,
      COMPLETADO: overviews.filter(({ module }) => module.state === 'COMPLETADO').length,
    }),
    [overviews],
  )

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    const items = overviews.filter(({ module }) => {
      const matchesFilter = filter === 'TODOS' || module.state === filter
      const matchesSearch =
        !term ||
        module.name.toLowerCase().includes(term) ||
        module.description.toLowerCase().includes(term) ||
        moduleCode(module.id).toLowerCase().includes(term)
      return matchesFilter && matchesSearch
    })

    return [...items].sort((a, b) => {
      if (sort === 'name') return a.module.name.localeCompare(b.module.name, 'es')
      if (sort === 'progress') {
        const progressA = percentage(
          a.tasks.filter((task) => task.state === 'COMPLETADA').length,
          a.tasks.length,
        )
        const progressB = percentage(
          b.tasks.filter((task) => task.state === 'COMPLETADA').length,
          b.tasks.length,
        )
        return progressB - progressA
      }
      return new Date(b.module.created_at).getTime() - new Date(a.module.created_at).getTime()
    })
  }, [overviews, search, filter, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const from = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const to = Math.min(safePage * PAGE_SIZE, filtered.length)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [search, filter, sort])

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

  const isLoading = modulesQuery.isLoading
  const hasModules = overviews.length > 0

  return (
    <div className="space-y-5">
      {claimable.length > 0 ? (
        <InfoBanner
          icon={Sparkles}
          title={
            <>
              ¿Buscas nuevos proyectos colaborativos?
              <span className="rounded-md bg-mint-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-mint-700">
                {claimable.length} disponibles
              </span>
            </>
          }
          description="Hay módulos huérfanos sin OWNER listos para ser reclamados en el catálogo público."
          action={
            <Link
              to="/explore"
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-brand-600 hover:text-brand-700"
            >
              Reclamar en Explorar
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="page-title">Mis Módulos</h1>
            {hasModules ? (
              <span className="rounded-md bg-brand-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-600">
                {activeModules} {activeModules === 1 ? 'activo' : 'activos'}
              </span>
            ) : null}
          </div>
          <p className="mt-1 max-w-xl text-[13px] text-slate-500">
            Módulos en los que participas con privilegios de OWNER o asignación como MEMBER.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {claimable.length > 0 ? (
            <Button variant="outline" size="sm" onClick={() => navigate('/explore')}>
              <Compass className="h-4 w-4" />
              Explorar ({claimable.length} {claimable.length === 1 ? 'libre' : 'libres'})
            </Button>
          ) : null}
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Crear Módulo
          </Button>
        </div>
      </div>

      {hasModules ? (
        <div className="card space-y-3 p-3 sm:p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <FilterTabs
              value={filter}
              onChange={setFilter}
              tabs={[
                { key: 'TODOS', label: 'Todos', count: counts.TODOS },
                { key: 'EN_CURSO', label: 'En curso', count: counts.EN_CURSO },
                { key: 'PENDIENTE', label: 'Pendientes', count: counts.PENDIENTE },
                { key: 'COMPLETADO', label: 'Completados', count: counts.COMPLETADO },
              ]}
            />

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Filtrar por nombre…"
                className="sm:w-[220px]"
              />
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as SortKey)}
                className="h-10 cursor-pointer rounded-xl border border-line bg-white px-3 text-[12px] font-semibold text-slate-600 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10"
                aria-label="Ordenar módulos"
              >
                <option value="recent">Más recientes</option>
                <option value="name">Nombre A–Z</option>
                <option value="progress">Mayor avance</option>
              </select>
              <ViewToggle
                value={view}
                onChange={setView}
                views={[
                  { key: 'grid', label: 'Tarjetas', icon: LayoutGrid },
                  { key: 'list', label: 'Lista', icon: List },
                ]}
              />
            </div>
          </div>
          {isEnriching ? (
            <p className="text-[11px] font-medium text-slate-400">Actualizando contadores…</p>
          ) : null}
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <ModuleCardSkeleton key={item} />
          ))}
        </div>
      ) : modulesQuery.isError ? (
        <EmptyState
          icon={FolderKanban}
          title="No pudimos cargar tus módulos"
          description={getApiErrorMessage(modulesQuery.error)}
          action={
            <Button variant="outline" onClick={() => void modulesQuery.refetch()}>
              Reintentar
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={hasModules ? 'Sin resultados' : 'Aún no tienes ningún módulo asignado'}
          description={
            hasModules
              ? 'Prueba con otro nombre, estado o código de módulo.'
              : 'Los módulos agrupan tus proyectos, equipos y tareas. Puedes crear tu propio espacio de trabajo o explorar proyectos abiertos para colaborar de inmediato.'
          }
          action={
            hasModules ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('')
                  setFilter('TODOS')
                }}
              >
                Limpiar filtros
              </Button>
            ) : (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                Crear mi primer módulo
              </Button>
            )
          }
          secondaryAction={
            !hasModules ? (
              <Button variant="outline" onClick={() => navigate('/explore')}>
                <Compass className="h-4 w-4" />
                Explorar módulos del equipo
              </Button>
            ) : undefined
          }
        />
      ) : view === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {paginated.map(({ module, members, tasks }) => (
            <ModuleCard
              key={module.id}
              module={module}
              members={members}
              tasks={tasks}
              currentUserId={user?.id ?? 0}
              onClaim={handleClaim}
              claimLoading={claimModule.isPending && claimModule.variables === module.id}
            />
          ))}
        </div>
      ) : (
        <div className="card divide-y divide-line overflow-hidden">
          {paginated.map((item) => (
            <ModuleListRow
              key={item.module.id}
              item={item}
              currentUserId={user?.id ?? 0}
            />
          ))}
        </div>
      )}

      {!isLoading && filtered.length > 0 ? (
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
      ) : null}

      <ModuleFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}

function ModuleListRow({
  item,
  currentUserId,
}: {
  item: ModuleOverview
  currentUserId: number
}) {
  const { module, members, tasks } = item
  const completed = tasks.filter((task) => task.state === 'COMPLETADA').length
  const progress = percentage(completed, tasks.length)
  const me = members.find((member) => member.user_id === currentUserId)
  const creator = members.find((member) => member.user_id === module.creator)

  return (
    <Link
      to={`/modules/${module.id}`}
      className="group flex flex-col gap-3 px-4 py-4 transition hover:bg-slate-50/70 sm:flex-row sm:items-center sm:px-5"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            className={cn(
              'border-0 ring-0',
              me?.rol === 'OWNER' ? 'bg-brand-50 text-brand-700' : 'bg-blue-50 text-blue-700',
            )}
          >
            {me?.rol === 'OWNER' ? <Crown className="h-3 w-3" /> : null}
            {me?.rol ?? 'MEMBER'}
          </Badge>
          <Badge className="border-0 bg-slate-50 text-slate-500 ring-0">
            <span className={cn('h-1.5 w-1.5 rounded-full', MODULE_STATE_DOT[module.state])} />
            {MODULE_STATE_LABEL[module.state]}
          </Badge>
          <span className="text-[10px] font-semibold text-slate-400">{moduleCode(module.id)}</span>
        </div>
        <p className="mt-1.5 truncate text-[14px] font-semibold text-slate-900 group-hover:text-brand-700">
          {module.name}
        </p>
        <p className="mt-0.5 truncate text-[12px] text-slate-500">
          {module.description || 'Sin descripción.'}
        </p>
        <div className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-400">
          <Avatar
            name={creator?.name ?? module.creator_name ?? 'Equipo'}
            seed={module.creator ?? module.id}
            size="xs"
          />
          <span>Creado por {creator?.name ?? module.creator_name ?? 'el equipo'}</span>
          <span>·</span>
          <span>{formatMonthYear(module.created_at)}</span>
        </div>
      </div>

      <div className="w-full shrink-0 sm:w-56">
        <div className="mb-1 flex items-center justify-between text-[10px] font-semibold text-slate-500">
          <span>{completed}/{tasks.length} tareas</span>
          <span>{progress}%</span>
        </div>
        <ProgressBar value={progress} label={`Avance de ${module.name}`} />
        <div className="mt-2 flex items-center justify-between">
          <AvatarGroup members={members} max={3} size="xs" />
          <ArrowUpRight className="h-4 w-4 text-slate-300 transition group-hover:text-brand-500" />
        </div>
      </div>
    </Link>
  )
}
