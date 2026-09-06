/**
 * AIIntelligencePage.tsx — /profile/intelligence
 *
 * The central AI workspace for Phase 4.
 * All AI operations are explicit user actions — nothing runs automatically.
 *
 * Sections:
 *   1. Profile Quality Score (deterministic, always available)
 *   2. AI Profile Analysis (requires AI key, explicit trigger)
 *   3. Suggestions Review (pending/accepted/rejected)
 *   4. Content Improvement actions (about, headline, experience, projects)
 *   5. Professional Summary generation
 *   6. Skill Intelligence analysis
 *
 * Design: follows the existing FOLVIRA editorial language —
 *   warm ivory / deep charcoal / forest green / restrained brass.
 *   No purple/blue SaaS gradients, no glassmorphism, no fake badges.
 */
import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { AppLayout } from '../../components/layout/AppLayout'
import { Button } from '../../components/common/Button'
import { QualityScore } from '../../components/ai/QualityScore'
import { AnalysisPanel } from '../../components/ai/AnalysisPanel'
import { SuggestionCard } from '../../components/ai/SuggestionCard'
import { api, ApiError } from '../../lib/api'
import type { Profile, Experience, Project } from '../../types/profile'
import type {
  ProfileQualityReport,
  MissingInfoItem,
  ProfileAnalysis,
  AISuggestion,
  SummaryResult,
} from '../../types/ai'

// ─── API response shape helpers ───────────────────────────────────────────────

interface QualityResponse {
  quality: ProfileQualityReport
  missingInfo: MissingInfoItem[]
}

interface AnalysisResponse {
  analysis: ProfileAnalysis
  quality: ProfileQualityReport
  missingInfo: MissingInfoItem[]
}

interface SuggestionsResponse {
  suggestions: AISuggestion[]
}

interface ImproveResponse {
  suggestion: AISuggestion
}

// ─── Section tab type ─────────────────────────────────────────────────────────

type ActiveTab = 'quality' | 'analysis' | 'suggestions' | 'improve' | 'summary' | 'skills'

// ─── Improve target selector ──────────────────────────────────────────────────

interface ImproveTarget {
  label: string
  type: string
  field: string
  category: string
  sectionId?: string
  content: string
  instruction: string
}

// ─── Page component ───────────────────────────────────────────────────────────

export function AIIntelligencePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('quality')

  // Quality state (deterministic — always loads)
  const [quality, setQuality] = useState<ProfileQualityReport | null>(null)
  const [missingInfo, setMissingInfo] = useState<MissingInfoItem[]>([])
  const [loadingQuality, setLoadingQuality] = useState(true)

  // Profile state (needed for improve target list)
  const [profile, setProfile] = useState<Profile | null>(null)

  // Analysis state
  const [analysis, setAnalysis] = useState<ProfileAnalysis | null>(null)
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)
  const [analysisError, setAnalysisError] = useState('')

  // Suggestions state
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [suggestionFilter, setSuggestionFilter] = useState<'pending' | 'accepted' | 'rejected' | 'all'>('pending')
  const [processingId, setProcessingId] = useState<string | null>(null)

  // Content improvement state
  const [improveTargets, setImproveTargets] = useState<ImproveTarget[]>([])
  const [selectedTarget, setSelectedTarget] = useState<ImproveTarget | null>(null)
  const [loadingImprove, setLoadingImprove] = useState(false)
  const [improveError, setImproveError] = useState('')
  const [latestImprovement, setLatestImprovement] = useState<AISuggestion | null>(null)

  // Summary state
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [summaryResult, setSummaryResult] = useState<SummaryResult | null>(null)
  const [summaryError, setSummaryError] = useState('')

  // Skills state
  const [loadingSkills, setLoadingSkills] = useState(false)
  const [skillsError, setSkillsError] = useState('')
  const [skillSuggestionsCount, setSkillSuggestionsCount] = useState<number | null>(null)

  // Global toast
  const [toast, setToast] = useState('')

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 4000)
  }, [])

  // ── Load quality score and profile on mount (no AI call) ──────────────────
  useEffect(() => {
    const loadInitial = async () => {
      try {
        setLoadingQuality(true)
        const [qualRes, profileRes] = await Promise.all([
          api.get<QualityResponse>('/api/ai/profile/quality'),
          api.get<{ profile: Profile; completeness: number }>('/api/profile'),
        ])
        setQuality(qualRes.quality)
        setMissingInfo(qualRes.missingInfo)
        setProfile(profileRes.profile)

        // Build improve targets from profile
        buildImproveTargets(profileRes.profile)
      } catch {
        // If quality fails, the page still renders — just without the score
      } finally {
        setLoadingQuality(false)
      }
    }

    void loadInitial()
  }, [])

  // Load suggestions when switching to suggestions tab
  useEffect(() => {
    if (activeTab === 'suggestions') {
      void loadSuggestions()
    }
  }, [activeTab, suggestionFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  function buildImproveTargets(p: Profile) {
    const targets: ImproveTarget[] = []

    if (p.about) {
      targets.push({
        label: 'About / Career Summary',
        type: 'about',
        field: 'about',
        category: 'clarity',
        content: p.about,
        instruction: 'Improve the clarity, professional tone, and impact of this career summary.',
      })
    }

    if (p.headline) {
      targets.push({
        label: 'Professional Headline',
        type: 'headline',
        field: 'headline',
        category: 'clarity',
        content: p.headline,
        instruction: 'Make this headline more specific and compelling without adding invented claims.',
      })
    }

    for (const exp of (p.experience ?? [])) {
      if (exp.description && exp.description.trim().length > 10) {
        targets.push({
          label: `Experience: ${exp.title} @ ${exp.company}`,
          type: 'experience_description',
          field: 'description',
          category: 'impact',
          sectionId: exp._id,
          content: exp.description,
          instruction: 'Improve this experience description using strong action verbs and professional language. Do not add metrics, numbers, or outcomes unless they are explicitly present in the original text.',
        })
      }
    }

    for (const proj of (p.projects ?? [])) {
      if (proj.description && proj.description.trim().length > 10) {
        targets.push({
          label: `Project: ${proj.name}`,
          type: 'project_description',
          field: 'description',
          category: 'clarity',
          sectionId: proj._id,
          content: proj.description,
          instruction: 'Improve this project description for clarity and professionalism. Do not add technologies, outcomes, or metrics unless they are explicitly in the original text.',
        })
      }
    }

    setImproveTargets(targets)
    if (targets.length > 0 && !selectedTarget) {
      setSelectedTarget(targets[0])
    }
  }

  // ── Load suggestions ──────────────────────────────────────────────────────
  const loadSuggestions = async () => {
    setLoadingSuggestions(true)
    try {
      const params = suggestionFilter !== 'all' ? `?status=${suggestionFilter}` : ''
      const res = await api.get<SuggestionsResponse>(`/api/ai/suggestions${params}`)
      setSuggestions(res.suggestions)
    } catch (err) {
      if (err instanceof ApiError) {
        showToast(err.message)
      }
    } finally {
      setLoadingSuggestions(false)
    }
  }

  // ── Run AI Analysis ───────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    setLoadingAnalysis(true)
    setAnalysisError('')
    setAnalysis(null)
    try {
      const res = await api.post<AnalysisResponse>('/api/ai/profile/analyze', {})
      setAnalysis(res.analysis)
      setQuality(res.quality)
      setMissingInfo(res.missingInfo)
      showToast('Profile analysis complete.')
    } catch (err) {
      if (err instanceof ApiError) {
        setAnalysisError(err.message)
      } else {
        setAnalysisError('Analysis failed. Please try again.')
      }
    } finally {
      setLoadingAnalysis(false)
    }
  }

  // ── Content improvement ───────────────────────────────────────────────────
  const handleImprove = async () => {
    if (!selectedTarget) return
    setLoadingImprove(true)
    setImproveError('')
    setLatestImprovement(null)
    try {
      const res = await api.post<ImproveResponse>('/api/ai/content/improve', {
        type: selectedTarget.type,
        field: selectedTarget.field,
        category: selectedTarget.category,
        sectionId: selectedTarget.sectionId,
        originalContent: selectedTarget.content,
        instruction: selectedTarget.instruction,
      })
      setLatestImprovement(res.suggestion)
      showToast('Improvement suggestion generated. Review it below.')
    } catch (err) {
      if (err instanceof ApiError) {
        setImproveError(err.message)
      } else {
        setImproveError('Could not generate improvement. Please try again.')
      }
    } finally {
      setLoadingImprove(false)
    }
  }

  // ── Generate Summary ──────────────────────────────────────────────────────
  const handleGenerateSummary = async () => {
    setLoadingSummary(true)
    setSummaryError('')
    setSummaryResult(null)
    try {
      const res = await api.post<SummaryResult>('/api/ai/profile/summary', {})
      setSummaryResult(res)
      if (!res.insufficientData) {
        showToast('Summary generated. Review it in Suggestions.')
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setSummaryError(err.message)
      } else {
        setSummaryError('Could not generate summary. Please try again.')
      }
    } finally {
      setLoadingSummary(false)
    }
  }

  // ── Skill intelligence ────────────────────────────────────────────────────
  const handleAnalyzeSkills = async () => {
    setLoadingSkills(true)
    setSkillsError('')
    try {
      const res = await api.post<{ intelligence: unknown; suggestions: AISuggestion[] }>('/api/ai/profile/skills', {})
      setSkillSuggestionsCount(res.suggestions.length)
      if (res.suggestions.length > 0) {
        showToast(`${res.suggestions.length} skill suggestion${res.suggestions.length === 1 ? '' : 's'} generated. View in Suggestions.`)
        setActiveTab('suggestions')
      } else {
        showToast('Skills look consistent — no significant issues found.')
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setSkillsError(err.message)
      } else {
        setSkillsError('Skill analysis failed. Please try again.')
      }
    } finally {
      setLoadingSkills(false)
    }
  }

  // ── Accept / Reject individual suggestions ────────────────────────────────
  const handleAccept = async (id: string) => {
    setProcessingId(id)
    try {
      await api.post(`/api/ai/suggestions/${id}/accept`, {})
      setSuggestions((prev) =>
        prev.map((s) => (s._id === id ? { ...s, status: 'accepted' as const } : s))
      )
      if (latestImprovement?._id === id) {
        setLatestImprovement((prev) => prev ? { ...prev, status: 'accepted' } : null)
      }
      if (summaryResult?.suggestion?._id === id) {
        setSummaryResult((prev) => prev && prev.suggestion
          ? { ...prev, suggestion: { ...prev.suggestion, status: 'accepted' } }
          : prev
        )
      }
      showToast('Change accepted and applied to your profile.')
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Could not accept suggestion.')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (id: string) => {
    setProcessingId(id)
    try {
      await api.post(`/api/ai/suggestions/${id}/reject`, {})
      setSuggestions((prev) =>
        prev.map((s) => (s._id === id ? { ...s, status: 'rejected' as const } : s))
      )
      if (latestImprovement?._id === id) {
        setLatestImprovement((prev) => prev ? { ...prev, status: 'rejected' } : null)
      }
      if (summaryResult?.suggestion?._id === id) {
        setSummaryResult((prev) => prev && prev.suggestion
          ? { ...prev, suggestion: { ...prev.suggestion, status: 'rejected' } }
          : prev
        )
      }
      showToast('Suggestion rejected.')
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Could not reject suggestion.')
    } finally {
      setProcessingId(null)
    }
  }

  // ─── Tabs config ─────────────────────────────────────────────────────────

  const tabs: { id: ActiveTab; label: string }[] = [
    { id: 'quality', label: 'Profile Quality' },
    { id: 'analysis', label: 'AI Analysis' },
    { id: 'suggestions', label: 'Suggestions' },
    { id: 'improve', label: 'Improve Content' },
    { id: 'summary', label: 'Generate Summary' },
    { id: 'skills', label: 'Skill Intelligence' },
  ]

  // ─── Pending suggestion count badge ──────────────────────────────────────
  const pendingCount = suggestions.filter((s) => s.status === 'pending').length

  return (
    <AppLayout>
      {/* Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 rounded-card border border-pine/30 bg-paper px-5 py-3 shadow-lift text-sm font-bold text-pine flex items-center gap-2"
        >
          <span className="h-2 w-2 rounded-full bg-pine animate-ping" aria-hidden="true" />
          {toast}
        </div>
      )}

      <div className="section-shell py-10 sm:py-14">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow mb-2">Profile Intelligence</p>
            <h1 className="font-display text-3xl sm:text-4xl tracking-[-0.04em] text-ink">
              AI Intelligence
            </h1>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">
              Analyse your profile, review improvement suggestions, and accept or reject each
              change. Your profile is never modified without your approval.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/profile">
              <Button variant="secondary" className="px-4 py-2 text-xs">
                ← Profile Editor
              </Button>
            </Link>
          </div>
        </div>

        {/* Tab navigation */}
        <nav
          className="mb-8 flex flex-wrap gap-1 border-b border-line pb-0"
          aria-label="Intelligence sections"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={[
                  'relative -mb-px px-4 py-2.5 text-sm font-bold transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-pine rounded-t-[var(--radius-control)]',
                  isActive
                    ? 'border border-b-paper border-line text-pine bg-paper'
                    : 'text-muted hover:text-ink border border-transparent',
                ].join(' ')}
                aria-current={isActive ? 'page' : undefined}
              >
                {tab.label}
                {tab.id === 'suggestions' && pendingCount > 0 && (
                  <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-pine text-[9px] font-extrabold text-white">
                    {pendingCount}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* ── Tab: Profile Quality ─────────────────────────────────────────── */}
        {activeTab === 'quality' && (
          <div className="space-y-6">
            {loadingQuality ? (
              <div className="rounded-card border border-line bg-paper p-10 text-center shadow-soft">
                <p className="font-display text-xl text-pine animate-pulse">
                  Computing profile quality…
                </p>
              </div>
            ) : quality ? (
              <>
                <QualityScore report={quality} />
                {missingInfo.length > 0 && (
                  <div className="rounded-card border border-line bg-paper p-5 shadow-soft">
                    <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.1em] text-ink">
                      Missing Information
                    </p>
                    <div className="space-y-3">
                      {missingInfo.map((item) => (
                        <div
                          key={item.field}
                          className="flex items-start gap-3 rounded-[var(--radius-control)] border border-line bg-[#fffdf9] p-3"
                        >
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold text-ink">{item.label}</span>
                              <span className={[
                                'rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider',
                                item.priority === 'recommended' ? 'bg-[#fdf8ed] text-[#7a5c00]' :
                                item.priority === 'required' ? 'bg-[#fdf1f1] text-[#9a2a2a]' :
                                'bg-[#f1eee6] text-muted',
                              ].join(' ')}>
                                {item.priority}
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs text-muted">{item.reason}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="rounded-card border border-line bg-[#fffdf9] p-5">
                  <p className="text-xs text-muted">
                    Ready for a deeper look? Use{' '}
                    <button
                      type="button"
                      className="font-bold text-pine underline underline-offset-2"
                      onClick={() => setActiveTab('analysis')}
                    >
                      AI Analysis
                    </button>{' '}
                    to get structured findings and actionable suggestions from the AI.
                  </p>
                </div>
              </>
            ) : (
              <div className="rounded-card border border-line bg-paper p-10 text-center shadow-soft">
                <p className="text-sm text-muted">Profile quality score unavailable.</p>
                <Link to="/profile" className="mt-4 inline-block text-xs font-bold text-pine underline">
                  Create your profile first
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: AI Analysis ─────────────────────────────────────────────── */}
        {activeTab === 'analysis' && (
          <div className="space-y-6">
            {!analysis && !loadingAnalysis && (
              <div className="rounded-card border border-line bg-paper p-8 shadow-soft text-center space-y-5">
                <div>
                  <p className="font-display text-2xl tracking-[-0.03em] text-ink">
                    Analyse Your Profile
                  </p>
                  <p className="mt-2 text-sm text-muted max-w-lg mx-auto">
                    The AI will examine your profile for clarity, completeness, and recruiter
                    readability — grounded only in the information you've provided.
                    No facts will be invented.
                  </p>
                </div>

                {analysisError && (
                  <div role="alert" className="rounded-[var(--radius-control)] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
                    {analysisError}
                  </div>
                )}

                <Button
                  onClick={() => void handleAnalyze()}
                  disabled={loadingAnalysis}
                  className="px-8 py-3"
                >
                  {loadingAnalysis ? 'Analysing…' : 'Analyse Profile'}
                </Button>

                <p className="text-xs text-muted/70">
                  AI analysis requires a configured AI provider. Contact your administrator if this
                  feature is unavailable.
                </p>
              </div>
            )}

            {loadingAnalysis && (
              <div className="rounded-card border border-line bg-paper p-10 text-center shadow-soft">
                <p className="font-display text-xl text-pine animate-pulse">
                  Analysing your profile…
                </p>
                <p className="mt-2 text-xs text-muted">This may take a few seconds.</p>
              </div>
            )}

            {analysis && !loadingAnalysis && (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-muted">Analysis results</p>
                  <Button
                    variant="secondary"
                    className="px-3 py-1.5 text-xs"
                    onClick={() => void handleAnalyze()}
                    disabled={loadingAnalysis}
                  >
                    Re-analyse
                  </Button>
                </div>
                <AnalysisPanel analysis={analysis} missingInfo={missingInfo} />
              </>
            )}
          </div>
        )}

        {/* ── Tab: Suggestions ─────────────────────────────────────────────── */}
        {activeTab === 'suggestions' && (
          <div className="space-y-6">
            {/* Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-muted">Show:</span>
              {(['pending', 'accepted', 'rejected', 'all'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setSuggestionFilter(f)}
                  className={[
                    'rounded-full px-3 py-1 text-xs font-bold transition',
                    suggestionFilter === f
                      ? 'bg-pine text-white'
                      : 'border border-line text-muted hover:text-ink hover:border-pine/40',
                  ].join(' ')}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
              <button
                type="button"
                onClick={() => void loadSuggestions()}
                className="ml-auto text-xs font-bold text-pine hover:underline"
              >
                Refresh
              </button>
            </div>

            {loadingSuggestions ? (
              <div className="py-12 text-center">
                <p className="text-sm text-muted animate-pulse">Loading suggestions…</p>
              </div>
            ) : suggestions.length === 0 ? (
              <div className="rounded-card border border-line bg-paper p-10 text-center shadow-soft">
                <p className="text-sm font-semibold text-ink">
                  {suggestionFilter === 'pending'
                    ? 'No pending suggestions. Run an analysis or improve a content field to generate suggestions.'
                    : `No ${suggestionFilter} suggestions found.`}
                </p>
                <div className="mt-4 flex justify-center gap-3">
                  <Button
                    variant="secondary"
                    className="px-4 py-2 text-xs"
                    onClick={() => setActiveTab('analysis')}
                  >
                    Run AI Analysis
                  </Button>
                  <Button
                    variant="secondary"
                    className="px-4 py-2 text-xs"
                    onClick={() => setActiveTab('improve')}
                  >
                    Improve Content
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {suggestions.map((s) => (
                  <SuggestionCard
                    key={s._id}
                    suggestion={s}
                    onAccept={(id) => void handleAccept(id)}
                    onReject={(id) => void handleReject(id)}
                    isProcessing={processingId === s._id}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Improve Content ─────────────────────────────────────────── */}
        {activeTab === 'improve' && (
          <div className="space-y-6">
            {improveTargets.length === 0 ? (
              <div className="rounded-card border border-line bg-paper p-10 text-center shadow-soft">
                <p className="text-sm font-semibold text-ink">
                  No content to improve yet.
                </p>
                <p className="mt-1 text-xs text-muted">
                  Add an About section, headline, or experience descriptions to your profile first.
                </p>
                <div className="mt-4">
                  <Link to="/profile">
                    <Button variant="secondary" className="px-4 py-2 text-xs">
                      Go to Profile Editor
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {/* Target selector */}
                <div className="rounded-card border border-line bg-paper p-5 shadow-soft">
                  <label className="block text-xs font-extrabold uppercase tracking-[0.1em] text-muted mb-2">
                    Select content to improve
                  </label>
                  <select
                    className="w-full rounded-[var(--radius-control)] border border-line bg-paper px-3.5 py-2.5 text-sm text-ink outline-none focus:border-pine"
                    value={selectedTarget ? improveTargets.indexOf(selectedTarget) : 0}
                    onChange={(e) => {
                      const idx = parseInt(e.target.value, 10)
                      setSelectedTarget(improveTargets[idx] ?? null)
                      setLatestImprovement(null)
                      setImproveError('')
                    }}
                  >
                    {improveTargets.map((t, idx) => (
                      <option key={idx} value={idx}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedTarget && (
                  <>
                    {/* Current content preview */}
                    <div className="rounded-card border border-line bg-[#fffdf9] p-5 shadow-soft">
                      <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.1em] text-muted">
                        Current Content
                      </p>
                      <p className="text-sm leading-relaxed text-ink whitespace-pre-wrap">
                        {selectedTarget.content}
                      </p>
                    </div>

                    {/* Error */}
                    {improveError && (
                      <div role="alert" className="rounded-[var(--radius-control)] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
                        {improveError}
                      </div>
                    )}

                    {/* Action */}
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={() => void handleImprove()}
                        disabled={loadingImprove}
                        className="px-6 py-2.5"
                      >
                        {loadingImprove ? 'Generating…' : 'Generate Improvement'}
                      </Button>
                      <p className="text-xs text-muted">
                        The AI will suggest a rewrite. You decide whether to apply it.
                      </p>
                    </div>

                    {/* Latest improvement result */}
                    {latestImprovement && (
                      <div className="space-y-3">
                        <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-ink">
                          Suggestion
                        </p>
                        <SuggestionCard
                          suggestion={latestImprovement}
                          onAccept={(id) => void handleAccept(id)}
                          onReject={(id) => void handleReject(id)}
                          isProcessing={processingId === latestImprovement._id}
                        />
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Tab: Generate Summary ────────────────────────────────────────── */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            <div className="rounded-card border border-line bg-paper p-8 shadow-soft space-y-5">
              <div>
                <p className="font-display text-2xl tracking-[-0.03em] text-ink">
                  Professional Summary
                </p>
                <p className="mt-2 text-sm text-muted max-w-lg">
                  Generate a professional summary grounded entirely in your existing profile data.
                  The AI will not invent employers, titles, metrics, or claims.
                  If your profile lacks sufficient information, you'll receive guidance on what to add.
                </p>
              </div>

              {summaryError && (
                <div role="alert" className="rounded-[var(--radius-control)] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
                  {summaryError}
                </div>
              )}

              <Button
                onClick={() => void handleGenerateSummary()}
                disabled={loadingSummary}
                className="px-8 py-3"
              >
                {loadingSummary ? 'Generating…' : 'Generate Summary'}
              </Button>
            </div>

            {summaryResult && !loadingSummary && (
              <>
                {summaryResult.insufficientData ? (
                  <div className="rounded-card border border-[#b8860b]/25 bg-[#fdf8ed] p-6 shadow-soft">
                    <p className="text-sm font-semibold text-[#7a5c00] mb-3">
                      Insufficient profile data for a meaningful summary.
                    </p>
                    <p className="text-xs text-muted mb-3">To generate a better summary, add:</p>
                    <ul className="space-y-1.5">
                      {summaryResult.missingForBetterSummary.map((m, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-ink">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#b8860b]" aria-hidden="true" />
                          {m}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4">
                      <Link to="/profile">
                        <Button variant="secondary" className="px-4 py-2 text-xs">
                          Add Profile Information
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : summaryResult.suggestion ? (
                  <div className="space-y-3">
                    <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-ink">
                      Generated Summary
                    </p>
                    <SuggestionCard
                      suggestion={summaryResult.suggestion}
                      onAccept={(id) => void handleAccept(id)}
                      onReject={(id) => void handleReject(id)}
                      isProcessing={processingId === summaryResult.suggestion._id}
                    />
                    {summaryResult.missingForBetterSummary.length > 0 && (
                      <div className="rounded-[var(--radius-control)] border border-line bg-[#fffdf9] p-4">
                        <p className="text-xs font-semibold text-muted mb-2">
                          For an even richer summary, consider adding:
                        </p>
                        <ul className="space-y-1">
                          {summaryResult.missingForBetterSummary.map((m, idx) => (
                            <li key={idx} className="text-xs text-muted">{m}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : null}
              </>
            )}
          </div>
        )}

        {/* ── Tab: Skill Intelligence ──────────────────────────────────────── */}
        {activeTab === 'skills' && (
          <div className="space-y-6">
            <div className="rounded-card border border-line bg-paper p-8 shadow-soft space-y-5">
              <div>
                <p className="font-display text-2xl tracking-[-0.03em] text-ink">
                  Skill Intelligence
                </p>
                <p className="mt-2 text-sm text-muted max-w-lg">
                  Analyse your skills list for duplicates, naming inconsistencies, and skills
                  mentioned in your experience or projects that aren't in your skills list.
                  Any changes require your approval — nothing is automatically modified.
                </p>
              </div>

              {skillsError && (
                <div role="alert" className="rounded-[var(--radius-control)] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
                  {skillsError}
                </div>
              )}

              {skillSuggestionsCount !== null && skillSuggestionsCount === 0 && (
                <div className="rounded-[var(--radius-control)] border border-pine/25 bg-[#f4faf7] px-4 py-3">
                  <p className="text-sm text-pine font-semibold">
                    Skills look consistent — no significant issues found.
                  </p>
                </div>
              )}

              <Button
                onClick={() => void handleAnalyzeSkills()}
                disabled={loadingSkills}
                className="px-8 py-3"
              >
                {loadingSkills ? 'Analysing Skills…' : 'Analyse Skills'}
              </Button>

              {/* Link to profile skills section */}
              {profile && profile.skills.length > 0 && (
                <div className="border-t border-line pt-4">
                  <p className="text-xs font-semibold text-muted mb-2">
                    Your current skills ({profile.skills.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.map((s) => (
                      <span
                        key={s._id}
                        className="rounded bg-[#f1eee6] px-2.5 py-0.5 text-xs font-semibold text-ink"
                      >
                        {s.name}
                        {s.source === 'ai' && (
                          <span className="ml-1 text-[9px] text-pine font-bold">(ai)</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
