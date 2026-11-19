import clsx, { type ClassValue } from 'clsx'
import type { GlobalRole, ModuleRole, ModuleState, TaskPriority, TaskState } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

const AVATAR_COLORS = [
  'bg-violet-100 text-violet-700',
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
  'bg-orange-100 text-orange-700',
  'bg-teal-100 text-teal-700',
]

export function avatarColor(seed: number | string): string {
  const value = String(seed)
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export const MODULE_STATE_LABEL: Record<ModuleState, string> = {
  PENDIENTE: 'Pendiente',
  EN_CURSO: 'En curso',
  COMPLETADO: 'Completado',
}

export const MODULE_STATE_STYLES: Record<ModuleState, string> = {
  PENDIENTE: 'bg-amber-50 text-amber-700 ring-amber-600/10',
  EN_CURSO: 'bg-blue-50 text-blue-700 ring-blue-600/10',
  COMPLETADO: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
}

export const MODULE_STATE_DOT: Record<ModuleState, string> = {
  PENDIENTE: 'bg-amber-400',
  EN_CURSO: 'bg-blue-500',
  COMPLETADO: 'bg-emerald-500',
}

export const TASK_STATE_LABEL: Record<TaskState, string> = {
  PENDIENTE: 'Pendiente',
  EN_CURSO: 'En curso',
  COMPLETADA: 'Completada',
}

export const TASK_STATE_STYLES: Record<TaskState, string> = {
  PENDIENTE: 'bg-slate-100 text-slate-600 ring-slate-500/10',
  EN_CURSO: 'bg-blue-50 text-blue-700 ring-blue-600/10',
  COMPLETADA: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
}

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  BAJA: 'Baja',
  MEDIA: 'Media',
  ALTA: 'Alta',
}

export const PRIORITY_STYLES: Record<TaskPriority, string> = {
  BAJA: 'bg-slate-100 text-slate-600 ring-slate-500/10',
  MEDIA: 'bg-amber-50 text-amber-700 ring-amber-600/10',
  ALTA: 'bg-rose-50 text-rose-700 ring-rose-600/10',
}

export const PRIORITY_DOT: Record<TaskPriority, string> = {
  BAJA: 'bg-slate-400',
  MEDIA: 'bg-amber-400',
  ALTA: 'bg-rose-500',
}

export const ROLE_LABEL: Record<GlobalRole, string> = {
  USER: 'Usuario',
  ADMIN: 'Administrador',
  SUPER_ADMIN: 'Super Admin',
}

export const ROLE_STYLES: Record<GlobalRole, string> = {
  USER: 'bg-slate-100 text-slate-600 ring-slate-500/10',
  ADMIN: 'bg-brand-50 text-brand-700 ring-brand-600/10',
  SUPER_ADMIN: 'bg-rose-50 text-rose-700 ring-rose-600/10',
}

export const MODULE_ROLE_LABEL: Record<ModuleRole, string> = {
  OWNER: 'OWNER',
  MEMBER: 'MEMBER',
}

export function moduleCode(id: number): string {
  return `TF-${String(id).padStart(3, '0')}`
}

export function taskCode(id: number): string {
  return `TASK-${String(id).padStart(3, '0')}`
}

export function formatRelative(date: string): string {
  const timestamp = new Date(date).getTime()
  if (Number.isNaN(timestamp)) return '—'

  const diffSeconds = Math.round((timestamp - Date.now()) / 1000)
  const abs = Math.abs(diffSeconds)

  if (abs < 60) return 'hace un momento'

  const formatter = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })

  if (abs < 3600) return formatter.format(Math.round(diffSeconds / 60), 'minute')
  if (abs < 86400) return formatter.format(Math.round(diffSeconds / 3600), 'hour')
  if (abs < 2592000) return formatter.format(Math.round(diffSeconds / 86400), 'day')
  if (abs < 31536000) return formatter.format(Math.round(diffSeconds / 2592000), 'month')
  return formatter.format(Math.round(diffSeconds / 31536000), 'year')
}

export function formatShortDate(date?: string): string {
  if (!date) return '—'
  const value = new Date(date)
  if (Number.isNaN(value.getTime())) return '—'
  return new Intl.DateTimeFormat('es', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(value)
}

export function formatMonthYear(date?: string): string {
  if (!date) return '—'
  const value = new Date(date)
  if (Number.isNaN(value.getTime())) return '—'
  return new Intl.DateTimeFormat('es', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(value)
}

export function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}

export function taskCountLabel(count: number): string {
  return pluralize(count, 'tarea', 'tareas')
}

export function moduleCountLabel(count: number): string {
  return pluralize(count, 'módulo', 'módulos')
}

export function percentage(value: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((value / total) * 100)
}

export function downloadCsv(filename: string, rows: (string | number | null | undefined)[][]) {
  const escape = (value: string | number | null | undefined) => {
    const text = value == null ? '' : String(value)
    return `"${text.replace(/"/g, '""')}"`
  }
  const csv = rows.map((row) => row.map(escape).join(',')).join('\r\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
