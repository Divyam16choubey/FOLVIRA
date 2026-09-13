/**
 * SectionCard.tsx — Reusable editorial container for profile sections.
 */
import type { ReactNode } from 'react'
import { Button } from '../common/Button'

interface SectionCardProps {
  id?: string
  title: string
  description?: string
  count?: number
  onAdd?: () => void
  addLabel?: string
  actionSlot?: ReactNode
  children: ReactNode
  className?: string
}

export function SectionCard({
  id,
  title,
  description,
  count,
  onAdd,
  addLabel = 'Add Entry',
  actionSlot,
  children,
  className = '',
}: SectionCardProps) {
  return (
    <section
      id={id}
      className={`rounded-card border border-line bg-paper p-6 sm:p-8 shadow-soft transition-all duration-200 ${className}`}
    >
      <div className="flex flex-col gap-3 pb-6 border-b border-line sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-display text-xl sm:text-2xl tracking-[-0.03em] text-ink">
              {title}
            </h2>
            {count !== undefined && (
              <span className="rounded-full bg-[#f1eee6] px-2.5 py-0.5 text-xs font-bold text-muted">
                {count}
              </span>
            )}
          </div>
          {description && (
            <p className="mt-1 text-sm text-muted">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {actionSlot}
          {onAdd && (
            <Button
              variant="secondary"
              className="py-1.5 px-3 text-xs"
              onClick={onAdd}
            >
              + {addLabel}
            </Button>
          )}
        </div>
      </div>

      <div className="pt-6">{children}</div>
    </section>
  )
}
