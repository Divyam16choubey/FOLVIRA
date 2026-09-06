/**
 * SuggestionCard.tsx — Displays a single AI suggestion with before/after and approve/reject.
 *
 * The original content remains visible until the user makes a decision.
 * Accepted/rejected suggestions show their final state read-only.
 *
 * Never auto-applies changes — the user must explicitly click Accept.
 */
import type { AISuggestion, SuggestionType } from '../../types/ai'

interface SuggestionCardProps {
  suggestion: AISuggestion
  onAccept: (id: string) => void
  onReject: (id: string) => void
  isProcessing?: boolean
}

const TYPE_LABELS: Record<SuggestionType, string> = {
  about: 'About / Bio',
  headline: 'Professional Headline',
  experience_description: 'Experience Description',
  project_description: 'Project Description',
  achievement_description: 'Achievement',
  skill_normalization: 'Skill Name',
  skill_merge: 'Duplicate Skills',
  skill_missing: 'Missing Skill',
  summary: 'Professional Summary',
  general: 'General',
}

const CATEGORY_LABELS: Record<string, string> = {
  clarity: 'Clarity',
  grammar: 'Grammar',
  conciseness: 'Conciseness',
  impact: 'Impact',
  specificity: 'Specificity',
  consistency: 'Consistency',
  missing_context: 'Missing Context',
  recruiter_readability: 'Readability',
  skill_intelligence: 'Skill Intelligence',
  completeness: 'Completeness',
}

function StatusBadge({ status }: { status: AISuggestion['status'] }) {
  if (status === 'accepted') {
    return (
      <span className="rounded-full bg-[#edf4f1] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-pine">
        Accepted
      </span>
    )
  }
  if (status === 'rejected') {
    return (
      <span className="rounded-full bg-[#f7f1f1] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#9a2a2a]">
        Rejected
      </span>
    )
  }
  return (
    <span className="rounded-full bg-[#fdf8ed] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#7a5c00]">
      Pending Review
    </span>
  )
}

export function SuggestionCard({
  suggestion,
  onAccept,
  onReject,
  isProcessing = false,
}: SuggestionCardProps) {
  const isPending = suggestion.status === 'pending'
  const isSkillMissing = suggestion.type === 'skill_missing'
  const isSkillMerge = suggestion.type === 'skill_merge'

  return (
    <article
      className={[
        'rounded-card border bg-paper shadow-soft transition-all duration-200',
        isPending ? 'border-line hover:border-pine/40' : 'border-line/60 opacity-75',
      ].join(' ')}
      aria-label={`Suggestion for ${TYPE_LABELS[suggestion.type] ?? suggestion.type}`}
    >
      <div className="p-5">
        {/* Header */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-[0.1em] text-pine">
              {TYPE_LABELS[suggestion.type] ?? suggestion.type}
            </span>
            <span className="text-line" aria-hidden="true">·</span>
            <span className="text-xs font-semibold text-muted">
              {CATEGORY_LABELS[suggestion.category] ?? suggestion.category}
            </span>
          </div>
          <StatusBadge status={suggestion.status} />
        </div>

        {/* Before / After — skill_missing shows only the addition */}
        {isSkillMissing ? (
          <div className="space-y-3">
            <div className="rounded-[var(--radius-control)] border border-pine/30 bg-[#f4faf7] px-4 py-3">
              <p className="mb-1 text-[10px] font-extrabold uppercase tracking-widest text-pine">
                Suggested Addition
              </p>
              <p className="text-sm font-semibold text-ink">{suggestion.suggested}</p>
            </div>
          </div>
        ) : isSkillMerge ? (
          <div className="space-y-3">
            <div className="rounded-[var(--radius-control)] border border-line bg-[#fffdf9] px-4 py-3">
              <p className="mb-1 text-[10px] font-extrabold uppercase tracking-widest text-muted">
                Possible Duplicates
              </p>
              <p className="text-sm text-ink">{suggestion.original}</p>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              These skills may refer to the same technology. Review your skills list and remove duplicates manually.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Original */}
            <div className="rounded-[var(--radius-control)] border border-line bg-[#fffdf9] px-4 py-3">
              <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-widest text-muted">
                Original
              </p>
              <p className="text-sm leading-relaxed text-ink/80 whitespace-pre-wrap">
                {suggestion.original || (
                  <span className="italic text-muted">— empty —</span>
                )}
              </p>
            </div>

            {/* Suggested */}
            <div className="rounded-[var(--radius-control)] border border-pine/25 bg-[#f4faf7] px-4 py-3">
              <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-widest text-pine">
                Suggested
              </p>
              <p className="text-sm leading-relaxed text-ink whitespace-pre-wrap">
                {suggestion.suggested}
              </p>
            </div>
          </div>
        )}

        {/* Reason */}
        <p className="mt-3 text-xs text-muted leading-relaxed">
          <span className="font-semibold text-ink">Why: </span>
          {suggestion.reason}
        </p>

        {/* Provenance note */}
        <p className="mt-1 text-[10px] text-muted/70">
          Generated by {suggestion.providerName} / {suggestion.aiModel}
        </p>
      </div>

      {/* Actions — only shown for pending, non-merge suggestions */}
      {isPending && !isSkillMerge && (
        <div className="flex items-center gap-3 border-t border-line/60 px-5 py-3">
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => onAccept(suggestion._id)}
            className="rounded-[var(--radius-control)] bg-pine px-4 py-1.5 text-xs font-bold text-white transition hover:bg-[var(--color-pine-deep)] disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
          >
            {isProcessing ? 'Saving…' : 'Accept'}
          </button>
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => onReject(suggestion._id)}
            className="rounded-[var(--radius-control)] border border-line px-4 py-1.5 text-xs font-bold text-ink transition hover:border-[#9a2a2a] hover:text-[#9a2a2a] disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
          >
            Reject
          </button>
        </div>
      )}

      {/* Skill merge — informational only, no auto-apply */}
      {isPending && isSkillMerge && (
        <div className="flex items-center gap-3 border-t border-line/60 px-5 py-3">
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => onReject(suggestion._id)}
            className="rounded-[var(--radius-control)] border border-line px-4 py-1.5 text-xs font-bold text-ink transition hover:border-pine/40 disabled:opacity-50"
          >
            Dismiss
          </button>
          <p className="text-xs text-muted">
            Review your skills list manually to remove any duplicates.
          </p>
        </div>
      )}
    </article>
  )
}
