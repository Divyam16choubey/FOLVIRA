/**
 * FormField.tsx — Accessible labeled input with inline error display.
 *
 * - Always renders a <label> associated via htmlFor/id
 * - Error message uses role="alert" and aria-describedby for screen readers
 * - Matches FOLVIRA's design tokens
 */
import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  id: string
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, id, className = '', ...props }, ref) => {
    const errorId = `${id}-error`
    const hasError = Boolean(error)

    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={id}
          className="text-sm font-bold text-ink"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={id}
          aria-describedby={hasError ? errorId : undefined}
          aria-invalid={hasError}
          className={[
            'w-full rounded-[var(--radius-control)] border bg-canvas px-3.5 py-2.5',
            'text-sm text-ink placeholder:text-muted/50',
            'transition-colors duration-150',
            'focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-pine',
            hasError
              ? 'border-[#b83232] focus:outline-[#b83232]'
              : 'border-line hover:border-muted/60',
            className,
          ].join(' ')}
          {...props}
        />
        {hasError && (
          <p
            id={errorId}
            role="alert"
            className="text-xs font-medium text-[#b83232]"
          >
            {error}
          </p>
        )}
      </div>
    )
  }
)

FormField.displayName = 'FormField'
