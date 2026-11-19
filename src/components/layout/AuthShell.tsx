import type { ReactNode } from 'react'
import { Logo } from './Logo'

interface AuthShellProps {
  children: ReactNode
  footer?: ReactNode
}

export function AuthShell({ children, footer }: AuthShellProps) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-canvas px-4 py-10">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.55]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgb(var(--c-line)) 1px, transparent 1px), linear-gradient(to bottom, rgb(var(--c-line)) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 72%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 20%, transparent 72%)',
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-40 top-1/4 h-96 w-96 rounded-full bg-brand-200/30 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-emerald-200/25 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-[440px]">
        <div className="mb-6 flex justify-center">
          <Logo subtitle={null} />
        </div>
        <div className="rounded-2xl border border-line bg-white/95 p-6 shadow-soft backdrop-blur sm:p-8">
          {children}
        </div>
        {footer ? <div className="mt-5 text-center text-[11px] text-slate-400">{footer}</div> : null}
      </div>
    </div>
  )
}
