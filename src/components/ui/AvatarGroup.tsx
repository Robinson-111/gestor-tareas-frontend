import type { Member } from '@/types'
import { Avatar } from './Avatar'

interface AvatarGroupProps {
  members: Pick<Member, 'user_id' | 'name'>[]
  max?: number
  size?: 'xs' | 'sm' | 'md'
}

export function AvatarGroup({ members, max = 4, size = 'sm' }: AvatarGroupProps) {
  const visible = members.slice(0, max)
  const rest = members.length - visible.length

  return (
    <div className="flex items-center">
      <div className="flex -space-x-1.5">
        {visible.map((member) => (
          <Avatar
            key={member.user_id}
            name={member.name}
            seed={member.user_id}
            size={size}
            ring
          />
        ))}
      </div>
      {rest > 0 ? (
        <span className="ml-1.5 text-xs font-medium text-slate-500">+{rest}</span>
      ) : null}
    </div>
  )
}
