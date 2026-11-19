import { useEffect, useState, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'
import { Modal } from './Modal'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: ReactNode
  children?: ReactNode
  icon?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
  tone?: 'danger' | 'primary'
  requireText?: string
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  children,
  icon,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  loading = false,
  tone = 'danger',
  requireText,
}: ConfirmDialogProps) {
  const [confirmation, setConfirmation] = useState('')

  useEffect(() => {
    if (open) setConfirmation('')
  }, [open])

  const canConfirm = !requireText || confirmation.trim() === requireText

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      icon={
        icon ?? (
          <span
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset',
              tone === 'danger'
                ? 'bg-red-50 text-red-600 ring-red-100'
                : 'bg-brand-50 text-brand-600 ring-brand-100',
            )}
          >
            <AlertTriangle className="h-5 w-5" />
          </span>
        )
      }
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
            disabled={!canConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-sm leading-relaxed text-slate-600">{description}</div>
      {children ? <div className="mt-4">{children}</div> : null}
      {requireText ? (
        <div className="mt-5">
          <label className="label" htmlFor="confirm-text">
            Escribe <strong className="text-slate-900">{requireText}</strong> para confirmar
          </label>
          <input
            id="confirm-text"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder={requireText}
            className="field h-10"
            autoComplete="off"
          />
        </div>
      ) : null}
    </Modal>
  )
}
