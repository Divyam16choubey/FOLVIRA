/**
 * PricingModal.tsx — Reusable branded pricing modal for FOLVIRA.
 *
 * Used by both Navbar and Footer.
 * Content:
 *   Title: "FOLVIRA is currently free to use."
 *   Body: "We’re focused on helping you build a thoughtful, professional portfolio
 *          without putting a price on getting started. More plans and features may
 *          come later as FOLVIRA grows."
 *   Action: "Got it"
 *
 * Accessibility:
 *   - role="dialog"
 *   - aria-modal="true"
 *   - aria-labelledby="pricing-modal-title"
 *   - aria-describedby="pricing-modal-desc"
 *   - Escape key dismiss
 *   - Focus management on mount and focus restoration on unmount
 *   - Backdrop click dismiss
 *   - Body scroll locking while open
 */
import { useEffect, useRef } from 'react'
import { CloseIcon } from './Icons'

interface PricingModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PricingModal({ isOpen, onClose }: PricingModalProps) {
  const gotItButtonRef = useRef<HTMLButtonElement>(null)
  const modalCardRef = useRef<HTMLDivElement>(null)
  const previousActiveElementRef = useRef<HTMLElement | null>(null)

  // Save previous active element to restore focus on close
  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement as HTMLElement | null
      // Focus "Got it" button on mount
      const id = requestAnimationFrame(() => {
        gotItButtonRef.current?.focus()
      })
      return () => cancelAnimationFrame(id)
    } else if (previousActiveElementRef.current) {
      previousActiveElementRef.current.focus?.()
      previousActiveElementRef.current = null
    }
  }, [isOpen])

  // Escape key handler & focus trap
  useEffect(() => {
    if (!isOpen) return

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }

      // Simple focus trap
      if (e.key === 'Tab' && modalCardRef.current) {
        const focusableElements = modalCardRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusableElements.length === 0) return

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  // Lock body scroll while open
  useEffect(() => {
    if (!isOpen) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pricing-modal-title"
      aria-describedby="pricing-modal-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-[2px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={modalCardRef}
        className="relative w-full max-w-md rounded-card border border-line bg-paper p-6 sm:p-8 shadow-lift space-y-5"
      >
        {/* Top-right close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex size-9 items-center justify-center rounded-[var(--radius-control)] border border-line text-muted transition hover:border-ink/40 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
          aria-label="Close pricing dialog"
        >
          <CloseIcon />
        </button>

        {/* Eyebrow badge */}
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-pine">
          Pricing
        </p>

        {/* Modal Title */}
        <h2
          id="pricing-modal-title"
          className="font-display text-2xl sm:text-[1.75rem] leading-snug tracking-[-0.03em] text-ink pr-8"
        >
          FOLVIRA is currently free to use.
        </h2>

        {/* Modal Body */}
        <p
          id="pricing-modal-desc"
          className="text-sm leading-relaxed text-muted sm:text-base sm:leading-7"
        >
          We’re focused on helping you build a thoughtful, professional portfolio without putting
          a price on getting started. More plans and features may come later as FOLVIRA grows.
        </p>

        {/* Action button */}
        <div className="pt-2">
          <button
            ref={gotItButtonRef}
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto rounded-[var(--radius-control)] bg-pine px-6 py-2.5 text-sm font-bold text-white transition hover:bg-pine-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
