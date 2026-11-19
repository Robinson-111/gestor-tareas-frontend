import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Save,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { getApiErrorMessage } from '@/lib/api'
import { useDeleteTask, useUpdateTask } from '@/hooks/useTasks'
import { toast } from '@/stores/toast'
import {
  PRIORITY_DOT,
  PRIORITY_LABEL,
  TASK_STATE_LABEL,
  TASK_STATE_STYLES,
  cn,
  formatRelative,
  moduleCode,
  taskCode,
} from '@/lib/utils'
import type { Member, Module, Task, TaskPriority, TaskState } from '@/types'

interface TaskDrawerProps {
  open: boolean
  onClose: () => void
  task: Task | null
  module: Module
  members: Member[]
  currentUserId: number
  isOwner: boolean
}

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 'BAJA', label: 'Baja' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'ALTA', label: 'Alta' },
]

const STATE_OPTIONS: { value: TaskState; label: string }[] = [
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'EN_CURSO', label: 'En curso' },
  { value: 'COMPLETADA', label: 'Completada' },
]

export function TaskDrawer({
  open,
  onClose,
  task,
  module,
  members,
  currentUserId,
  isOwner,
}: TaskDrawerProps) {
  const updateTask = useUpdateTask(module.id)
  const deleteTask = useDeleteTask(module.id)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('MEDIA')
  const [state, setState] = useState<TaskState>('PENDIENTE')
  const [assigneeId, setAssigneeId] = useState('')
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (!open || !task) return
    setTitle(task.title)
    setDescription(task.description ?? '')
    setPriority(task.priority)
    setState(task.state)
    setAssigneeId(task.assignee_id ? String(task.assignee_id) : '')
    setFormError('')
  }, [open, task])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!open || !task) return null

  // Solo el responsable puede editar los campos; el OWNER puede editar cualquiera.
  // Una tarea sin responsable no es editable: solo se puede "tomar".
  const canEdit = isOwner || task.assignee_id === currentUserId
  const canDelete = isOwner || task.assignee_id === currentUserId || task.assignee_id === null

  const assigneeOptions = [
    { value: '', label: 'Sin asignar' },
    ...members.map((member) => ({
      value: String(member.user_id),
      label: member.user_id === currentUserId ? `${member.name} (tú)` : member.name,
    })),
  ]

  const save = (nextState?: TaskState) => {
    if (!canEdit) return
    setFormError('')

    if (!title.trim()) {
      setFormError('El título es obligatorio.')
      return
    }

    updateTask.mutate(
      {
        taskId: task.id,
        payload: {
          title: title.trim(),
          description,
          priority,
          state: nextState ?? state,
          assignee_id: assigneeId ? Number(assigneeId) : null,
        },
      },
      {
        onSuccess: () => {
          toast.success('Tarea actualizada', 'Los cambios se guardaron correctamente.')
          onClose()
        },
        onError: (error) => setFormError(getApiErrorMessage(error)),
      },
    )
  }

  // Un MEMBER puede "tomar" una tarea sin responsable: se la asigna a sí
  // mismo y queda en curso. Los demás campos siguen bloqueados hasta ser
  // el responsable.
  const takeTask = () => {
    updateTask.mutate(
      {
        taskId: task.id,
        payload: { assignee_id: currentUserId, state: 'EN_CURSO' },
      },
      {
        onSuccess: () => toast.success('Tarea tomada', 'Ahora eres el responsable.'),
        onError: (error) => setFormError(getApiErrorMessage(error)),
      },
    )
  }

  const remove = () => {
    deleteTask.mutate(task.id, {
      onSuccess: () => {
        toast.success('Tarea eliminada')
        onClose()
      },
      onError: (error) => setFormError(getApiErrorMessage(error)),
    })
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-slate-950/30 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Detalle de la tarea"
        className="relative flex h-full w-full max-w-[540px] flex-col border-l border-line bg-white shadow-drawer animate-slide-in-right"
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
              <ClipboardList className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Detalle de la Tarea
              </p>
              <p className="mt-0.5 text-[12px] font-semibold text-slate-700">
                {taskCode(task.id)} · {moduleCode(module.id)}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="action-icon" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-0 bg-brand-50 text-brand-700 ring-0">{module.name}</Badge>
            <Badge className={cn('border-0 ring-0', TASK_STATE_STYLES[task.state])}>
              {TASK_STATE_LABEL[task.state]}
            </Badge>
          </div>

          <div className="mt-4">
            <label htmlFor="drawer-title" className="label">
              Título de la tarea
            </label>
            <input
              id="drawer-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={!canEdit}
              maxLength={150}
              className="field text-[16px] font-semibold"
            />
            <p className="mt-1 text-right text-[10px] text-slate-400">{title.length}/150</p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="drawer-state" className="label">
                Estado
              </label>
              <select
                id="drawer-state"
                value={state}
                onChange={(event) => setState(event.target.value as TaskState)}
                disabled={!canEdit}
                className="field h-10 cursor-pointer text-[12px] font-semibold"
              >
                {STATE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="drawer-priority" className="label">
                Prioridad
              </label>
              <select
                id="drawer-priority"
                value={priority}
                onChange={(event) => setPriority(event.target.value as TaskPriority)}
                disabled={!canEdit}
                className="field h-10 cursor-pointer text-[12px] font-semibold"
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="drawer-assignee" className="label">
                Responsable
              </label>
              <select
                id="drawer-assignee"
                value={assigneeId}
                onChange={(event) => setAssigneeId(event.target.value)}
                disabled={!canEdit}
                className="field h-10 cursor-pointer text-[12px] font-semibold"
              >
                {assigneeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="drawer-description" className="label">
              Descripción
            </label>
            <textarea
              id="drawer-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={!canEdit}
              placeholder="Describe los requisitos, criterios de aceptación o enlaces relevantes…"
              className="field min-h-[150px] resize-y py-3 text-[13px] leading-relaxed"
            />
          </div>

          {formError ? (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-[12px] text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{formError}</p>
            </div>
          ) : null}

          {!canEdit ? (
            task.assignee_id === null ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5 text-[12px] text-amber-700">
                <span>
                  Esta tarea no tiene responsable. Puedes tomarla para convertirla en tuya.
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="soft"
                  loading={updateTask.isPending}
                  onClick={takeTask}
                >
                  <UserPlus className="h-4 w-4" />
                  Tomar tarea
                </Button>
              </div>
            ) : (
              <p className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5 text-[12px] text-amber-700">
                Solo el OWNER o el responsable pueden modificar esta tarea.
              </p>
            )
          ) : null}

          <div className="mt-5 rounded-xl border border-line bg-slate-50/60 p-3.5">
            <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5" />
                Última modificación {formatRelative(task.updated_at)}
              </span>
              {task.assignee_name ? (
                <span className="inline-flex items-center gap-1.5">
                  <Avatar name={task.assignee_name} seed={task.assignee_id ?? 0} size="xs" />
                  {task.assignee_name}
                </span>
              ) : (
                <span>Sin responsable</span>
              )}
            </div>
            <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <span className={cn('h-2 w-2 rounded-full', PRIORITY_DOT[task.priority])} />
                Prioridad {PRIORITY_LABEL[task.priority]}
              </span>
            </div>
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-slate-50/50 px-6 py-4">
          {canDelete ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
              loading={deleteTask.isPending}
              onClick={remove}
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </Button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            {canEdit ? (
              <Button
                type="button"
                size="sm"
                variant="soft"
                loading={updateTask.isPending}
                onClick={() => save('COMPLETADA')}
              >
                <CheckCircle2 className="h-4 w-4" />
                Marcar completada
              </Button>
            ) : null}
            {canEdit ? (
              <Button
                type="button"
                size="sm"
                loading={updateTask.isPending}
                onClick={() => save()}
              >
                <Save className="h-4 w-4" />
                Guardar cambios
              </Button>
            ) : null}
          </div>
        </footer>
      </aside>
    </div>,
    document.body,
  )
}
