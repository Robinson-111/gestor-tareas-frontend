import { avatarColor, cn, getInitials } from '@/lib/utils'

const SIZES = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-7 w-7 text-[11px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-11 w-11 text-sm',
  xl: 'h-14 w-14 text-base',
}

export type AvatarSize = keyof typeof SIZES

interface AvatarProps {
  name: string
  seed?: number | string
  size?: AvatarSize
  className?: string
  ring?: boolean
  status?: 'online' | 'offline'
}

export function Avatar({
  name,
  seed,
  size = 'md',
  className,
  ring = false,
  status,
}: AvatarProps) {
  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      <span
        title={name}
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-full font-semibold',
          SIZES[size],
          avatarColor(seed ?? name),
          ring && 'ring-2 ring-white',
        )}
      >
        {getInitials(name)}
      </span>
      {status ? (
        <span
          className={cn(
            'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white',
            status === 'online' ? 'bg-emerald-500' : 'bg-slate-300',
          )}
          aria-hidden="true"
        />
      ) : null}
    </span>
  )
}
