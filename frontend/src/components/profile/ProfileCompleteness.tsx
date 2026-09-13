/**
 * ProfileCompleteness.tsx — Visual completeness bar with level badge & recommendations.
 *
 * Designed using FOLVIRA's editorial aesthetic:
 * warm tones, elegant typography, precise progress indication.
 */
import { Link } from 'react-router-dom'
import type { Profile } from '../../types/profile'

interface ProfileCompletenessProps {
  completeness: number
  profile?: Profile
  showDetails?: boolean
}

export function ProfileCompleteness({
  completeness,
  profile,
  showDetails = true,
}: ProfileCompletenessProps) {
  // Determine badge and color state
  const getBadge = (pct: number) => {
    if (pct >= 85) return { label: 'Ready for Showcase', color: 'bg-[#edf4f1] text-pine' }
    if (pct >= 50) return { label: 'In Progress', color: 'bg-[#f6f1e7] text-brass' }
    return { label: 'Getting Started', color: 'bg-[#f1eee6] text-muted' }
  }

  const badge = getBadge(completeness)

  // Identify missing components to suggest next actions
  const suggestions: { text: string; link: string }[] = []
  if (profile) {
    if (!profile.headline || !profile.about) {
      suggestions.push({ text: 'Add your professional headline & bio', link: '/profile#basic' })
    }
    if (profile.experience.length === 0) {
      suggestions.push({ text: 'Add at least one work experience', link: '/profile#experience' })
    }
    if (profile.projects.length === 0) {
      suggestions.push({ text: 'Showcase your top projects', link: '/profile#projects' })
    }
    if (profile.skills.length === 0) {
      suggestions.push({ text: 'List your core skills', link: '/profile#skills' })
    }
    if (profile.education.length === 0) {
      suggestions.push({ text: 'Include your education history', link: '/profile#education' })
    }
  }

  return (
    <div className="rounded-card border border-line bg-paper p-6 shadow-soft sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="eyebrow">Profile Strength</span>
          <h2 className="font-display text-2xl tracking-[-0.03em] text-ink">
            {completeness}% Completed
          </h2>
        </div>
        <span
          className={`self-start rounded-full px-3 py-1 text-xs font-bold tracking-[0.06em] uppercase sm:self-auto ${badge.color}`}
        >
          {badge.label}
        </span>
      </div>

      {/* Progress Track */}
      <div
        className="mt-4 h-2 w-full overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuenow={completeness}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Profile completeness"
      >
        <div
          className="h-full rounded-full bg-pine transition-all duration-500 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, completeness))}%` }}
        />
      </div>

      {/* Suggestions if requested */}
      {showDetails && suggestions.length > 0 && (
        <div className="mt-5 border-t border-line/60 pt-4">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted">
            Recommended next steps:
          </p>
          <ul className="mt-2.5 space-y-1.5">
            {suggestions.slice(0, 3).map((item, idx) => (
              <li key={idx} className="flex items-center gap-2 text-sm text-ink">
                <span className="h-1.5 w-1.5 rounded-full bg-brass shrink-0" />
                <Link
                  to={item.link}
                  className="font-medium hover:text-pine hover:underline transition-colors"
                >
                  {item.text}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
