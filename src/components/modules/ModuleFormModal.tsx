import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  AlertCircle,
  Check,
  FolderPlus,
  Info,
  Pencil,
  Search,
  X,
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { getApiErrorMessage, getApiFieldErrors } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useAllUsers } from '@/hooks/useMembers'
import { useCreateModule, useUpdateModule } from '@/hooks/useModules'
import { toast } from '@/stores/toast'
import type { Module, ModuleState } from '@/types'

const STATE_OPTIONS: { value: ModuleState; label: string }[] = [
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'EN_CURSO', label: 'En curso' },
  { value: 'COMPLETADO', label: 'Completado' },
]

interface ModuleFormModalProps {
  open: boolean
  onClose: () => void
  module?: Module
}

export function ModuleFormModal({ open, onClose, module }: ModuleFormModalProps) {
  const isEdit = Boolean(module)
  const createModule = useCreateModule()
  const updateModule = useUpdateModule(module?.id ?? 0)
  const usersQuery = useAllUsers(open && !isEdit)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [state, setState] = useState<ModuleState>('PENDIENTE')
  const [selectedMembers, setSelectedMembers] = useState<number[]>([])
  const [search, setSearch] = useState('')
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (!open) return
    setName(module?.name ?? '')
    setDescription(module?.description ?? '')
    setState(module?.state ?? 'PENDIENTE')
    setSelectedMembers([])
    setSearch('')
    setErrors({})
    setFormError('')
  }, [open, module])

  const users = usersQuery.data ?? []

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return users
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term),
    )
  }, [users, search])

  const selectedUsers = useMemo(
    () =>
      selectedMembers
        .map((id) => users.find((user) => user.id === id))
        .filter((user): user is NonNullable<typeof user> => Boolean(user)),
    [selectedMembers, users],
  )

  const toggleMember = (userId: number) => {
    setSelectedMembers((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId],
    )
  }

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

    if (!name.trim()) {
      setErrors({ name: ['El nombre es obligatorio.'] })
      return
    }

    if (isEdit && module) {
      updateModule.mutate(
        {
          name: name.trim(),
          description,
          state,
        },
        {
          onSuccess: () => {
            toast.success('Módulo actualizado', 'Los cambios se guardaron correctamente.')
            onClose()
          },
          onError: handleError,
        },
      )
      return
    }

    createModule.mutate(
      {
        name: name.trim(),
        description,
        members: selectedMembers,
      },
      {
        onSuccess: () => {
          toast.success('Módulo creado', 'Ya eres el OWNER de este módulo.')
          onClose()
        },
        onError: handleError,
      },
    )
  }

  const isPending = createModule.isPending || updateModule.isPending

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar módulo' : 'Nuevo Módulo'}
      description={
        isEdit
          ? 'Actualiza la información y el estado del módulo.'
          : 'Agrupa tareas, define objetivos y trabaja junto a tu equipo.'
      }
      icon={isEdit ? <Pencil className="h-5 w-5" /> : <FolderPlus className="h-5 w-5" />}
      size="lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" form="module-form" loading={isPending}>
            {isEdit ? 'Guardar cambios' : 'Crear Módulo'}
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

      <form id="module-form" onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="module-name" className="text-[12px] font-semibold text-slate-600">
              Nombre del módulo <span className="text-red-500">*</span>
            </label>
            <span className="text-[10px] tabular-nums text-slate-400">{name.length}/150</span>
          </div>
          <input
            id="module-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={150}
            placeholder="p. ej. Rediseño de Landing Page"
            className={cn('field h-10 text-[13px]', errors.name && 'field-error')}
            aria-invalid={Boolean(errors.name)}
            autoFocus
          />
          {errors.name ? (
            <p className="mt-1.5 text-xs font-medium text-red-600">{errors.name.join(' ')}</p>
          ) : null}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label
              htmlFor="module-description"
              className="text-[12px] font-semibold text-slate-600"
            >
              Descripción
            </label>
            <span className="text-[10px] text-slate-400">Opcional</span>
          </div>
          <textarea
            id="module-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe el objetivo del módulo, el alcance y el contexto del equipo…"
            className={cn(
              'field min-h-[104px] resize-y py-3 text-[13px]',
              errors.description && 'field-error',
            )}
          />
          {errors.description ? (
            <p className="mt-1.5 text-xs font-medium text-red-600">
              {errors.description.join(' ')}
            </p>
          ) : null}
        </div>

        {isEdit ? (
          <div>
            <label htmlFor="module-state" className="label">
              Estado
            </label>
            <select
              id="module-state"
              value={state}
              onChange={(event) => setState(event.target.value as ModuleState)}
              className="field h-10 cursor-pointer text-[13px]"
            >
              {STATE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-1.5 flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-500">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              Solo puede marcarse como Completado cuando todas las tareas del módulo estén
              completadas.
            </p>
            {errors.state ? (
              <p className="mt-1.5 text-xs font-medium text-red-600">{errors.state.join(' ')}</p>
            ) : null}
          </div>
        ) : (
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[12px] font-semibold text-slate-600">
                Integrantes iniciales
              </span>
              <span className="text-[10px] text-slate-400">Opcional</span>
            </div>

            {selectedUsers.length > 0 ? (
              <div className="mb-2.5 flex flex-wrap gap-1.5">
                {selectedUsers.map((user) => (
                  <span
                    key={user.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 py-1 pl-1 pr-1.5 text-[11px] font-medium text-brand-700"
                  >
                    <Avatar name={user.name} seed={user.id} size="xs" />
                    <span className="max-w-[140px] truncate">{user.name}</span>
                    <button
                      type="button"
                      onClick={() => toggleMember(user.id)}
                      className="flex h-4 w-4 items-center justify-center rounded-full text-brand-500 transition hover:bg-brand-100 hover:text-brand-700"
                      aria-label={`Quitar a ${user.name}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : null}

            <div className="relative mb-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nombre o correo electrónico"
                className="field h-10 pl-9 text-[13px]"
              />
            </div>

            <div className="max-h-60 space-y-0.5 overflow-y-auto rounded-xl border border-line bg-slate-50/40 p-1.5">
              {usersQuery.isLoading ? (
                <div className="space-y-1.5 p-1">
                  {[0, 1, 2].map((item) => (
                    <div key={item} className="skeleton h-11 w-full" />
                  ))}
                </div>
              ) : filteredUsers.length === 0 ? (
                <p className="px-3 py-8 text-center text-xs text-slate-400">
                  No se encontraron usuarios que coincidan con la búsqueda.
                </p>
              ) : (
                filteredUsers.map((user) => {
                  const checked = selectedMembers.includes(user.id)
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => toggleMember(user.id)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition',
                        checked
                          ? 'bg-white shadow-sm ring-1 ring-inset ring-brand-200'
                          : 'hover:bg-white/80',
                      )}
                    >
                      <Avatar name={user.name} seed={user.id} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-slate-800">
                          {user.name}
                        </span>
                        <span className="block truncate text-[11px] text-slate-500">
                          {user.email}
                        </span>
                      </span>
                      <span
                        className={cn(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition',
                          checked
                            ? 'border-brand-600 bg-brand-600 text-white'
                            : 'border-slate-300 bg-white text-transparent',
                        )}
                      >
                        <Check className="h-3 w-3" />
                      </span>
                    </button>
                  )
                })
              )}
            </div>

            <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-500">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span>
                Los integrantes se incorporan como{' '}
                <strong className="text-slate-700">MEMBER</strong>. Podrás transferir el rol de
                OWNER desde el detalle del módulo.
              </span>
            </p>

            {selectedMembers.length > 0 ? (
              <p className="mt-1.5 text-[11px] font-medium text-brand-700">
                {selectedMembers.length} integrante
                {selectedMembers.length === 1 ? '' : 's'} seleccionado
                {selectedMembers.length === 1 ? '' : 's'}.
              </p>
            ) : null}

            {errors.members ? (
              <p className="mt-1.5 text-xs font-medium text-red-600">
                {errors.members.join(' ')}
              </p>
            ) : null}
          </div>
        )}
      </form>
    </Modal>
  )
}
