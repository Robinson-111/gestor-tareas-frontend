import { Crown, LogOut, Shield, UserMinus, UserPlus } from 'lucide-react'
import type { Member } from '@/types'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface MembersPanelProps {
  members: Member[]
  currentUserId: number
  isOwner: boolean
  onAdd: () => void
  onRemove: (member: Member) => void
  onTransfer: (member: Member) => void
  onLeave: () => void
  isLeaving?: boolean
}

export function MembersPanel({
  members,
  currentUserId,
  isOwner,
  onAdd,
  onRemove,
  onTransfer,
  onLeave,
  isLeaving = false,
}: MembersPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[15px] font-bold tracking-tight text-slate-900">Integrantes del equipo</h2>
          <p className="mt-0.5 text-[12px] text-slate-500">
            {members.length} {members.length === 1 ? 'persona con acceso' : 'personas con acceso'} al
            módulo.
          </p>
        </div>
        {isOwner ? (
          <Button size="sm" variant="outline" onClick={onAdd}>
            <UserPlus className="h-4 w-4" />
            Agregar integrante
          </Button>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {members.map((member) => {
          const isMe = member.user_id === currentUserId
          const memberIsOwner = member.rol === 'OWNER'
          const canManage = isOwner && !isMe

          return (
            <article
              key={member.id}
              className={cn(
                'rounded-2xl border bg-white p-4 shadow-card transition',
                memberIsOwner ? 'border-brand-100 ring-1 ring-inset ring-brand-50' : 'border-line',
              )}
            >
              <div className="flex items-start gap-3">
                <Avatar
                  name={member.name}
                  seed={member.user_id}
                  size="lg"
                  status={memberIsOwner ? 'online' : undefined}
                />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-[13px] font-semibold text-slate-900">
                    {member.name}
                    {isMe ? (
                      <span className="rounded bg-slate-100 px-1 py-0.5 text-[8px] font-bold uppercase tracking-wide text-slate-500">
                        Tú
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                    {memberIsOwner ? (
                      <>
                        <Crown className="h-3 w-3 text-amber-500" />
                        Propietario del módulo
                      </>
                    ) : (
                      <>
                        <Shield className="h-3 w-3 text-slate-400" />
                        Integrante colaborador
                      </>
                    )}
                  </p>
                </div>
                <Badge
                  className={cn(
                    'border-0 ring-0',
                    memberIsOwner
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-slate-100 text-slate-600',
                  )}
                >
                  {member.rol}
                </Badge>
              </div>

              {canManage ? (
                <div className="mt-3 flex items-center gap-2 border-t border-line/70 pt-3">
                  <button
                    type="button"
                    onClick={() => onTransfer(member)}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold text-slate-500 transition hover:bg-amber-50 hover:text-amber-700"
                  >
                    <Crown className="h-3.5 w-3.5" />
                    Transferir propiedad
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(member)}
                    className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <UserMinus className="h-3.5 w-3.5" />
                    Quitar
                  </button>
                </div>
              ) : null}
            </article>
          )
        })}
      </div>

      <div className="rounded-2xl border border-line bg-slate-50/60 px-4 py-3.5">
        {isOwner ? (
          <p className="text-[11px] leading-relaxed text-slate-500">
            Para salir del módulo, transfiere primero la propiedad a otro integrante. Solo el OWNER
            puede gestionar integrantes y configuración.
          </p>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-slate-500">
              Puedes abandonar el módulo cuando quieras. Tus tareas quedarán sin responsable.
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onLeave}
              loading={isLeaving}
              className="justify-center text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="h-4 w-4" />
              Abandonar módulo
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
