import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Crown,
  Download,
  Eye,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { FilterTabs } from '@/components/ui/FilterTabs'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { SearchInput } from '@/components/ui/SearchInput'
import { StatCard } from '@/components/ui/StatCard'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { api, getApiErrorMessage } from '@/lib/api'
import { queryKeys } from '@/lib/queries'
import { ROLE_LABEL, ROLE_STYLES, cn, downloadCsv, formatMonthYear } from '@/lib/utils'
import { useAllUsers } from '@/hooks/useMembers'
import { useAuthStore } from '@/stores/auth'
import { toast } from '@/stores/toast'
import type { GlobalRole, User } from '@/types'

type RoleFilter = 'ALL' | GlobalRole

const PAGE_SIZE = 10

function roleOf(user: User): GlobalRole {
  return user.rol ?? 'USER'
}

function RoleBadge({ role }: { role: GlobalRole }) {
  const Icon = role === 'SUPER_ADMIN' ? Crown : role === 'ADMIN' ? ShieldCheck : UserRound
  return (
    <Badge className={cn('border-0 ring-0', ROLE_STYLES[role])}>
      <Icon className="h-3 w-3" />
      {ROLE_LABEL[role]}
    </Badge>
  )
}

export function AdminPage() {
  const user = useAuthStore((state) => state.user)
  const usersQuery = useAllUsers()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL')
  const [page, setPage] = useState(1)
  const [deleting, setDeleting] = useState<User | null>(null)
  const [viewing, setViewing] = useState<User | null>(null)

  const deleteUser = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/users/${id}/`)
    },
    onSuccess: () => {
      toast.success('Usuario eliminado', 'La cuenta se eliminó correctamente.')
      setDeleting(null)
      void queryClient.invalidateQueries({ queryKey: queryKeys.users })
      void queryClient.invalidateQueries({ queryKey: queryKeys.moduleList() })
    },
    onError: (error) => {
      toast.error('No se pudo eliminar', getApiErrorMessage(error))
    },
  })

  const users = usersQuery.data ?? []

  const counts = useMemo(
    () => ({
      ALL: users.length,
      USER: users.filter((item) => roleOf(item) === 'USER').length,
      ADMIN: users.filter((item) => roleOf(item) === 'ADMIN').length,
      SUPER_ADMIN: users.filter((item) => roleOf(item) === 'SUPER_ADMIN').length,
    }),
    [users],
  )

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return users.filter((item) => {
      const matchesRole = roleFilter === 'ALL' || roleOf(item) === roleFilter
      const matchesSearch =
        !term ||
        item.name.toLowerCase().includes(term) ||
        item.email.toLowerCase().includes(term) ||
        (item.rol ?? '').toLowerCase().includes(term)
      return matchesRole && matchesSearch
    })
  }, [users, search, roleFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const from = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const to = Math.min(safePage * PAGE_SIZE, filtered.length)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [search, roleFilter])

  const exportCsv = () => {
    downloadCsv('equipo-taskflow.csv', [
      ['Nombre', 'Correo', 'Rol global', 'Módulos', 'Tareas', 'Fecha de alta'],
      ...filtered.map((item) => [
        item.name,
        item.email,
        ROLE_LABEL[roleOf(item)],
        item.modules_count ?? 0,
        item.tasks_count ?? 0,
        item.created_at ?? '',
      ]),
    ])
    toast.success('Exportación lista', 'Se descargó el CSV del directorio global.')
  }

  const basePercent = counts.ALL > 0 ? Math.round((counts.USER / counts.ALL) * 1000) / 10 : 0

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <nav className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            <span>Organización</span>
            <span className="text-slate-300">/</span>
            <span className="text-brand-600">Directorio global</span>
          </nav>
          <h1 className="page-title mt-2">Equipo & Usuarios</h1>
          <p className="mt-1 max-w-xl text-[13px] text-slate-500">
            Gestiona la gobernanza de accesos, roles administrativos y asignación de módulos
            operativos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
            <Download className="h-4 w-4" />
            Exportar Registro
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total registros"
          value={counts.ALL}
          icon={Users}
          tone="brand"
          hint={<span className="font-medium text-emerald-600">+{counts.ALL} cuentas activas</span>}
        />
        <StatCard
          label="Miembros base"
          value={counts.USER}
          icon={UserRound}
          tone="blue"
          hint={<span>{basePercent}% · Rol regular con tareas asignadas</span>}
        />
        <StatCard
          label="Administradores"
          value={counts.ADMIN}
          icon={ShieldCheck}
          tone="mint"
          hint={<span>Permisos de moderación y gestión</span>}
        />
        <StatCard
          label="Super administrador"
          value={counts.SUPER_ADMIN}
          icon={Crown}
          tone="rose"
          hint={<span>Raíz inmutable del sistema</span>}
        />
      </div>

      <div className="card space-y-3 p-3 sm:p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Buscar por nombre, correo electrónico o rol…"
              className="sm:max-w-[360px]"
            />
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Filtrar
            </span>
          </div>
          <FilterTabs
            value={roleFilter}
            onChange={setRoleFilter}
            tabs={[
              { key: 'ALL', label: 'Todos', count: counts.ALL },
              { key: 'USER', label: 'Usuarios', count: counts.USER },
              { key: 'ADMIN', label: 'Administradores', count: counts.ADMIN },
              { key: 'SUPER_ADMIN', label: 'Super Admins', count: counts.SUPER_ADMIN },
            ]}
          />
        </div>
      </div>

      <div className="rounded-xl border border-brand-100 bg-brand-50/70 px-4 py-3 text-[11px] leading-relaxed text-brand-800">
        Como administrador puedes eliminar cuentas. No es posible eliminar la propia cuenta ni al
        último SUPER_ADMIN del sistema.
      </div>

      {usersQuery.isLoading ? (
        <TableSkeleton rows={8} />
      ) : usersQuery.isError ? (
        <EmptyState
          icon={Users}
          title="No pudimos cargar los usuarios"
          description={getApiErrorMessage(usersQuery.error)}
          action={
            <Button variant="outline" onClick={() => void usersQuery.refetch()}>
              Reintentar
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Sin resultados"
          description="No hay usuarios que coincidan con la búsqueda o el rol seleccionado."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setSearch('')
                setRoleFilter('ALL')
              }}
            >
              Limpiar filtros
            </Button>
          }
        />
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="hidden grid-cols-[minmax(0,1.6fr)_150px_180px_120px_90px] items-center gap-4 border-b border-line bg-slate-50/60 px-5 py-3 lg:grid">
              <span className="table-head">Usuario</span>
              <span className="table-head">Rol global</span>
              <span className="table-head">Participación</span>
              <span className="table-head">Fecha alta</span>
              <span className="table-head text-right">Acciones</span>
            </div>

            <ul className="divide-y divide-line">
              {paginated.map((item) => {
                const isMe = item.id === user?.id
                const role = roleOf(item)
                return (
                  <li
                    key={item.id}
                    className="flex flex-col gap-3 px-4 py-3.5 transition hover:bg-slate-50/60 sm:grid sm:grid-cols-[minmax(0,1.6fr)_150px_180px_120px_90px] sm:items-center sm:gap-4 sm:px-5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar
                        name={item.name}
                        seed={item.id}
                        size="md"
                        status={isMe ? 'online' : undefined}
                      />
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 truncate text-[13px] font-semibold text-slate-900">
                          {item.name}
                          {isMe ? (
                            <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-brand-600">
                              Tú
                            </span>
                          ) : null}
                        </p>
                        <p className="truncate text-[11px] text-slate-500">{item.email}</p>
                      </div>
                    </div>

                    <div>
                      <RoleBadge role={role} />
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <span className="rounded-md bg-slate-50 px-1.5 py-0.5 font-semibold text-slate-600">
                        {item.modules_count ?? 0} módulos
                      </span>
                      <span className="text-slate-300">·</span>
                      <span>{item.tasks_count ?? 0} tareas</span>
                    </div>

                    <span className="text-[11px] text-slate-500">
                      {formatMonthYear(item.created_at)}
                    </span>

                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setViewing(item)}
                        className="action-icon"
                        title="Ver detalle"
                        aria-label={`Ver detalle de ${item.name}`}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(item)}
                        disabled={isMe}
                        title={isMe ? 'No puedes eliminar tu propia cuenta' : 'Eliminar usuario'}
                        aria-label={`Eliminar a ${item.name}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                )
              })}
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
              itemLabel="usuarios"
            />
          </div>
        </>
      )}

      <Modal
        open={viewing !== null}
        onClose={() => setViewing(null)}
        title="Detalle del usuario"
        description="Información de la cuenta y su participación en el espacio de trabajo."
        icon={<UserRound className="h-5 w-5" />}
        size="sm"
      >
        {viewing ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar name={viewing.name} seed={viewing.id} size="xl" />
              <div className="min-w-0">
                <p className="truncate text-[15px] font-bold text-slate-900">{viewing.name}</p>
                <p className="truncate text-[12px] text-slate-500">{viewing.email}</p>
                <div className="mt-1.5">
                  <RoleBadge role={roleOf(viewing)} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-line bg-slate-50/60 p-3">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                  Módulos
                </p>
                <p className="mt-1 text-[20px] font-bold text-slate-900">
                  {viewing.modules_count ?? 0}
                </p>
              </div>
              <div className="rounded-xl border border-line bg-slate-50/60 p-3">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                  Tareas
                </p>
                <p className="mt-1 text-[20px] font-bold text-slate-900">
                  {viewing.tasks_count ?? 0}
                </p>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Fecha de alta: <strong className="text-slate-700">{formatMonthYear(viewing.created_at)}</strong>
            </p>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return
          deleteUser.mutate(deleting.id)
        }}
        title="Eliminar usuario"
        description={
          <>
            ¿Quieres eliminar la cuenta de <strong>{deleting?.name}</strong> ({deleting?.email})? Sus
            tareas quedarán sin responsable y los módulos que creó quedarán sin propietario. Esta
            acción no se puede deshacer.
          </>
        }
        confirmLabel="Eliminar cuenta"
        loading={deleteUser.isPending}
      />
    </div>
  )
}
