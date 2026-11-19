import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Check, Info, Search, UserPlus } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { getApiErrorMessage, getApiFieldErrors } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useAddMember, useAllUsers } from '@/hooks/useMembers'
import { toast } from '@/stores/toast'
import type { Member } from '@/types'

interface AddMemberModalProps {
  open: boolean
  onClose: () => void
  moduleId: number
  members: Member[]
}

export function AddMemberModal({ open, onClose, moduleId, members }: AddMemberModalProps) {
  const usersQuery = useAllUsers(open)
  const addMember = useAddMember(moduleId)

  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [formError, setFormError] = useState('')
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  useEffect(() => {
    if (!open) return
    setSearch('')
    setSelectedId(null)
    setFormError('')
    setErrors({})
  }, [open])

  const existingIds = useMemo(() => new Set(members.map((member) => member.user_id)), [members])

  const candidates = useMemo(() => {
    const term = search.trim().toLowerCase()
    return (usersQuery.data ?? [])
      .filter((user) => !existingIds.has(user.id))
      .filter(
        (user) =>
          !term ||
          user.name.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term),
      )
  }, [usersQuery.data, existingIds, search])

  const selectedUser = candidates.find((user) => user.id === selectedId)

  const handleAdd = () => {
    if (!selectedId) return
    setFormError('')
    setErrors({})

    addMember.mutate(selectedId, {
      onSuccess: () => {
        toast.success('Integrante agregado', 'La persona ya forma parte del módulo.')
        onClose()
      },
      onError: (error) => {
        const fieldErrors = getApiFieldErrors(error)
        setErrors(fieldErrors)
        if (Object.keys(fieldErrors).length === 0) {
          setFormError(getApiErrorMessage(error))
        }
      },
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Agregar Integrante"
      description="Busca una cuenta y súmala al módulo como MEMBER."
      icon={<UserPlus className="h-5 w-5" />}
      size="lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={addMember.isPending}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleAdd}
            loading={addMember.isPending}
            disabled={!selectedId}
          >
            <UserPlus className="h-4 w-4" />
            Agregar Integrante
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

      {errors.user_id ? (
        <p className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {errors.user_id.join(' ')}
        </p>
      ) : null}

      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nombre o correo electrónico"
          className="field h-10 pl-9 text-[13px]"
          autoFocus
        />
      </div>

      <div className="max-h-72 space-y-0.5 overflow-y-auto rounded-xl border border-line bg-slate-50/40 p-1.5">
        {usersQuery.isLoading ? (
          <div className="space-y-1.5 p-1">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="skeleton h-12 w-full" />
            ))}
          </div>
        ) : candidates.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-[13px] font-semibold text-slate-700">No hay usuarios disponibles</p>
            <p className="mt-1 text-[11px] text-slate-500">
              Todas las cuentas encontradas ya forman parte del módulo.
            </p>
          </div>
        ) : (
          candidates.map((user) => {
            const selected = selectedId === user.id
            return (
              <button
                key={user.id}
                type="button"
                onClick={() => setSelectedId(user.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition',
                  selected
                    ? 'bg-white shadow-sm ring-1 ring-inset ring-brand-200'
                    : 'hover:bg-white/80',
                )}
              >
                <Avatar name={user.name} seed={user.id} size="md" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-slate-900">
                    {user.name}
                  </span>
                  <span className="block truncate text-[11px] text-slate-500">{user.email}</span>
                </span>
                <Badge className="bg-slate-100 text-slate-500 ring-slate-500/10">MEMBER</Badge>
                <span
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition',
                    selected
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

      {selectedUser ? (
        <div className="mt-3 flex items-center gap-3 rounded-xl border border-brand-100 bg-brand-50/60 px-3.5 py-3">
          <Avatar name={selectedUser.name} seed={selectedUser.id} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-semibold text-brand-900">
              {selectedUser.name}
            </p>
            <p className="truncate text-[11px] text-brand-700/80">{selectedUser.email}</p>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-brand-600">
            Listo para agregar
          </span>
        </div>
      ) : null}

      <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-500">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
        <span>
          La persona se incorporará como <strong className="text-slate-700">MEMBER</strong> y
          podrá ver el tablero, crear tareas y tomar las que estén sin asignar.
        </span>
      </p>
    </Modal>
  )
}
