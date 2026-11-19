import { ArrowRight, Crown, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Member, Module, Task } from '@/types'
import {
  MODULE_STATE_DOT,
  MODULE_STATE_LABEL,
  cn,
  formatMonthYear,
  moduleCode,
  percentage,
} from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { AvatarGroup } from '@/components/ui/AvatarGroup'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'

interface ModuleCardProps {
  module: Module
  members: Member[]
  tasks: Task[]
  currentUserId: number
  onClaim?: (moduleId: number) => void
  claimLoading?: boolean
}

export function ModuleCard({
  module,
  members,
  tasks,
  currentUserId,
  onClaim,
  claimLoading = false,
}: ModuleCardProps) {
  const navigate = useNavigate()
  const owner = members.find((member) => member.rol === 'OWNER')
  const me = members.find((member) => member.user_id === currentUserId)
  const creator = members.find((member) => member.user_id === module.creator)
  const pending = tasks.filter((task) => task.state === 'PENDIENTE').length
  const inProgress = tasks.filter((task) => task.state === 'EN_CURSO').length
  const completed = tasks.filter((task) => task.state === 'COMPLETADA').length
  const progress = percentage(completed, tasks.length)

  const open = () => navigate(`/modules/${module.id}`)

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={open}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          open()
        }
      }}
      className="group card surface-hover relative flex min-h-[252px] cursor-pointer flex-col p-5 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          className={cn(
            'border-0 ring-0',
            me?.rol === 'OWNER'
              ? 'bg-brand-50 text-brand-700'
              : 'bg-blue-50 text-blue-700',
          )}
        >
          {me?.rol === 'OWNER' ? <Crown className="h-3 w-3" /> : null}
          {me?.rol ?? 'MEMBER'}
        </Badge>
        <Badge className="border-0 bg-slate-50 text-slate-500 ring-0">
          <span className={cn('h-1.5 w-1.5 rounded-full', MODULE_STATE_DOT[module.state])} />
          {MODULE_STATE_LABEL[module.state]}
        </Badge>
        <span className="ml-auto rounded-md bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.04em] text-slate-400">
          {moduleCode(module.id)}
        </span>
      </div>

      <h3 className="mt-3.5 text-[17px] font-bold leading-snug tracking-[-0.02em] text-slate-900 transition group-hover:text-brand-700">
        {module.name}
      </h3>
      <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-slate-500">
        {module.description || 'Sin descripción.'}
      </p>

      <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-500">
        <Avatar
          name={creator?.name ?? module.creator_name ?? owner?.name ?? 'Equipo'}
          seed={module.creator ?? module.id}
          size="xs"
        />
        <span className="truncate">
          Creado por{' '}
          <span className="font-semibold text-slate-700">
            {creator?.name ?? module.creator_name ?? 'el equipo'}
          </span>
          {module.created_at ? <> · {formatMonthYear(module.created_at)}</> : null}
        </span>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between gap-3 text-[10px] font-semibold">
          <span className="uppercase tracking-[0.1em] text-slate-400">Progreso de entregables</span>
          <span className="text-slate-600">
            {completed}/{tasks.length} tareas ({progress}%)
          </span>
        </div>
        <ProgressBar
          value={progress}
          label={`Avance de ${module.name}`}
          tone={progress === 100 && tasks.length > 0 ? 'success' : 'brand'}
        />
      </div>

      <div className="mt-auto flex items-end justify-between gap-3 border-t border-line/70 pt-4">
        <div className="min-w-0">
          {members.length > 0 ? (
            <div className="flex items-center gap-2">
              <AvatarGroup members={members} max={3} size="xs" />
              <span className="text-[10px] text-slate-400">
                {members.length} {members.length === 1 ? 'integrante' : 'integrantes'}
              </span>
            </div>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
              <Users className="h-3.5 w-3.5" />
              Sin integrantes
            </span>
          )}

          {tasks.length > 0 ? (
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] font-medium text-slate-500">
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                {pending} pend.
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                {inProgress} en curso
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {completed} compl.
              </span>
            </p>
          ) : null}
        </div>

        {!owner && onClaim ? (
          <Button
            size="xs"
            variant="outline"
            className="relative z-10 shrink-0 border-brand-200 text-brand-700 hover:bg-brand-50"
            loading={claimLoading}
            onClick={(event) => {
              event.stopPropagation()
              onClaim(module.id)
            }}
          >
            Reclamar
          </Button>
        ) : (
          <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-brand-600 transition group-hover:gap-1.5">
            Ver módulo
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
    </article>
  )
}
