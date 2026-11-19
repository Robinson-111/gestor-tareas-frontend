import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, ClipboardPlus, Plus } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { getApiErrorMessage, getApiFieldErrors } from '@/lib/api'
import { useCreateTask } from '@/hooks/useTasks'
import { toast } from '@/stores/toast'
import type { ModuleOverview, TaskPriority } from '@/types'

interface TaskCreateModalProps {
  open: boolean
  onClose: () => void
  overviews: ModuleOverview[]
  defaultModuleId?: number
  currentUserId: number
}

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 'BAJA', label: 'Baja' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'ALTA', label: 'Alta' },
]

export function TaskCreateModal({
  open,
  onClose,
  overviews,
  defaultModuleId,
  currentUserId,
}: TaskCreateModalProps) {
  const [moduleId, setModuleId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('MEDIA')
  const [assigneeId, setAssigneeId] = useState('')
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [formError, setFormError] = useState('')

  const createTask = useCreateTask(Number(moduleId) || 0)

  useEffect(() => {
    if (!open) return
    setModuleId(defaultModuleId ? String(defaultModuleId) : String(overviews[0]?.module.id ?? ''))
    setTitle('')
    setDescription('')
    setPriority('MEDIA')
    setAssigneeId('')
    setErrors({})
    setFormError('')
  }, [open, defaultModuleId, overviews])

  const selectedModule = overviews.find((item) => item.module.id === Number(moduleId))

  const assigneeOptions = useMemo(
    () => [
      { value: '', label: 'Sin asignar' },
      ...(selectedModule?.members ?? []).map((member) => ({
        value: String(member.user_id),
        label: member.user_id === currentUserId ? `${member.name} (tú)` : member.name,
      })),
    ],
    [selectedModule, currentUserId],
  )

  const handleError = (error: unknown) => {
    const fieldErrors = getApiFieldErrors(error)
    setErrors(fieldErrors)
    if (Object.keys(fieldErrors).length === 0) {
      setFormError(getApiErrorMessage(error))
    }
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setErrors({})
    setFormError('')

    if (!moduleId) {
      setErrors({ module_id: ['Selecciona un módulo.'] })
      return
    }
    if (!title.trim()) {
      setErrors({ title: ['El título es obligatorio.'] })
      return
    }

    createTask.mutate(
      {
        title: title.trim(),
        description,
        priority,
        assignee_id: assigneeId ? Number(assigneeId) : null,
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nueva Tarea"
      description="Crea una tarea y asígnala dentro de uno de tus módulos de trabajo activos."
      icon={<ClipboardPlus className="h-5 w-5" />}
      size="lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={createTask.isPending}>
            Cancelar
          </Button>
          <Button type="submit" form="global-task-form" loading={createTask.isPending}>
            <Plus className="h-4 w-4" />
            Crear Tarea
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

      <form id="global-task-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="task-module" className="label">
            Módulo <span className="text-red-500">*</span>
          </label>
          <select
            id="task-module"
            value={moduleId}
            onChange={(event) => {
              setModuleId(event.target.value)
              setAssigneeId('')
            }}
            className="field h-10 cursor-pointer text-[13px]"
          >
            <option value="">Selecciona un módulo</option>
            {overviews.map(({ module, members }) => (
              <option key={module.id} value={module.id}>
                {module.name} ({members.find((member) => member.rol === 'OWNER') ? 'Owner' : 'Miembro'})
              </option>
            ))}
          </select>
          {errors.module_id ? (
            <p className="mt-1 text-xs font-medium text-red-600">{errors.module_id.join(' ')}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="task-title" className="label">
            Título de la tarea <span className="text-red-500">*</span>
          </label>
          <input
            id="task-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={150}
            placeholder="p. ej. Diseñar assets para redes sociales y newsletter"
            className="field h-10 text-[13px]"
            autoFocus
          />
          <div className="mt-1 flex items-center justify-between">
            {errors.title ? (
              <p className="text-xs font-medium text-red-600">{errors.title.join(' ')}</p>
            ) : (
              <span />
            )}
            <span className="text-[10px] text-slate-400">{title.length}/150</span>
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="task-description" className="text-[12px] font-semibold text-slate-600">
              Descripción y notas
            </label>
            <span className="text-[10px] text-slate-400">Opcional</span>
          </div>
          <textarea
            id="task-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe los requisitos, criterios de aceptación o enlaces relevantes…"
            className="field min-h-[100px] resize-y py-3 text-[13px]"
          />
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

          <div>
            <label htmlFor="task-assignee" className="label">
              Responsable (asignar a)
            </label>
            <select
              id="task-assignee"
              value={assigneeId}
              onChange={(event) => setAssigneeId(event.target.value)}
              className="field h-10 cursor-pointer text-[13px]"
              disabled={!selectedModule}
            >
              {assigneeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedModule ? (
          <div className="flex items-center gap-2.5 rounded-xl border border-line bg-slate-50/60 px-3 py-2.5 text-[11px] text-slate-500">
            <div className="flex -space-x-1.5">
              {selectedModule.members.slice(0, 3).map((member) => (
                <Avatar
                  key={member.user_id}
                  name={member.name}
                  seed={member.user_id}
                  size="xs"
                  ring
                />
              ))}
            </div>
            <span>
              {selectedModule.members.length}{' '}
              {selectedModule.members.length === 1 ? 'integrante' : 'integrantes'} disponibles en{' '}
              <strong className="text-slate-700">{selectedModule.module.name}</strong>
            </span>
          </div>
        ) : null}
      </form>
    </Modal>
  )
}
