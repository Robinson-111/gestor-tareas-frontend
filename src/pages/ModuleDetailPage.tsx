import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ClipboardList,
  Columns3,
  Crown,
  Eye,
  List,
  Pencil,
  Plus,
  Shield,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { FilterTabs } from '@/components/ui/FilterTabs'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { SearchInput } from '@/components/ui/SearchInput'
import { DetailSkeleton } from '@/components/ui/Skeleton'
import { ModuleFormModal } from '@/components/modules/ModuleFormModal'
import { TaskFormModal } from '@/components/tasks/TaskFormModal'
import { TaskDrawer } from '@/components/tasks/TaskDrawer'
import { AddMemberModal } from '@/components/members/AddMemberModal'
import { MembersPanel } from '@/components/members/MembersPanel'
import { getApiErrorMessage } from '@/lib/api'
import {
  MODULE_STATE_DOT,
  MODULE_STATE_LABEL,
  PRIORITY_DOT,
  PRIORITY_LABEL,
  TASK_STATE_LABEL,
  TASK_STATE_STYLES,
  cn,
  formatMonthYear,
  formatRelative,
  moduleCode,
  percentage,
  taskCode,
} from '@/lib/utils'
import { useAuthStore } from '@/stores/auth'
import { useDeleteModule, useModule } from '@/hooks/useModules'
import {
  useMembers,
  useRemoveMember,
  useTransferOwnership,
  useLeaveModule,
} from '@/hooks/useMembers'
import { useUpdateTask, useTasks, type TaskUpdatePayload } from '@/hooks/useTasks'
import { toast } from '@/stores/toast'
import type { Member, Task, TaskPriority, TaskState, TaskWithModule } from '@/types'

type DetailTab = 'BOARD' | 'LIST' | 'MEMBERS'

const BOARD_COLUMNS: { state: TaskState; label: string; dot: string }[] = [
  { state: 'PENDIENTE', label: 'Pendiente', dot: 'bg-slate-400' },
  { state: 'EN_CURSO', label: 'En curso', dot: 'bg-blue-500' },
  { state: 'COMPLETADA', label: 'Completada', dot: 'bg-emerald-500' },
]

export function ModuleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const moduleId = Number(id)
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)

  const moduleQuery = useModule(moduleId)
  const membersQuery = useMembers(moduleId)
  const tasksQuery = useTasks(moduleId)

  const deleteModule = useDeleteModule()
  const leaveModule = useLeaveModule(moduleId)
  const updateTask = useUpdateTask(moduleId)
  const removeMember = useRemoveMember(moduleId)
  const transferOwnership = useTransferOwnership(moduleId)

  const [tab, setTab] = useState<DetailTab>('BOARD')
  const [search, setSearch] = useState('')
  const [createTaskOpen, setCreateTaskOpen] = useState(false)
  const [editModuleOpen, setEditModuleOpen] = useState(false)
  const [addMemberOpen, setAddMemberOpen] = useState(false)
  const [removingMember, setRemovingMember] = useState<Member | null>(null)
  const [transferringMember, setTransferringMember] = useState<Member | null>(null)
  const [deleteModuleOpen, setDeleteModuleOpen] = useState(false)
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const module = moduleQuery.data
  const members = membersQuery.data ?? []
  const tasks = tasksQuery.data ?? []

  const me = members.find((member) => member.user_id === user?.id)
  const isOwner = me?.rol === 'OWNER'
  const owner = members.find((member) => member.rol === 'OWNER')
  const creator = members.find((member) => member.user_id === module?.creator)
  const creatorName = creator?.name ?? module?.creator_name ?? owner?.name ?? 'el equipo'

  const counts = useMemo(
    () => ({
      PENDIENTE: tasks.filter((task) => task.state === 'PENDIENTE').length,
      EN_CURSO: tasks.filter((task) => task.state === 'EN_CURSO').length,
      COMPLETADA: tasks.filter((task) => task.state === 'COMPLETADA').length,
    }),
    [tasks],
  )
  const progress = percentage(counts.COMPLETADA, tasks.length)

  const filteredTasks = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return tasks
    return tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(term) ||
        task.description.toLowerCase().includes(term) ||
        taskCode(task.id).toLowerCase().includes(term) ||
        (task.assignee_name ?? '').toLowerCase().includes(term),
    )
  }, [tasks, search])

  const canEditTask = (task: Task) =>
    isOwner || task.assignee_id === user?.id

  const handleToggleTask = (task: Task) => {
    if (!canEditTask(task)) {
      toast.info(
        'Tarea asignada a otra persona',
        'Solo el OWNER o el responsable pueden modificar esta tarea.',
      )
      return
    }

    const nextState: TaskState = task.state === 'COMPLETADA' ? 'PENDIENTE' : 'COMPLETADA'
    const payload: TaskUpdatePayload = { state: nextState }

    updateTask.mutate(
      { taskId: task.id, payload },
      {
        onError: (error) => toast.error('No se pudo actualizar la tarea', getApiErrorMessage(error)),
      },
    )
  }

  const handleTakeTask = (task: Task) => {
    if (!user) return
    updateTask.mutate(
      { taskId: task.id, payload: { assignee_id: user.id, state: 'EN_CURSO' } },
      {
        onSuccess: () => toast.success('Tarea tomada', 'Ahora es tu responsabilidad.'),
        onError: (error) => toast.error('No se pudo tomar la tarea', getApiErrorMessage(error)),
      },
    )
  }

  if (moduleQuery.isLoading) {
    return (
      <div className="space-y-5">
        <Link
          to="/modules"
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-slate-500 hover:text-slate-800"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver a Mis Módulos
        </Link>
        <DetailSkeleton />
      </div>
    )
  }

  if (moduleQuery.isError || !module) {
    return (
      <div className="space-y-5">
        <Link
          to="/modules"
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-slate-500 hover:text-slate-800"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver a Mis Módulos
        </Link>
        <EmptyState
          icon={AlertCircle}
          title="No pudimos abrir este módulo"
          description={getApiErrorMessage(moduleQuery.error)}
          action={
            <Button variant="outline" onClick={() => navigate('/modules')}>
              Ir a Mis Módulos
            </Button>
          }
        />
      </div>
    )
  }

  const selectedTaskWithModule: TaskWithModule | null = selectedTask
    ? {
        // Toma siempre la versión fresca de la query para que el drawer
        // reaccione a cambios (p. ej. al tomar una tarea sin responsable).
        task: tasks.find((task) => task.id === selectedTask.id) ?? selectedTask,
        module,
        members,
      }
    : null

  return (
    <div className="space-y-5">
      <nav className="flex flex-wrap items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        <Link to="/modules" className="transition hover:text-brand-600">
          Módulos
        </Link>
        <span className="text-slate-300">/</span>
        <span className="max-w-[280px] truncate text-slate-600">{module.name}</span>
        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
          {moduleCode(module.id)}
        </span>
      </nav>

      <section className="card overflow-hidden">
        <div className="border-b border-line/70 bg-gradient-to-r from-brand-50/50 via-white to-white px-5 py-5 sm:px-6 dark:from-brand-500/10 dark:via-[rgb(var(--c-surface))] dark:to-[rgb(var(--c-surface))]">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              className={cn(
                'border-0 ring-0',
                isOwner ? 'bg-brand-100 text-brand-700' : 'bg-blue-50 text-blue-700',
              )}
            >
              {isOwner ? <Crown className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
              Tu rol: {me?.rol ?? 'MEMBER'} ({isOwner ? 'Propietario' : 'Integrante'})
            </Badge>
            <Badge className="border-0 bg-slate-50 text-slate-600 ring-0">
              <span className={cn('h-1.5 w-1.5 rounded-full', MODULE_STATE_DOT[module.state])} />
              Estado: {MODULE_STATE_LABEL[module.state]}
            </Badge>
            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
              ID: {moduleCode(module.id)}
            </span>
          </div>

          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h1 className="text-[24px] font-bold leading-tight tracking-[-0.03em] text-slate-900 sm:text-[28px]">
                {module.name}
              </h1>
              <p className="mt-1.5 max-w-3xl text-[13px] leading-relaxed text-slate-500">
                {module.description || 'Este módulo no tiene descripción.'}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <Avatar name={creatorName} seed={module.creator ?? module.id} size="xs" />
                  Creado por <strong className="font-semibold text-slate-700">{creatorName}</strong>
                </span>
                <span className="text-slate-300">·</span>
                <span>{formatMonthYear(module.created_at)}</span>
                <span className="text-slate-300">·</span>
                <span>
                  {tasks.length} {tasks.length === 1 ? 'tarea' : 'tareas'}
                </span>
                <span className="text-slate-300">·</span>
                <span>
                  {members.length} {members.length === 1 ? 'integrante' : 'integrantes'}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {isOwner ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => setEditModuleOpen(true)}>
                    <Pencil className="h-4 w-4" />
                    Editar módulo
                  </Button>
                  <button
                    type="button"
                    onClick={() => setDeleteModuleOpen(true)}
                    title="Eliminar módulo"
                    aria-label="Eliminar módulo"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-slate-400 transition hover:border-red-100 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              ) : null}
              <Button size="sm" onClick={() => setCreateTaskOpen(true)}>
                <Plus className="h-4 w-4" />
                Nueva tarea
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 px-5 py-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <div className="mb-1.5 flex items-center justify-between text-[10px] font-semibold">
              <span className="uppercase tracking-[0.1em] text-slate-400">Progreso del módulo</span>
              <span className="text-slate-600">
                {counts.COMPLETADA}/{tasks.length} tareas ({progress}%)
              </span>
            </div>
            <ProgressBar
              value={progress}
              label={`Avance de ${module.name}`}
              tone={progress === 100 && tasks.length > 0 ? 'success' : 'brand'}
              size="md"
            />
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-medium text-slate-500">
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                {counts.PENDIENTE} pendientes
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                {counts.EN_CURSO} en curso
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {counts.COMPLETADA} completadas
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 lg:pl-6">
            <MiniStat icon={ClipboardList} label="Tareas" value={tasks.length} />
            <MiniStat icon={CheckCircle2} label="Hechas" value={counts.COMPLETADA} tone="mint" />
            <MiniStat icon={Users} label="Equipo" value={members.length} tone="blue" />
          </div>
        </div>
      </section>

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <FilterTabs
            value={tab}
            onChange={setTab}
            tabs={[
              { key: 'BOARD', label: 'Tablero de Tareas', count: tasks.length, icon: <Columns3 className="h-3.5 w-3.5" /> },
              { key: 'LIST', label: 'Lista de Tareas', count: filteredTasks.length, icon: <List className="h-3.5 w-3.5" /> },
              { key: 'MEMBERS', label: 'Integrantes', count: members.length, icon: <Users className="h-3.5 w-3.5" /> },
            ]}
          />

          {tab !== 'MEMBERS' ? (
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Filtrar por nombre o clave…"
              className="sm:w-[260px]"
            />
          ) : (
            isOwner ? (
              <Button size="sm" variant="outline" onClick={() => setAddMemberOpen(true)}>
                <UserPlus className="h-4 w-4" />
                Agregar integrante
              </Button>
            ) : null
          )}
        </div>

        <div className="p-4 sm:p-5">
          {tab === 'MEMBERS' ? (
            <MembersPanel
              members={members}
              currentUserId={user?.id ?? 0}
              isOwner={isOwner}
              onAdd={() => setAddMemberOpen(true)}
              onRemove={setRemovingMember}
              onTransfer={setTransferringMember}
              onLeave={() => setLeaveOpen(true)}
              isLeaving={leaveModule.isPending}
            />
          ) : tasksQuery.isLoading ? (
            <div className="grid gap-3 lg:grid-cols-3">
              {[0, 1, 2].map((column) => (
                <div key={column} className="space-y-2 rounded-2xl bg-slate-100/60 p-2.5">
                  {[0, 1, 2].map((item) => (
                    <div key={item} className="skeleton h-32 w-full rounded-xl" />
                  ))}
                </div>
              ))}
            </div>
          ) : tasksQuery.isError ? (
            <EmptyState
              icon={ClipboardList}
              compact
              title="No pudimos cargar las tareas"
              description={getApiErrorMessage(tasksQuery.error)}
              action={
                <Button variant="outline" size="sm" onClick={() => void tasksQuery.refetch()}>
                  Reintentar
                </Button>
              }
            />
          ) : tasks.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              compact
              title="Aún no hay tareas"
              description="Crea la primera tarea del módulo y asígnala a un integrante del equipo."
              action={
                <Button size="sm" onClick={() => setCreateTaskOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Crear tarea
                </Button>
              }
            />
          ) : filteredTasks.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              compact
              title="Sin tareas con esa búsqueda"
              description="Prueba con otro título, descripción, responsable o código de tarea."
              action={
                <Button variant="outline" size="sm" onClick={() => setSearch('')}>
                  Limpiar búsqueda
                </Button>
              }
            />
          ) : tab === 'BOARD' ? (
            <div className="grid gap-3 lg:grid-cols-3">
              {BOARD_COLUMNS.map((column) => {
                const columnTasks = filteredTasks.filter((task) => task.state === column.state)
                return (
                  <section key={column.state} className="rounded-2xl bg-slate-100/60 p-2.5">
                    <header className="flex items-center justify-between px-2 py-2">
                      <div className="flex items-center gap-2">
                        <span className={cn('h-2 w-2 rounded-full', column.dot)} />
                        <h2 className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-600">
                          {column.label}
                        </h2>
                        <span className="rounded-md bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                          {columnTasks.length}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCreateTaskOpen(true)}
                        className="action-icon h-7 w-7"
                        title={`Nueva tarea en ${column.label}`}
                        aria-label={`Nueva tarea en ${column.label}`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </header>

                    <div className="space-y-2">
                      {columnTasks.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-line bg-white/60 px-3 py-8 text-center text-[11px] text-slate-400">
                          Sin tareas en este estado
                        </div>
                      ) : (
                        columnTasks.map((task) => (
                          <ModuleTaskCard
                            key={task.id}
                            task={task}
                            currentUserId={user?.id ?? 0}
                            canEdit={canEditTask(task)}
                            onOpen={() => setSelectedTask(task)}
                            onTake={() => handleTakeTask(task)}
                            taking={updateTask.isPending}
                          />
                        ))
                      )}
                    </div>
                  </section>
                )
              })}
            </div>
          ) : (
            <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
              {filteredTasks.map((task) => {
                const completed = task.state === 'COMPLETADA'
                const editable = canEditTask(task)
                return (
                  <li
                    key={task.id}
                    className="flex flex-col gap-3 px-4 py-3.5 transition hover:bg-slate-50/60 sm:flex-row sm:items-center"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleTask(task)}
                      disabled={!editable || updateTask.isPending}
                      aria-label={completed ? 'Marcar como pendiente' : 'Marcar como completada'}
                      className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition',
                        completed
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-slate-300 bg-white text-transparent',
                        editable
                          ? 'hover:border-brand-500 hover:text-brand-500'
                          : 'cursor-not-allowed opacity-60',
                      )}
                    >
                      <CheckCircle2 className="h-3 w-3" strokeWidth={3} />
                    </button>

                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          'text-[13px] font-semibold',
                          completed ? 'text-slate-400 line-through' : 'text-slate-900',
                        )}
                      >
                        {task.title}
                      </p>
                      {task.description ? (
                        <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">
                          {task.description}
                        </p>
                      ) : null}
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className="font-medium text-slate-400">{taskCode(task.id)}</span>
                        <span className="text-slate-300">·</span>
                        <Badge className={cn('border-0 ring-0', TASK_STATE_STYLES[task.state])}>
                          {TASK_STATE_LABEL[task.state]}
                        </Badge>
                        <Badge
                          className={cn(
                            'border-0 ring-0',
                            task.priority === 'ALTA'
                              ? 'bg-rose-50 text-rose-700'
                              : task.priority === 'MEDIA'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-slate-100 text-slate-600',
                          )}
                        >
                          <span className={cn('h-1.5 w-1.5 rounded-full', PRIORITY_DOT[task.priority])} />
                          {PRIORITY_LABEL[task.priority]}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {task.assignee_id != null ? (
                        <span className="flex items-center gap-1.5">
                          <Avatar
                            name={task.assignee_name ?? 'Usuario'}
                            seed={task.assignee_id}
                            size="xs"
                          />
                          <span className="max-w-[110px] truncate text-[11px] text-slate-500">
                            {task.assignee_id === user?.id ? 'Tú' : task.assignee_name}
                          </span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleTakeTask(task)}
                          className="inline-flex h-7 items-center gap-1 rounded-md bg-brand-50 px-2 text-[10px] font-semibold text-brand-700 transition hover:bg-brand-100"
                        >
                          <UserPlus className="h-3 w-3" />
                          Tomar tarea
                        </button>
                      )}

                      <span className="hidden text-[10px] text-slate-400 sm:inline">
                        {formatRelative(task.updated_at)}
                      </span>

                      <button
                        type="button"
                        onClick={() => setSelectedTask(task)}
                        className="action-icon"
                        aria-label={`Ver tarea ${task.title}`}
                        title="Ver detalle"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      <ModuleFormModal
        open={editModuleOpen}
        onClose={() => setEditModuleOpen(false)}
        module={module}
      />

      <TaskFormModal
        open={createTaskOpen}
        onClose={() => setCreateTaskOpen(false)}
        moduleId={moduleId}
        members={members}
        currentUserId={user?.id ?? 0}
        isOwner={isOwner}
      />

      <AddMemberModal
        open={addMemberOpen}
        onClose={() => setAddMemberOpen(false)}
        moduleId={moduleId}
        members={members}
      />

      {selectedTaskWithModule ? (
        <TaskDrawer
          open={selectedTask !== null}
          onClose={() => setSelectedTask(null)}
          task={selectedTaskWithModule.task}
          module={module}
          members={members}
          currentUserId={user?.id ?? 0}
          isOwner={isOwner}
        />
      ) : null}

      <ConfirmDialog
        open={removingMember !== null}
        onClose={() => setRemovingMember(null)}
        onConfirm={() => {
          if (!removingMember) return
          removeMember.mutate(removingMember.user_id, {
            onSuccess: () => {
              toast.success('Integrante eliminado', 'Sus tareas quedaron sin responsable.')
              setRemovingMember(null)
            },
            onError: (error) => toast.error('No se pudo quitar', getApiErrorMessage(error)),
          })
        }}
        title="Quitar integrante"
        description={
          <>
            ¿Quieres quitar a <strong>{removingMember?.name}</strong> del módulo? Sus tareas quedarán
            sin responsable y no se eliminarán.
          </>
        }
        confirmLabel="Quitar integrante"
        loading={removeMember.isPending}
      />

      <ConfirmDialog
        open={transferringMember !== null}
        onClose={() => setTransferringMember(null)}
        onConfirm={() => {
          if (!transferringMember) return
          transferOwnership.mutate(transferringMember.user_id, {
            onSuccess: () => {
              toast.success('Propiedad transferida', `${transferringMember.name} ahora es OWNER.`)
              setTransferringMember(null)
            },
            onError: (error) =>
              toast.error('No se pudo transferir', getApiErrorMessage(error)),
          })
        }}
        title={`¿Transferir rol de OWNER a ${transferringMember?.name ?? 'este integrante'}?`}
        description={
          <>
            Estás a punto de transferir la propiedad del módulo <strong>{module.name}</strong>.
            Pasarás a ser MEMBER y esta acción no se puede deshacer desde la interfaz.
          </>
        }
        confirmLabel="Transferir propiedad"
        tone="primary"
        loading={transferOwnership.isPending}
      >
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-line bg-slate-50/60 p-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
              Propietario actual
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-[12px] font-semibold text-slate-800">
              <Crown className="h-3.5 w-3.5 text-amber-500" />
              {owner?.name ?? user?.name}
            </p>
            <span className="mt-1.5 inline-flex rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
              Nuevo rol: MEMBER
            </span>
          </div>
          <div className="rounded-xl border border-brand-100 bg-brand-50/60 p-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-brand-500">
              Nuevo propietario
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-[12px] font-semibold text-brand-800">
              <Crown className="h-3.5 w-3.5 text-brand-500" />
              {transferringMember?.name}
            </p>
            <span className="mt-1.5 inline-flex rounded-md bg-brand-100 px-1.5 py-0.5 text-[9px] font-bold text-brand-700">
              Nuevo rol: OWNER
            </span>
          </div>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        onConfirm={() => {
          leaveModule.mutate(undefined, {
            onSuccess: () => {
              toast.success('Has abandonado el módulo')
              navigate('/modules')
            },
            onError: (error) => toast.error('No se pudo abandonar', getApiErrorMessage(error)),
          })
        }}
        title="Abandonar módulo"
        description="¿Quieres abandonar este módulo? Tus tareas quedarán sin responsable y perderás el acceso."
        confirmLabel="Abandonar"
        loading={leaveModule.isPending}
      />

      <ConfirmDialog
        open={deleteModuleOpen}
        onClose={() => setDeleteModuleOpen(false)}
        onConfirm={() => {
          deleteModule.mutate(moduleId, {
            onSuccess: () => {
              toast.success('Módulo eliminado', 'El módulo y sus tareas se eliminaron.')
              navigate('/modules')
            },
            onError: (error) => toast.error('No se pudo eliminar', getApiErrorMessage(error)),
          })
        }}
        title={`¿Eliminar módulo «${module.name}»?`}
        description="Esta acción elimina el módulo junto con todas sus tareas asociadas de forma permanente."
        confirmLabel="Eliminar módulo definitivamente"
        loading={deleteModule.isPending}
        requireText={module.name}
      >
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-slate-50/60 px-3 py-2.5 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <ClipboardList className="h-3.5 w-3.5" />
            {tasks.length} tareas
          </span>
          <span className="text-slate-300">·</span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {members.length} integrantes
          </span>
          <span className="ml-auto">
            Propietario: <strong className="text-slate-700">{owner?.name ?? 'Sin OWNER'}</strong>
          </span>
        </div>
      </ConfirmDialog>
    </div>
  )
}

function MiniStat({
  icon: Icon,
  label,
  value,
  tone = 'brand',
}: {
  icon: typeof ClipboardList
  label: string
  value: number
  tone?: 'brand' | 'mint' | 'blue'
}) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600',
    mint: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
  }
  return (
    <div className="rounded-xl border border-line bg-slate-50/60 px-3 py-2">
      <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
        <span className={cn('flex h-5 w-5 items-center justify-center rounded-md', tones[tone])}>
          <Icon className="h-3 w-3" />
        </span>
        {label}
      </div>
      <p className="mt-1 text-[18px] font-bold leading-none tracking-[-0.03em] text-slate-900">
        {value}
      </p>
    </div>
  )
}

function ModuleTaskCard({
  task,
  currentUserId,
  canEdit,
  onOpen,
  onTake,
  taking,
}: {
  task: Task
  currentUserId: number
  canEdit: boolean
  onOpen: () => void
  onTake: () => void
  taking: boolean
}) {
  const completed = task.state === 'COMPLETADA'
  const priorityTone: Record<TaskPriority, string> = {
    ALTA: 'text-rose-600',
    MEDIA: 'text-amber-600',
    BAJA: 'text-slate-500',
  }

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
        <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500">
          {taskCode(task.id)}
        </span>
        <span
          className={cn(
            'inline-flex items-center gap-1 text-[9px] font-semibold',
            priorityTone[task.priority],
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
        <span className="text-[9px] text-slate-400">{formatRelative(task.updated_at)}</span>
        {task.assignee_name ? (
          <span className="inline-flex items-center gap-1 text-[9px] font-medium text-slate-500">
            <Avatar name={task.assignee_name} seed={task.assignee_id ?? 0} size="xs" />
            <span className="max-w-[90px] truncate">
              {task.assignee_id === currentUserId ? 'Tú' : task.assignee_name}
            </span>
          </span>
        ) : (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onTake()
            }}
            disabled={taking}
            className="inline-flex h-7 items-center gap-1 rounded-md bg-brand-50 px-2 text-[10px] font-semibold text-brand-700 transition hover:bg-brand-100 disabled:opacity-60"
          >
            <UserPlus className="h-3 w-3" />
            Tomar tarea
          </button>
        )}
      </div>
    </article>
  )
}
