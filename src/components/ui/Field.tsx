import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type FieldError = string | string[] | undefined

function errorText(error: FieldError): string | undefined {
  if (!error) return undefined
  return Array.isArray(error) ? error.join(' ') : error
}

function FieldShell({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string
  label?: string
  error?: FieldError
  hint?: string
  children: ReactNode
}) {
  const message = errorText(error)

  return (
    <div>
      {label ? (
        <label htmlFor={id} className="label">
          {label}
        </label>
      ) : null}
      {children}
      {message ? (
        <p className="mt-1.5 text-xs font-medium text-red-600">{message}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  )
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: FieldError
  hint?: string
  leftIcon?: ReactNode
  rightSlot?: ReactNode
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightSlot,
  className,
  id,
  ...props
}: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <FieldShell id={inputId} label={label} error={error} hint={hint}>
      <div className="relative">
        {leftIcon ? (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
            {leftIcon}
          </span>
        ) : null}
        <input
          id={inputId}
          className={cn(
            'field',
            leftIcon && 'pl-10',
            rightSlot && 'pr-11',
            error && 'field-error',
            className,
          )}
          aria-invalid={Boolean(error)}
          {...props}
        />
        {rightSlot ? (
          <span className="absolute inset-y-0 right-2 flex items-center">{rightSlot}</span>
        ) : null}
      </div>
    </FieldShell>
  )
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: FieldError
  hint?: string
}

export function Textarea({ label, error, hint, className, id, ...props }: TextareaProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <FieldShell id={inputId} label={label} error={error} hint={hint}>
      <textarea
        id={inputId}
        className={cn(
          'field h-auto min-h-[96px] resize-y py-3',
          error && 'field-error',
          className,
        )}
        aria-invalid={Boolean(error)}
        {...props}
      />
    </FieldShell>
  )
}

export interface SelectOption {
  value: string | number
  label: string
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: FieldError
  hint?: string
  placeholder?: string
  options: SelectOption[]
}

export function Select({
  label,
  error,
  hint,
  placeholder,
  options,
  className,
  id,
  ...props
}: SelectProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <FieldShell id={inputId} label={label} error={error} hint={hint}>
      <select
        id={inputId}
        className={cn('field cursor-pointer appearance-none pr-9', error && 'field-error', className)}
        aria-invalid={Boolean(error)}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' viewBox='0 0 24 24' stroke='%2364748B' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.75rem center',
        }}
        {...props}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  )
}
