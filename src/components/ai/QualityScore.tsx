/**
 * QualityScore.tsx — FOLVIRA Profile Quality score display.
 *
 * Shows the deterministic profile quality score with a per-dimension breakdown.
 * Labelled clearly as "FOLVIRA Profile Quality" — not an industry benchmark.
 * Never shows fake recruiter statistics.
 */
import type { ProfileQualityReport, QualityDimension } from '../../types/ai'

interface QualityScoreProps {
  report: ProfileQualityReport
}

function scoreColor(score: number, max: number): string {
  const pct = max > 0 ? (score / max) * 100 : 0
  if (pct >= 80) return 'text-pine'
  if (pct >= 50) return 'text-[#7a5c00]'
  return 'text-[#9a2a2a]'
}

function barColor(score: number, max: number): string {
  const pct = max > 0 ? (score / max) * 100 : 0
  if (pct >= 80) return 'bg-pine'
  if (pct >= 50) return 'bg-[#b8860b]'
  return 'bg-[#b83232]'
}

function DimensionRow({ dim }: { dim: QualityDimension }) {
  const pct = dim.maxScore > 0 ? Math.round((dim.score / dim.maxScore) * 100) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-ink">{dim.label}</span>
        <span className={`text-sm font-extrabold tabular-nums ${scoreColor(dim.score, dim.maxScore)}`}>
          {dim.score}<span className="text-muted font-normal">/{dim.maxScore}</span>
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-line/60">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor(dim.score, dim.maxScore)}`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={dim.score}
          aria-valuemin={0}
          aria-valuemax={dim.maxScore}
          aria-label={`${dim.label}: ${dim.score} of ${dim.maxScore}`}
        />
      </div>
      <p className="text-xs text-muted leading-relaxed">{dim.explanation}</p>
    </div>
  )
}

export function QualityScore({ report }: QualityScoreProps) {
  const totalColor =
    report.total >= 80 ? 'text-pine' : report.total >= 50 ? 'text-[#7a5c00]' : 'text-[#9a2a2a]'
  const ringColor =
    report.total >= 80
      ? 'stroke-pine'
      : report.total >= 50
        ? 'stroke-[#b8860b]'
        : 'stroke-[#b83232]'

  // SVG ring parameters
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (report.total / 100) * circumference

  return (
    <div className="rounded-card border border-line bg-paper p-6 shadow-soft space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow mb-1">{report.label}</p>
          <h2 className="font-display text-2xl tracking-[-0.03em] text-ink">
            Profile Quality
          </h2>
          <p className="mt-1 text-xs text-muted max-w-xs">
            A measure of how complete and well-described your profile is.
            Not an industry benchmark.
          </p>
        </div>

        {/* Score ring */}
        <div className="flex shrink-0 flex-col items-center gap-1">
          <svg width="90" height="90" viewBox="0 0 90 90" aria-hidden="true">
            {/* Track */}
            <circle
              cx="45" cy="45" r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="7"
              className="text-line/60"
            />
            {/* Progress */}
            <circle
              cx="45" cy="45" r={radius}
              fill="none"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className={`${ringColor} transition-all duration-700`}
              transform="rotate(-90 45 45)"
            />
          </svg>
          <span className={`-mt-[70px] font-display text-2xl font-extrabold tabular-nums ${totalColor}`}>
            {report.total}
          </span>
          <span className="mt-9 text-[10px] font-bold uppercase tracking-widest text-muted">
            / 100
          </span>
        </div>
      </div>

      {/* Dimensions */}
      <div className="space-y-4 border-t border-line pt-5">
        {report.dimensions.map((dim) => (
          <DimensionRow key={dim.label} dim={dim} />
        ))}
      </div>

      {/* Top actions */}
      {report.topActions.length > 0 && (
        <div className="border-t border-line pt-5">
          <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.1em] text-ink">
            Priority Actions
          </p>
          <ul className="space-y-2" aria-label="Priority actions to improve your profile">
            {report.topActions.map((action, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-muted">
                <span className="mt-0.5 shrink-0 h-1.5 w-1.5 rounded-full bg-brass" aria-hidden="true" />
                {action}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
