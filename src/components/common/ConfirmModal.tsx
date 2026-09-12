/**
 * ConfirmModal — Reusable styled confirmation modal.
 *
 * Phase 8: Replaces browser window.confirm() with a branded modal.
 * Accessible: role="dialog", aria-modal, focus management, Escape to close.
 */
import { useEffect, useRef } from 'react'

interface ConfirmModalProps {
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  // Focus cancel button on mount, close on Escape
  useEffect(() => {
    cancelRef.current?.focus()
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  const isDanger = variant === 'danger'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/30"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="w-full max-w-sm rounded-card border border-line bg-paper shadow-lift p-6 space-y-4">
        <h2
          id="confirm-modal-title"
          className="font-display text-xl tracking-[-0.03em] text-ink"
        >
          {title}
        </h2>
        <p id="confirm-modal-desc" className="text-sm text-muted leading-relaxed">
          {description}
        </p>

        <div className="flex items-center gap-3 pt-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-[var(--radius-control)] border border-line px-4 py-2 text-xs font-bold text-muted transition hover:border-ink/40 hover:text-ink disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={[
              'flex-1 rounded-[var(--radius-control)] px-4 py-2 text-xs font-bold transition disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine',
              isDanger
                ? 'border border-[#b83232]/30 text-[#b83232] hover:border-[#b83232] hover:bg-[#fdf1f1]'
                : 'bg-pine text-white hover:bg-pine-deep',
            ].join(' ')}
          >
            {loading ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
