import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { AlertCircle, ClipboardPlus, Info, Pencil } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { getApiErrorMessage, getApiFieldErrors } from '@/lib/api'
import { useCreateTask, useUpdateTask } from '@/hooks/useTasks'
import { toast } from '@/stores/toast'
import type { Member, Task, TaskPriority, TaskState } from '@/types'

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

interface TaskFormModalProps {
  open: boolean
  onClose: () => void
  moduleId: number
  task?: Task
  members: Member[]
  currentUserId: number
  isOwner: boolean
}

export function TaskFormModal({
  open,
  onClose,
  moduleId,
  task,
  members,
  currentUserId,
  isOwner,
}: TaskFormModalProps) {
  const isEdit = Boolean(task)
  const createTask = useCreateTask(moduleId)
  const updateTask = useUpdateTask(moduleId)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('MEDIA')
  const [state, setState] = useState<TaskState>('PENDIENTE')
  const [assigneeId, setAssigneeId] = useState('')
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (!open) return

    setTitle(task?.title ?? '')
    setDescription(task?.description ?? '')
    setPriority(task?.priority ?? 'MEDIA')
    setState(task?.state ?? 'PENDIENTE')
    setErrors({})
    setFormError('')

    if (task?.assignee_id != null) {
      setAssigneeId(String(task.assignee_id))
    } else if (task && !isOwner) {
      // Un MEMBER solo puede tomar una tarea sin asignar asignándosela a sí mismo.
      setAssigneeId(String(currentUserId))
    } else {
      setAssigneeId('')
    }
  }, [open, task, isOwner, currentUserId])

  const assigneeOptions = useMemo(
    () => [
      { value: '', label: 'Sin asignar' },
      ...members.map((member) => ({
        value: String(member.user_id),
        label: member.user_id === currentUserId ? `${member.name} (tú)` : member.name,
      })),
    ],
    [members, currentUserId],
  )

  const selectedAssignee = members.find(
    (member) => String(member.user_id) === assigneeId,
  )

  const handleError = (error: unknown) => {
    const fieldErrors = getApiFieldErrors(error)
    setErrors(fieldErrors)
    if (Object.keys(fieldErrors).length === 0) {
      setFormError(getApiErrorMessage(error))
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setErrors({})
    setFormError('')

    if (!title.trim()) {
      setErrors({ title: ['El título es obligatorio.'] })
      return
    }

    const assignee_id = assigneeId ? Number(assigneeId) : null

    if (isEdit && task) {
      updateTask.mutate(
        {
          taskId: task.id,
          payload: {
            title: title.trim(),
            description,
            priority,
            state,
            assignee_id,
          },
        },
        {
          onSuccess: () => {
            toast.success('Tarea actualizada', 'Los cambios se guardaron correctamente.')
            onClose()
          },
          onError: handleError,
        },
      )
      return
    }

    createTask.mutate(
      {
        title: title.trim(),
        description,
        priority,
        assignee_id,
      },
      {
        onSuccess: () => {
          toast.success('Tarea creada', 'La tarea se añadió al módulo.')
          onClose()
        },
        onError: handleError,
      },
    )
  }

  const isPending = createTask.isPending || updateTask.isPending

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar tarea' : 'Nueva Tarea'}
      description={
        isEdit
          ? 'Actualiza los detalles, el estado o el responsable de la tarea.'
          : 'Describe la tarea y asígnala a un integrante del módulo.'
      }
      icon={isEdit ? <Pencil className="h-5 w-5" /> : <ClipboardPlus className="h-5 w-5" />}
      size="lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" form="task-form" loading={isPending}>
            {isEdit ? 'Guardar cambios' : 'Crear Tarea'}
          </Button>
        </>
      }
    >
      {formError ? (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{formError}</p>
        </div>
      ) : null}

      <form id="task-form" onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="task-title" className="text-[12px] font-semibold text-slate-600">
              Título de la tarea <span className="text-red-500">*</span>
            </label>
            <span className="text-[10px] tabular-nums text-slate-400">{title.length}/150</span>
          </div>
          <input
            id="task-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={150}
            placeholder="p. ej. Diseñar wireframes de alta fidelidad"
            className="field h-10 text-[13px]"
            aria-invalid={Boolean(errors.title)}
            autoFocus
          />
          {errors.title ? (
            <p className="mt-1.5 text-xs font-medium text-red-600">{errors.title.join(' ')}</p>
          ) : null}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label
              htmlFor="task-description"
              className="text-[12px] font-semibold text-slate-600"
            >
              Descripción y notas
            </label>
            <span className="text-[10px] text-slate-400">Opcional</span>
          </div>
          <textarea
            id="task-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Añade contexto, criterios de aceptación o enlaces relevantes…"
            className="field min-h-[104px] resize-y py-3 text-[13px]"
          />
          {errors.description ? (
            <p className="mt-1.5 text-xs font-medium text-red-600">
              {errors.description.join(' ')}
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="task-priority" className="label">
              Prioridad
            </label>
            <select
              id="task-priority"
              value={priority}
              onChange={(event) => setPriority(event.target.value as TaskPriority)}
              className="field h-10 cursor-pointer text-[13px]"
            >
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {isEdit ? (
            <div>
              <label htmlFor="task-state" className="label">
                Estado
              </label>
              <select
                id="task-state"
                value={state}
                onChange={(event) => setState(event.target.value as TaskState)}
                className="field h-10 cursor-pointer text-[13px]"
              >
                {STATE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label htmlFor="task-assignee" className="label">
                Responsable
              </label>
              <select
                id="task-assignee"
                value={assigneeId}
                onChange={(event) => setAssigneeId(event.target.value)}
                className="field h-10 cursor-pointer text-[13px]"
              >
                {assigneeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {isEdit ? (
          <div>
            <label htmlFor="task-assignee" className="label">
              Responsable
            </label>
            <select
              id="task-assignee"
              value={assigneeId}
              onChange={(event) => setAssigneeId(event.target.value)}
              className="field h-10 cursor-pointer text-[13px]"
            >
              {assigneeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="flex items-center gap-3 rounded-xl border border-line bg-slate-50/60 px-3.5 py-3">
          {selectedAssignee ? (
            <>
              <Avatar name={selectedAssignee.name} seed={selectedAssignee.user_id} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-semibold text-slate-800">
                  {selectedAssignee.name}
                </p>
                <p className="text-[11px] text-slate-500">
                  Responsable asignado{selectedAssignee.rol === 'OWNER' ? ' · OWNER' : ''}
                </p>
              </div>
            </>
          ) : (
            <>
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-slate-300 bg-white text-slate-400">
                <Info className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-slate-700">Sin responsable</p>
                <p className="text-[11px] text-slate-500">
                  La tarea quedará disponible para tomarla desde el tablero.
                </p>
              </div>
            </>
          )}
        </div>

        {isEdit ? (
          <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-500">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span>
              Recuerda que solo el OWNER puede reasignar tareas a otros integrantes.
            </span>
          </p>
        ) : null}
      </form>
    </Modal>
  )
}
