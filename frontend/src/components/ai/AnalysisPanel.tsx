/**
 * AnalysisPanel.tsx — Displays structured AI profile analysis results.
 *
 * Shows strengths, weaknesses, missing info, and per-finding details.
 * All content comes from the AI response — nothing is fabricated by the component.
 */
import type { ProfileAnalysis, MissingInfoItem, FindingSeverity } from '../../types/ai'

interface AnalysisPanelProps {
  analysis: ProfileAnalysis
  missingInfo: MissingInfoItem[]
}

function severityStyles(severity: FindingSeverity) {
  switch (severity) {
    case 'warning':
      return {
        badge: 'bg-[#fdf8ed] text-[#7a5c00] border-[#b8860b]/30',
        dot: 'bg-[#b8860b]',
        label: 'Warning',
      }
    case 'improvement':
      return {
        badge: 'bg-[#f4faf7] text-pine border-pine/25',
        dot: 'bg-pine',
        label: 'Improvement',
      }
    default: // info
      return {
        badge: 'bg-[#f1eee6] text-muted border-line',
        dot: 'bg-muted',
        label: 'Info',
      }
  }
}

function priorityStyles(priority: MissingInfoItem['priority']) {
  switch (priority) {
    case 'required':
      return 'text-[#9a2a2a] bg-[#fdf1f1] border-[#b83232]/20'
    case 'recommended':
      return 'text-[#7a5c00] bg-[#fdf8ed] border-[#b8860b]/20'
    default: // optional
      return 'text-muted bg-[#f1eee6] border-line'
  }
}

export function AnalysisPanel({ analysis, missingInfo }: AnalysisPanelProps) {
  return (
    <div className="space-y-8">
      {/* Summary */}
      <div className="rounded-card border border-line bg-paper p-5 shadow-soft">
        <p className="eyebrow mb-2">Analysis Summary</p>
        <p className="text-sm leading-relaxed text-ink">{analysis.summary}</p>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-muted">Overall readability:</span>
          <span className="rounded-full bg-[#f1eee6] px-2.5 py-0.5 text-xs font-bold capitalize text-ink">
            {analysis.overallReadability}
          </span>
        </div>
      </div>

      {/* Strengths & Weaknesses — side by side */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Strengths */}
        <div className="rounded-card border border-pine/25 bg-[#f4faf7] p-5">
          <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.1em] text-pine">
            Strengths
          </p>
          {analysis.strengths.length > 0 ? (
            <ul className="space-y-2">
              {analysis.strengths.map((s, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-ink">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-pine" aria-hidden="true" />
                  {s}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm italic text-muted">
              No strengths identified yet — add more profile information.
            </p>
          )}
        </div>

        {/* Weaknesses */}
        <div className="rounded-card border border-[#b83232]/15 bg-[#fdf8f8] p-5">
          <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.1em] text-[#9a2a2a]">
            Areas to Improve
          </p>
          {analysis.weaknesses.length > 0 ? (
            <ul className="space-y-2">
              {analysis.weaknesses.map((w, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-ink">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#b83232]" aria-hidden="true" />
                  {w}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm italic text-muted">No significant weaknesses found.</p>
          )}
        </div>
      </div>

      {/* Missing Information */}
      {missingInfo.length > 0 && (
        <div className="rounded-card border border-line bg-paper p-5 shadow-soft">
          <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.1em] text-ink">
            Missing Information
          </p>
          <div className="space-y-3">
            {missingInfo.map((item) => (
              <div
                key={item.field}
                className={`flex items-start gap-3 rounded-[var(--radius-control)] border p-3 ${priorityStyles(item.priority)}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{item.label}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider border ${priorityStyles(item.priority)}`}>
                      {item.priority}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed opacity-80">{item.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Findings */}
      {analysis.findings.length > 0 && (
        <div className="rounded-card border border-line bg-paper p-5 shadow-soft">
          <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.1em] text-ink">
            Detailed Findings
          </p>
          <div className="space-y-4">
            {analysis.findings.map((finding, idx) => {
              const styles = severityStyles(finding.severity)
              return (
                <div
                  key={idx}
                  className={`rounded-[var(--radius-control)] border p-4 ${styles.badge}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${styles.dot}`} aria-hidden="true" />
                    <span className="text-xs font-extrabold uppercase tracking-wider">
                      {finding.area}
                    </span>
                    <span className="text-[10px] font-semibold opacity-70">
                      {styles.label}
                    </span>
                  </div>
                  <p className="text-sm font-semibold leading-snug">{finding.issue}</p>
                  <p className="mt-1.5 text-xs leading-relaxed opacity-80">
                    <span className="font-semibold">Suggestion: </span>
                    {finding.suggestion}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* If no findings at all */}
      {analysis.findings.length === 0 && analysis.weaknesses.length === 0 && (
        <div className="rounded-card border border-pine/25 bg-[#f4faf7] p-5 text-center">
          <p className="text-sm font-semibold text-pine">
            No significant issues detected. Continue building out your profile for deeper insights.
          </p>
        </div>
      )}
    </div>
  )
}
