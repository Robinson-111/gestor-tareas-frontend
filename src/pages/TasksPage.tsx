import { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  Circle,
  ClipboardList,
  Download,
  Eye,
  FilterX,
  ListChecks,
  Plus,
  Table2,
  UserPlus,
  Users,
  Columns3,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { FilterTabs } from '@/components/ui/FilterTabs'
import { Pagination } from '@/components/ui/Pagination'
import { SearchInput } from '@/components/ui/SearchInput'
import { StatCard } from '@/components/ui/StatCard'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { ViewToggle } from '@/components/ui/ViewToggle'
import { TaskCreateModal } from '@/components/tasks/TaskCreateModal'
import { TaskDrawer } from '@/components/tasks/TaskDrawer'
import { useUpdateTask } from '@/hooks/useTasks'
import { useWorkspaceOverview } from '@/hooks/useModules'
import { useAuthStore } from '@/stores/auth'
import { toast } from '@/stores/toast'
import { getApiErrorMessage } from '@/lib/api'
import {
  PRIORITY_DOT,
  PRIORITY_LABEL,
  PRIORITY_STYLES,
  TASK_STATE_LABEL,
  TASK_STATE_STYLES,
  cn,
  downloadCsv,
  formatRelative,
  moduleCode,
  percentage,
  taskCode,
} from '@/lib/utils'
import type { TaskPriority, TaskState, TaskWithModule } from '@/types'

type Scope = 'MINE' | 'UNASSIGNED' | 'ALL'
type ViewMode = 'table' | 'board'

const PAGE_SIZE = 10

const BOARD_COLUMNS: { state: TaskState; label: string; dot: string }[] = [
  { state: 'PENDIENTE', label: 'Pendiente', dot: 'bg-slate-400' },
  { state: 'EN_CURSO', label: 'En curso', dot: 'bg-blue-500' },
  { state: 'COMPLETADA', label: 'Completada', dot: 'bg-emerald-500' },
]

export function TasksPage() {
  const user = useAuthStore((state) => state.user)
  const { overviews, allTasks, pendingTasks, modulesQuery } = useWorkspaceOverview()

  const [scope, setScope] = useState<Scope>('MINE')
  const [moduleFilter, setModuleFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all')
  const [stateFilter, setStateFilter] = useState<'all' | TaskState>('all')
  const [search, setSearch] = useState('')
  const [view, setView] = useState<ViewMode>('table')
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<TaskWithModule | null>(null)

  // Toma siempre la versión fresca de allTasks para que el drawer reaccione
  // a cambios (p. ej. al tomar una tarea sin responsable).
  const selectedTaskFresh = selectedTask
    ? allTasks.find((item) => item.task.id === selectedTask.task.id) ?? selectedTask
    : null

  const mine = useMemo(
    () => allTasks.filter(({ task }) => task.assignee_id === user?.id),
    [allTasks, user?.id],
  )
  const unassigned = useMemo(
    () => allTasks.filter(({ task }) => task.assignee_id === null),
    [allTasks],
  )
  const completed = useMemo(
    () => allTasks.filter(({ task }) => task.state === 'COMPLETADA'),
    [allTasks],
  )
  const completedThisWeek = useMemo(() => {
    const threshold = Date.now() - 7 * 24 * 60 * 60 * 1000
    return completed.filter(({ task }) => new Date(task.updated_at).getTime() >= threshold)
  }, [completed])
  const compliance = percentage(completed.length, allTasks.length)
  const highPriorityMine = mine.filter(({ task }) => task.priority === 'ALTA').length

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return allTasks.filter(({ task, module, members }) => {
      const matchesScope =
        scope === 'ALL' ||
        (scope === 'MINE' && task.assignee_id === user?.id) ||
        (scope === 'UNASSIGNED' && task.assignee_id === null)
      const matchesModule = moduleFilter === 'all' || module.id === Number(moduleFilter)
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter
      const matchesState = stateFilter === 'all' || task.state === stateFilter
      const matchesSearch =
        !term ||
        task.title.toLowerCase().includes(term) ||
        task.description.toLowerCase().includes(term) ||
        module.name.toLowerCase().includes(term) ||
        taskCode(task.id).toLowerCase().includes(term) ||
        (task.assignee_name ?? '').toLowerCase().includes(term) ||
        members.some((member) => member.name.toLowerCase().includes(term))
      return (
        matchesScope &&
        matchesModule &&
        matchesPriority &&
        matchesState &&
        matchesSearch
      )
    })
  }, [allTasks, scope, user?.id, moduleFilter, priorityFilter, stateFilter, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const from = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const to = Math.min(safePage * PAGE_SIZE, filtered.length)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [scope, moduleFilter, priorityFilter, stateFilter, search])

  const clearFilters = () => {
    setSearch('')
    setScope('ALL')
    setModuleFilter('all')
    setPriorityFilter('all')
    setStateFilter('all')
  }

  const exportCsv = () => {
    downloadCsv('tareas-taskflow.csv', [
      ['Código', 'Tarea', 'Módulo', 'Estado', 'Prioridad', 'Responsable', 'Actualizado'],
      ...filtered.map(({ task, module }) => [
        taskCode(task.id),
        task.title,
        module.name,
        TASK_STATE_LABEL[task.state],
        PRIORITY_LABEL[task.priority],
        task.assignee_name ?? 'Sin asignar',
        task.updated_at,
      ]),
    ])
    toast.success('Exportación lista', 'Se descargó el CSV con las tareas filtradas.')
  }

  const isLoading = modulesQuery.isLoading
  const hasTasks = allTasks.length > 0

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="page-title">Todas las Tareas</h1>
            <span className="rounded-md bg-brand-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-600">
              {pendingTasks.length} pendientes
            </span>
          </div>
          <p className="mt-1 max-w-xl text-[13px] text-slate-500">
            Visión consolidada de tus responsabilidades y entregas en todos los módulos de trabajo
            activos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)} disabled={overviews.length === 0}>
            <Plus className="h-4 w-4" />
            Nueva Tarea
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Asignadas a mí"
          value={mine.length}
          icon={ListChecks}
          tone="brand"
          hint={
            highPriorityMine > 0 ? (
              <span className="inline-flex items-center gap-1 font-medium text-rose-600">
                <AlertTriangle className="h-3 w-3" />
                {highPriorityMine} con prioridad alta
              </span>
            ) : (
              'Sin prioridades altas'
            )
          }
        />
        <StatCard
          label="Disponibles por tomar"
          value={unassigned.length}
          icon={UserPlus}
          tone="mint"
          hint={
            <span>
              En tus módulos de trabajo
            </span>
          }
        />
        <StatCard
          label="Completadas esta semana"
          value={completedThisWeek.length}
          icon={CheckCircle2}
          tone="blue"
          hint={
            <span className="inline-flex items-center gap-1 font-medium text-emerald-600">
              <TrendingUp className="h-3 w-3" />
              {completed.length} completadas en total
            </span>
          }
        />
        <StatCard
          label="Tasa de cumplimiento"
          value={`${compliance}%`}
          icon={Users}
          tone={compliance >= 70 ? 'mint' : 'amber'}
          hint={
            <span>
              {completed.length} de {allTasks.length} tareas completadas
            </span>
          }
        />
      </div>

      <div className="card space-y-3 p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por título de tarea o descripción…"
            className="flex-1"
          />
          <ViewToggle
            value={view}
            onChange={setView}
            views={[
              { key: 'table', label: 'Tabla', icon: Table2 },
              { key: 'board', label: 'Tablero', icon: Columns3 },
            ]}
          />
        </div>

        <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
          <FilterTabs
            value={scope}
            onChange={setScope}
            tabs={[
              { key: 'MINE', label: 'Asignadas a mí', count: mine.length },
              { key: 'UNASSIGNED', label: 'Disponibles por tomar', count: unassigned.length },
              { key: 'ALL', label: 'Todas', count: allTasks.length },
            ]}
          />

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={moduleFilter}
              onChange={(event) => setModuleFilter(event.target.value)}
              className="h-9 cursor-pointer rounded-lg border border-line bg-white px-2.5 text-[12px] font-medium text-slate-600 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10"
              aria-label="Filtrar por módulo"
            >
              <option value="all">Todos los módulos</option>
              {overviews.map(({ module }) => (
                <option key={module.id} value={module.id}>
                  {module.name}
                </option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value as 'all' | TaskPriority)}
              className="h-9 cursor-pointer rounded-lg border border-line bg-white px-2.5 text-[12px] font-medium text-slate-600 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10"
              aria-label="Filtrar por prioridad"
            >
              <option value="all">Todas las prioridades</option>
              <option value="ALTA">Alta</option>
              <option value="MEDIA">Media</option>
              <option value="BAJA">Baja</option>
            </select>

            <select
              value={stateFilter}
              onChange={(event) => setStateFilter(event.target.value as 'all' | TaskState)}
              className="h-9 cursor-pointer rounded-lg border border-line bg-white px-2.5 text-[12px] font-medium text-slate-600 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10"
              aria-label="Filtrar por estado"
            >
              <option value="all">Todos los estados</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="EN_CURSO">En curso</option>
              <option value="COMPLETADA">Completada</option>
            </select>

            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-[12px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              title="Limpiar filtros"
            >
              <FilterX className="h-4 w-4" />
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : modulesQuery.isError ? (
        <EmptyState
          icon={ClipboardList}
          title="No pudimos cargar las tareas"
          description={getApiErrorMessage(modulesQuery.error)}
          action={
            <Button variant="outline" onClick={() => void modulesQuery.refetch()}>
              Reintentar
            </Button>
          }
        />
      ) : !hasTasks ? (
        <EmptyState
          icon={ClipboardList}
          title="Aún no hay tareas"
          description="Crea tu primer módulo y añade tareas para verlas consolidadas aquí."
          action={
            <Button onClick={() => setCreateOpen(true)} disabled={overviews.length === 0}>
              <Plus className="h-4 w-4" />
              Nueva Tarea
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Sin tareas con estos filtros"
          description="Ajusta el alcance, el módulo, la prioridad o el estado para ver más resultados."
          action={
            <Button variant="outline" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          }
        />
      ) : view === 'table' ? (
        <>
          <div className="card overflow-hidden">
            <div className="hidden grid-cols-[44px_minmax(0,1.7fr)_110px_150px_130px_56px] items-center gap-4 border-b border-line bg-slate-50/60 px-5 py-3 lg:grid">
              <span className="table-head">Estado</span>
              <span className="table-head">Tarea & Módulo</span>
              <span className="table-head">Prioridad</span>
              <span className="table-head">Responsable</span>
              <span className="table-head">Actualizado</span>
              <span className="table-head text-right">Acciones</span>
            </div>

            <ul className="divide-y divide-line">
              {paginated.map((item) => (
                <TaskTableRow
                  key={`${item.module.id}-${item.task.id}`}
                  item={item}
                  currentUserId={user?.id ?? 0}
                  onOpen={() => setSelectedTask(item)}
                />
              ))}
            </ul>
          </div>
          <div className="card px-3">
            <Pagination
              page={safePage}
              totalPages={totalPages}
              total={filtered.length}
              from={from}
              to={to}
              onChange={setPage}
              itemLabel="tareas"
            />
          </div>
        </>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {BOARD_COLUMNS.map((column) => {
            const columnTasks = filtered.filter(({ task }) => task.state === column.state)
            return (
              <section key={column.state} className="rounded-2xl bg-slate-100/60 p-2.5">
                <header className="flex items-center justify-between px-2 py-2">
                  <div className="flex items-center gap-2">
                    <span className={cn('h-2 w-2 rounded-full', column.dot)} />
                    <h2 className="text-[12px] font-bold uppercase tracking-[0.08em] text-slate-600">
                      {column.label}
                    </h2>
                    <span className="rounded-md bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                      {columnTasks.length}
                    </span>
                  </div>
                </header>

                <div className="space-y-2">
                  {columnTasks.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-line bg-white/60 px-3 py-8 text-center text-[11px] text-slate-400">
                      Sin tareas en este estado
                    </div>
                  ) : (
                    columnTasks.map((item) => (
                      <TaskBoardCard
                        key={`${item.module.id}-${item.task.id}`}
                        item={item}
                        currentUserId={user?.id ?? 0}
                        onOpen={() => setSelectedTask(item)}
                      />
                    ))
                  )}
                </div>
              </section>
            )
          })}
        </div>
      )}

      <TaskCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        overviews={overviews}
        currentUserId={user?.id ?? 0}
      />

      {selectedTaskFresh ? (
        <TaskDrawer
          open={selectedTask !== null}
          onClose={() => setSelectedTask(null)}
          task={selectedTaskFresh.task}
          module={selectedTaskFresh.module}
          members={selectedTaskFresh.members}
          currentUserId={user?.id ?? 0}
          isOwner={
            selectedTaskFresh.members.find((member) => member.user_id === user?.id)?.rol === 'OWNER'
          }
        />
      ) : null}
    </div>
  )
}

function TaskTableRow({
  item,
  currentUserId,
  onOpen,
}: {
  item: TaskWithModule
  currentUserId: number
  onOpen: () => void
}) {
  const { task, module, members } = item
  const updateTask = useUpdateTask(module.id)
  const me = members.find((member) => member.user_id === currentUserId)
  const isOwner = me?.rol === 'OWNER'
  const canToggle = isOwner || task.assignee_id === currentUserId
  const completed = task.state === 'COMPLETADA'

  const toggle = () => {
    if (!canToggle) {
      toast.info('Tarea de otra persona', 'Solo el OWNER o el responsable pueden cambiarla.')
      return
    }
    const payload: { state: TaskState } = {
      state: completed ? 'PENDIENTE' : 'COMPLETADA',
    }
    updateTask.mutate(
      { taskId: task.id, payload },
      {
        onError: (error) => toast.error('No se pudo actualizar', getApiErrorMessage(error)),
      },
    )
  }

  return (
    <li className="grid grid-cols-1 items-start gap-3 px-4 py-3.5 transition hover:bg-slate-50/60 lg:grid-cols-[44px_minmax(0,1.7fr)_110px_150px_130px_56px] lg:items-center lg:gap-4 lg:px-5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggle}
          disabled={!canToggle || updateTask.isPending}
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded-full border transition',
            completed
              ? 'border-emerald-500 bg-emerald-500 text-white'
              : 'border-slate-300 bg-white text-transparent',
            canToggle
              ? 'hover:border-brand-500 hover:text-brand-500'
              : 'cursor-not-allowed opacity-50',
          )}
          aria-label={completed ? 'Marcar como pendiente' : 'Marcar como completada'}
        >
          <CheckCircle2 className="h-3 w-3" strokeWidth={3} />
        </button>
      </div>

      <div className="min-w-0">
        <button
          type="button"
          onClick={onOpen}
          className={cn(
            'block max-w-full truncate text-left text-[13px] font-semibold transition hover:text-brand-700',
            completed ? 'text-slate-400 line-through' : 'text-slate-900',
          )}
        >
          {task.title}
        </button>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
          <span className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-1.5 py-0.5 font-semibold text-brand-700">
            <span className="h-1 w-1 rounded-full bg-brand-500" />
            {module.name}
          </span>
          <span className="font-medium text-slate-400">{moduleCode(module.id)}</span>
          <span className="text-slate-300">·</span>
          <span className="font-medium text-slate-400">{taskCode(task.id)}</span>
        </div>
      </div>

      <div>
        <Badge className={cn('border-0 ring-0', PRIORITY_STYLES[task.priority])}>
          <span className={cn('h-1.5 w-1.5 rounded-full', PRIORITY_DOT[task.priority])} />
          {PRIORITY_LABEL[task.priority]}
        </Badge>
      </div>

      <div className="min-w-0">
        {task.assignee_id != null ? (
          <span className="flex items-center gap-1.5">
            <Avatar
              name={task.assignee_name ?? 'Usuario'}
              seed={task.assignee_id}
              size="xs"
            />
            <span className="truncate text-[11px] font-medium text-slate-600">
              {task.assignee_id === currentUserId ? 'Tú' : task.assignee_name}
            </span>
          </span>
        ) : (
          <TakeTaskButton item={item} currentUserId={currentUserId} />
        )}
      </div>

      <span className="text-[11px] text-slate-400">{formatRelative(task.updated_at)}</span>

      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={onOpen}
          className="action-icon"
          aria-label={`Ver tarea ${task.title}`}
          title="Ver detalle"
        >
          <Eye className="h-4 w-4" />
        </button>
      </div>
    </li>
  )
}

function TakeTaskButton({
  item,
  currentUserId,
}: {
  item: TaskWithModule
  currentUserId: number
}) {
  const { task, module } = item
  const updateTask = useUpdateTask(module.id)

  return (
    <button
      type="button"
      onClick={() =>
        updateTask.mutate(
          {
            taskId: task.id,
            payload: { assignee_id: currentUserId, state: 'EN_CURSO' },
          },
          {
            onSuccess: () => toast.success('Tarea tomada', 'Ahora es tu responsabilidad.'),
            onError: (error) => toast.error('No se pudo tomar', getApiErrorMessage(error)),
          },
        )
      }
      disabled={updateTask.isPending}
      className="inline-flex h-7 items-center gap-1 rounded-md bg-brand-50 px-2 text-[10px] font-semibold text-brand-700 transition hover:bg-brand-100 disabled:opacity-60"
    >
      <UserPlus className="h-3 w-3" />
      Tomar tarea
    </button>
  )
}

function TaskBoardCard({
  item,
  currentUserId,
  onOpen,
}: {
  item: TaskWithModule
  currentUserId: number
  onOpen: () => void
}) {
  const { task, module } = item
  const completed = task.state === 'COMPLETADA'

  return (
    <article
      className={cn(
        'cursor-pointer rounded-xl border bg-white p-3.5 shadow-card transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-soft',
        completed ? 'border-emerald-100 bg-emerald-50/40' : 'border-line',
      )}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpen()
        }
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex min-w-0 items-center gap-1.5 rounded-md bg-brand-50 px-1.5 py-0.5 text-[9px] font-semibold text-brand-700">
          <span className="h-1 w-1 shrink-0 rounded-full bg-brand-500" />
          <span className="truncate">{module.name}</span>
        </span>
        <span
          className={cn(
            'inline-flex shrink-0 items-center gap-1 text-[9px] font-semibold',
            task.priority === 'ALTA'
              ? 'text-rose-600'
              : task.priority === 'MEDIA'
                ? 'text-amber-600'
                : 'text-slate-500',
          )}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', PRIORITY_DOT[task.priority])} />
          {PRIORITY_LABEL[task.priority]}
        </span>
      </div>

      <h3
        className={cn(
          'mt-2 text-[12.5px] font-semibold leading-snug',
          completed ? 'text-slate-500 line-through' : 'text-slate-900',
        )}
      >
        {task.title}
      </h3>
      {task.description ? (
        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-500">
          {task.description}
        </p>
      ) : null}

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-line/70 pt-2.5">
        <span className="inline-flex items-center gap-1 text-[9px] text-slate-400">
          <Circle className="h-2.5 w-2.5" />
          {formatRelative(task.updated_at)}
        </span>
        {task.assignee_name ? (
          <span className="inline-flex items-center gap-1 text-[9px] font-medium text-slate-500">
            <Avatar name={task.assignee_name} seed={task.assignee_id ?? 0} size="xs" />
            <span className="max-w-[90px] truncate">
              {task.assignee_id === currentUserId ? 'Tú' : task.assignee_name}
            </span>
          </span>
        ) : (
          <TakeTaskButton item={item} currentUserId={currentUserId} />
        )}
      </div>
    </article>
  )
}
