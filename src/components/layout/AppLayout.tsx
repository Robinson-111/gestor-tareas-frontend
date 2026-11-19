import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Bell,
  CheckCheck,
  CheckCircle2,
  ChevronRight,
  ChevronsUpDown,
  Compass,
  Crown,
  Inbox,
  LayoutGrid,
  ListPlus,
  LogOut,
  Menu,
  Moon,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import { getApiErrorMessage } from '@/lib/api'
import { cn, formatRelative, moduleCode, taskCode } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { useLogout } from '@/hooks/useAuth'
import { useExploreModules, useWorkspaceOverview } from '@/hooks/useModules'
import {
  useDeleteAllNotifications,
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/hooks/useNotifications'
import { useNotificationsSocket } from '@/hooks/useNotificationsSocket'
import { toast } from '@/stores/toast'
import type { Notification, NotificationType } from '@/types'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ModuleFormModal } from '@/components/modules/ModuleFormModal'
import { Logo } from './Logo'

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutGrid
  count?: number | null
  badge?: string | null
  adminOnly?: boolean
}

function SidebarContent({
  onNavigate,
  collapsed = false,
  onToggleCollapse,
}: {
  onNavigate?: () => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}) {
  const user = useAuthStore((state) => state.user)
  const logout = useLogout()
  const navigate = useNavigate()
  const isAdmin = user?.rol === 'ADMIN' || user?.rol === 'SUPER_ADMIN'
  const { overviews, pendingTasks } = useWorkspaceOverview()
  const exploreQuery = useExploreModules()

  const claimableCount = (exploreQuery.data ?? []).filter((module) => !module.has_owner).length

  const navItems: NavItem[] = [
    { to: '/modules', label: 'Mis Módulos', icon: LayoutGrid, count: overviews.length },
    {
      to: '/explore',
      label: 'Explorar',
      icon: Compass,
      badge: claimableCount > 0 ? `${claimableCount} libre` : null,
    },
    { to: '/tasks', label: 'Todas las Tareas', icon: CheckCircle2, count: pendingTasks.length },
    {
      to: '/admin',
      label: 'Equipo & Usuarios',
      icon: Users,
      adminOnly: true,
      badge: 'ADMIN',
    },
  ]

  const handleLogout = () => {
    void logout.mutateAsync().finally(() => {
      toast.info('Sesión cerrada', 'Hasta pronto.')
      navigate('/login', { replace: true })
    })
  }

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div
        className={cn(
          'flex h-[74px] items-center border-b border-line/70 px-5',
          collapsed ? 'justify-center px-3' : 'justify-between',
        )}
      >
        <Logo compact={collapsed} />
        {!collapsed ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="action-icon hidden lg:inline-flex"
            aria-label="Contraer menú"
          >
            <ChevronsUpDown className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        {!collapsed ? <p className="eyebrow px-3 pb-3">Navegación</p> : null}

        <div className="space-y-1">
          {navItems
            .filter((item) => !item.adminOnly || isAdmin)
            .map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    cn(
                      'group flex h-10 items-center gap-3 rounded-lg px-3 text-[13px] font-semibold transition',
                      collapsed && 'justify-center px-0',
                      isActive
                        ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/20'
                        : 'text-slate-500 hover:bg-white hover:text-slate-900',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={cn(
                          'h-[18px] w-[18px] shrink-0',
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600',
                        )}
                      />
                      {!collapsed ? (
                        <>
                          <span className="min-w-0 flex-1 truncate">{item.label}</span>
                          {typeof item.count === 'number' && item.count > 0 ? (
                            <span
                              className={cn(
                                'rounded-md px-1.5 py-0.5 text-[10px] font-bold',
                                isActive
                                  ? 'bg-white/20 text-white'
                                  : 'bg-slate-200/80 text-slate-500',
                              )}
                            >
                              {item.count}
                            </span>
                          ) : null}
                          {item.badge ? (
                            <span
                              className={cn(
                                'rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide',
                                item.badge === 'ADMIN'
                                  ? isActive
                                    ? 'bg-white/20 text-white'
                                    : 'text-slate-400'
                                  : 'bg-mint-100 text-mint-700',
                              )}
                            >
                              {item.badge}
                            </span>
                          ) : null}
                        </>
                      ) : null}
                    </>
                  )}
                </NavLink>
              )
            })}
        </div>

        {collapsed ? (
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="action-icon"
              aria-label="Expandir menú"
            >
              <ChevronsUpDown className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </nav>

      <div className="border-t border-line/70 p-3">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <Avatar name={user?.name ?? 'Usuario'} seed={user?.id} size="md" />
            <button
              type="button"
              onClick={handleLogout}
              className="action-icon"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-line bg-white p-3 shadow-card">
            <div className="flex items-center gap-2.5">
              <Avatar name={user?.name ?? 'Usuario'} seed={user?.id} size="md" status="online" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-slate-900">{user?.name}</p>
                <p className="truncate text-[11px] text-slate-500">{user?.email}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                disabled={logout.isPending}
                className="action-icon"
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
            <span className="mt-2 inline-flex rounded-md bg-brand-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-brand-600">
              {user?.rol ?? 'USER'} / OWNER
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function CommandPalette({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const navigate = useNavigate()
  const { overviews, allTasks } = useWorkspaceOverview()
  const exploreQuery = useExploreModules()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setQuery('')
    const timeout = window.setTimeout(() => inputRef.current?.focus(), 40)
    return () => window.clearTimeout(timeout)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  const term = query.trim().toLowerCase()

  const moduleResults = useMemo(() => {
    const source = overviews.map((item) => item.module)
    if (!term) return source.slice(0, 5)
    return source
      .filter(
        (module) =>
          module.name.toLowerCase().includes(term) ||
          module.description.toLowerCase().includes(term) ||
          moduleCode(module.id).toLowerCase().includes(term),
      )
      .slice(0, 6)
  }, [overviews, term])

  const taskResults = useMemo(() => {
    if (!term) return allTasks.filter(({ task }) => task.state !== 'COMPLETADA').slice(0, 4)
    return allTasks
      .filter(
        ({ task }) =>
          task.title.toLowerCase().includes(term) ||
          task.description.toLowerCase().includes(term) ||
          taskCode(task.id).toLowerCase().includes(term),
      )
      .slice(0, 6)
  }, [allTasks, term])

  const exploreResults = useMemo(() => {
    if (!term) return []
    return (exploreQuery.data ?? [])
      .filter((module) => module.name.toLowerCase().includes(term))
      .slice(0, 4)
  }, [exploreQuery.data, term])

  if (!open) return null

  const go = (path: string) => {
    onClose()
    navigate(path)
  }

  const hasResults =
    moduleResults.length > 0 || taskResults.length > 0 || exploreResults.length > 0

  return (
    <div className="fixed inset-0 z-[55] flex items-start justify-center px-4 pt-[10vh]">
      <div
        className="absolute inset-0 bg-slate-950/30 backdrop-blur-[3px] animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Buscar en el espacio de trabajo"
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-white shadow-float animate-slide-up"
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                const firstModule = moduleResults[0]
                const firstTask = taskResults[0]
                if (firstModule) go(`/modules/${firstModule.id}`)
                else if (firstTask) go(`/modules/${firstTask.module.id}`)
              }
            }}
            placeholder="Buscar módulos, tareas o códigos…"
            className="h-12 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
          <button type="button" onClick={onClose} className="action-icon" aria-label="Cerrar">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {!hasResults ? (
            <div className="px-4 py-10 text-center">
              <p className="text-sm font-semibold text-slate-700">Sin resultados</p>
              <p className="mt-1 text-xs text-slate-500">
                Prueba con otro nombre, descripción o código.
              </p>
            </div>
          ) : null}

          {moduleResults.length > 0 ? (
            <div className="mb-1">
              <p className="eyebrow px-3 py-2">Mis módulos</p>
              {moduleResults.map((module) => (
                <button
                  key={module.id}
                  type="button"
                  onClick={() => go(`/modules/${module.id}`)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-50"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <LayoutGrid className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-slate-900">
                      {module.name}
                    </span>
                    <span className="block truncate text-[11px] text-slate-500">
                      {module.description || 'Sin descripción'}
                    </span>
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {moduleCode(module.id)}
                  </span>
                </button>
              ))}
            </div>
          ) : null}

          {taskResults.length > 0 ? (
            <div className="mb-1">
              <p className="eyebrow px-3 py-2">Tareas</p>
              {taskResults.map(({ task, module }) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => go(`/modules/${module.id}`)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-50"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-slate-900">
                      {task.title}
                    </span>
                    <span className="block truncate text-[11px] text-slate-500">{module.name}</span>
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {taskCode(task.id)}
                  </span>
                </button>
              ))}
            </div>
          ) : null}

          {exploreResults.length > 0 ? (
            <div>
              <p className="eyebrow px-3 py-2">Módulos por explorar</p>
              {exploreResults.map((module) => (
                <button
                  key={module.id}
                  type="button"
                  onClick={() => go('/explore')}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-50"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint-50 text-mint-600">
                    <Compass className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-slate-900">
                      {module.name}
                    </span>
                    <span className="block truncate text-[11px] text-slate-500">
                      {module.has_owner ? `OWNER: ${module.owner_name}` : 'Disponible para reclamar'}
                    </span>
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {moduleCode(module.id)}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between border-t border-line bg-slate-50/60 px-4 py-2 text-[10px] text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" />
            Búsqueda global
          </span>
          <span>
            <kbd className="rounded border border-line bg-white px-1.5 py-0.5">Enter</kbd> abrir ·{' '}
            <kbd className="rounded border border-line bg-white px-1.5 py-0.5">Esc</kbd> cerrar
          </span>
        </div>
      </div>
    </div>
  )
}

const NOTIFICATION_META: Record<
  NotificationType,
  { icon: typeof Bell; className: string }
> = {
  TASK_ASSIGNED: { icon: UserPlus, className: 'bg-brand-50 text-brand-600' },
  TASK_UNASSIGNED: { icon: UserMinus, className: 'bg-slate-100 text-slate-600' },
  TASK_COMPLETED: { icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-600' },
  TASK_CREATED: { icon: ListPlus, className: 'bg-blue-50 text-blue-600' },
  TASK_DELETED: { icon: Trash2, className: 'bg-rose-50 text-rose-600' },
  MEMBER_ADDED: { icon: Users, className: 'bg-violet-50 text-violet-600' },
  MEMBER_REMOVED: { icon: UserMinus, className: 'bg-rose-50 text-rose-600' },
  OWNER_TRANSFERRED: { icon: Crown, className: 'bg-amber-50 text-amber-600' },
}

function NotificationsMenu() {
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState<Notification | null>(null)
  const [deleteAllOpen, setDeleteAllOpen] = useState(false)
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const { data, isLoading } = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()
  const deleteNotification = useDeleteNotification()
  const deleteAllNotifications = useDeleteAllNotifications()

  const notifications = data?.results ?? []
  const unread = data?.unread_count ?? 0

  useEffect(() => {
    if (!open) return
    const onClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const handleSelect = (notification: Notification) => {
    if (!notification.is_read) markRead.mutate(notification.id)
    setOpen(false)

    const moduleId = notification.payload.module_id
    navigate(moduleId ? `/modules/${moduleId}` : '/tasks')
  }

  const handleDelete = (notification: Notification) => {
    deleteNotification.mutate(notification.id, {
      onSuccess: () => {
        toast.success('Notificación eliminada', notification.title)
        setDeleting(null)
      },
      onError: (error) => toast.error('No se pudo eliminar', getApiErrorMessage(error)),
    })
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        aria-label={
          unread > 0 ? `Notificaciones (${unread} sin leer)` : 'Notificaciones'
        }
        aria-expanded={open}
      >
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 text-[10px] font-semibold leading-none text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-11 z-40 w-80 overflow-hidden rounded-2xl border border-line bg-white shadow-float animate-pop-in">
          <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
            <div>
              <p className="text-[13px] font-semibold text-slate-900">Notificaciones</p>
              <p className="text-[11px] text-slate-500">
                {unread > 0 ? `${unread} sin leer` : 'Estás al día'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 ? (
                <button
                  type="button"
                  onClick={() => markAllRead.mutate()}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-brand-600 transition hover:bg-brand-50"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Marcar todas
                </button>
              ) : null}
              {!isLoading && notifications.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setDeleteAllOpen(true)}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-rose-600 transition hover:bg-rose-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Eliminar todas
                </button>
              ) : null}
            </div>
          </div>

          <div className="max-h-[360px] overflow-y-auto p-2">
            {isLoading ? (
              <div className="space-y-2 p-1">
                {[0, 1, 2].map((index) => (
                  <div
                    key={index}
                    className="h-14 animate-pulse rounded-xl bg-slate-100"
                  />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <span className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <Inbox className="h-5 w-5" />
                </span>
                <p className="text-[12px] font-semibold text-slate-700">Todo al día</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Aquí verás lo que ocurra en tus módulos.
                </p>
              </div>
            ) : (
              <ul className="space-y-1">
                {notifications.map((notification) => {
                  const meta = NOTIFICATION_META[notification.type]
                  const Icon = meta.icon

                  return (
                    <li key={notification.id} className="relative flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => handleSelect(notification)}
                        className={cn(
                          'flex flex-1 items-start gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-50',
                          !notification.is_read && 'bg-brand-50/40 dark:bg-brand-500/15',
                        )}
                      >
                        <span
                          className={cn(
                            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                            meta.className,
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-2">
                            <span className="block truncate text-[12px] font-semibold text-slate-800">
                              {notification.title}
                            </span>
                            {!notification.is_read ? (
                              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                            ) : null}
                          </span>
                          {notification.message ? (
                            <span className="mt-0.5 block text-[11px] leading-snug text-slate-500">
                              {notification.message}
                            </span>
                          ) : null}
                          <span className="mt-1 block text-[10px] text-slate-400">
                            {formatRelative(notification.created_at)}
                          </span>
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          setDeleting(notification)
                        }}
                        className="mt-0.5 rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                        aria-label={`Eliminar notificación: ${notification.title}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return
          deleteNotification.mutate(deleting.id, {
            onSuccess: () => {
              toast.success('Notificación eliminada', deleting.title)
              setDeleting(null)
            },
            onError: (error) => toast.error('No se pudo eliminar', getApiErrorMessage(error)),
          })
        }}
        title="Eliminar notificación"
        description="Esta notificación se eliminará de forma permanente."
        confirmLabel="Eliminar"
        loading={deleteNotification.isPending}
      />

      <ConfirmDialog
        open={deleteAllOpen}
        onClose={() => setDeleteAllOpen(false)}
        onConfirm={() =>
          deleteAllNotifications.mutate(undefined, {
            onSuccess: () => {
              toast.success('Notificaciones eliminadas', 'Se borraron todas tus notificaciones.')
              setDeleteAllOpen(false)
            },
            onError: (error) => toast.error('No se pudo eliminar', getApiErrorMessage(error)),
          })
        }
        title="Eliminar notificaciones"
        description="Se eliminarán todas tus notificaciones. Esta acción no se puede deshacer."
        confirmLabel="Eliminar todas"
        tone="danger"
        loading={deleteAllNotifications.isPending}
      />
    </div>
  )
}

function UserMenu() {
  const user = useAuthStore((state) => state.user)
  const logout = useLogout()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<'main' | 'settings'>('main')
  const mode = useThemeStore((state) => state.mode)
  const setMode = useThemeStore((state) => state.setMode)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const handleLogout = () => {
    void logout.mutateAsync().finally(() => {
      toast.info('Sesión cerrada', 'Hasta pronto.')
      navigate('/login', { replace: true })
    })
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value)
          setView('main')
        }}
        className="flex items-center gap-2 rounded-xl p-0.5 transition hover:bg-slate-100"
        aria-label="Menú de usuario"
        aria-expanded={open}
      >
        <Avatar name={user?.name ?? 'Usuario'} seed={user?.id} size="md" status="online" />
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-40 w-64 overflow-hidden rounded-2xl border border-line bg-white shadow-float animate-pop-in">
          {view === 'main' ? (
            <div className="animate-fade-in">
              <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
                <Avatar name={user?.name ?? 'Usuario'} seed={user?.id} size="lg" />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-slate-900">{user?.name}</p>
                  <p className="truncate text-[11px] text-slate-500">{user?.email}</p>
                </div>
              </div>
              <div className="px-4 py-2.5">
                <span className="inline-flex rounded-md bg-brand-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-brand-600">
                  Rol global: {user?.rol}
                </span>
              </div>
              <div className="border-t border-line p-1.5">
                <button
                  type="button"
                  onClick={() => setView('settings')}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-800"
                >
                  <span aria-hidden="true">⚙️</span>
                  Configuraciones
                  <ChevronRight className="ml-auto h-4 w-4 text-slate-400" />
                </button>
              </div>
              <div className="border-t border-line p-1.5">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-700"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </button>
              </div>
            </div>
          ) : (
            <div className="animate-fade-in">
              <div className="flex items-center gap-1.5 border-b border-line px-2 py-2">
                <button
                  type="button"
                  onClick={() => setView('main')}
                  className="action-icon"
                  aria-label="Volver al menú"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <p className="text-[13px] font-semibold text-slate-900">Configuraciones</p>
              </div>
              <div className="p-1.5">
                <p className="px-3 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  Apariencia
                </p>
                <div className="flex items-center justify-between gap-2 rounded-xl px-3 py-2">
                  <span className="text-[13px] font-medium text-slate-600">Tema</span>
                  <div className="flex items-center gap-0.5 rounded-lg border border-line bg-slate-50 p-0.5">
                    <button
                      type="button"
                      onClick={() => setMode('light')}
                      aria-pressed={mode === 'light'}
                      title="Tema claro"
                      className={cn(
                        'flex h-7 w-8 items-center justify-center rounded-md transition',
                        mode === 'light'
                          ? 'theme-chip-active'
                          : 'text-slate-400 hover:text-slate-600',
                      )}
                    >
                      <Sun className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('dark')}
                      aria-pressed={mode === 'dark'}
                      title="Tema oscuro"
                      className={cn(
                        'flex h-7 w-8 items-center justify-center rounded-md transition',
                        mode === 'dark'
                          ? 'theme-chip-active'
                          : 'text-slate-400 hover:text-slate-600',
                      )}
                    >
                      <Moon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const location = useLocation()

  // Canal en tiempo real: campana, badge y toasts sin recargar.
  useNotificationsSocket()

  useEffect(() => {
    setMobileOpen(false)
    setSearchOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="min-h-dvh bg-canvas">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden border-r border-line/70 transition-[width] duration-200 lg:block',
          collapsed ? 'w-[76px]' : 'w-[232px]',
        )}
      >
        <SidebarContent
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((value) => !value)}
        />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-950/35 backdrop-blur-[2px] animate-fade-in"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative h-full w-[280px] max-w-[86vw] border-r border-line shadow-float animate-slide-in">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 z-10 rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              aria-label="Cerrar menú"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className={cn('transition-[padding] duration-200', collapsed ? 'lg:pl-[76px]' : 'lg:pl-[232px]')}>
        <header className="sticky top-0 z-20 flex h-[64px] items-center gap-3 border-b border-line/70 bg-canvas/85 px-4 backdrop-blur-xl sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="action-icon lg:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="lg:hidden">
            <Logo compact />
          </div>

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="group flex h-10 w-full min-w-0 max-w-[440px] items-center gap-2.5 rounded-xl border border-line bg-white px-3.5 text-left shadow-sm transition hover:border-slate-300"
          >
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="min-w-0 flex-1 truncate text-[13px] text-slate-400">
              Buscar módulos o tareas…
            </span>
            <span className="hidden items-center gap-1 sm:flex">
              <kbd className="rounded-md border border-line bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
                ⌘
              </kbd>
              <kbd className="rounded-md border border-line bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
                K
              </kbd>
            </span>
          </button>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2.5">
            <span className="hidden items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium text-slate-400 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              En línea
            </span>

            <NotificationsMenu />

            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white shadow-sm shadow-brand-600/20 sm:hidden"
              aria-label="Nuevo módulo"
            >
              <Plus className="h-4 w-4" />
            </button>

            <UserMenu />
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1420px] px-4 pb-16 pt-5 sm:px-6 lg:px-8 lg:pt-6">
          <Outlet />
        </main>
      </div>

      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      <ModuleFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
