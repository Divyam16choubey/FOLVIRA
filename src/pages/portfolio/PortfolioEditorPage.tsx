/**
 * PortfolioEditorPage — Phase 6 visual portfolio editor at /portfolio/:id
 *
 * Replaces the Phase 5 PortfolioWorkspacePage with a full editor that adds:
 *   - Content tab: profile overrides + entry selections
 *   - Unsaved changes detection + beforeunload protection
 *   - Explicit Save button with dirty/saved status indicator
 *   - Publish button with confirmation modal + validation
 *   - Responsive viewport preview switcher (desktop/tablet/mobile)
 *   - Published status badge with date
 *
 * Architecture:
 *   masterProfile — full profile data from server (for selection UI)
 *   overrides     — portfolio-specific field overrides (local state → saved)
 *   selections    — which entries appear (local state → saved)
 *   resolvedProfile — computed from masterProfile + overrides + selections
 *                     drives the live preview (no extra API call)
 *
 * Security:
 *   - No arbitrary HTML/CSS accepted
 *   - All override fields validated server-side
 *   - All selection IDs validated against actual profile entries server-side
 *   - URL safety checked in ContactSection (existing)
 */
import { useEffect, useState, useCallback, useRef } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Reorder } from 'framer-motion'
import { AppLayout } from '../../components/layout/AppLayout'
import { Button } from '../../components/common/Button'
import { ConfirmModal } from '../../components/common/ConfirmModal'
import { PortfolioRenderer } from '../../components/portfolio/PortfolioRenderer'
import { TemplateThumbnail } from '../../components/portfolio/TemplateThumbnail'
import { api, ApiError } from '../../lib/api'
import type {
  Portfolio,
  RendererProfile,
  PortfolioTheme,
  PortfolioOverrides,
  PortfolioSelections,
  SectionType,
  PublishValidationResult,
} from '../../types/portfolio'
import {
  TEMPLATE_LABELS,
  SECTION_LABELS,
  THEME_ACCENT_LABELS,
  THEME_BACKGROUND_LABELS,
  THEME_FONT_LABELS,
  DEFAULT_THEME,
  resolveForPreview,
} from '../../types/portfolio'

// ─── Types ────────────────────────────────────────────────────────────────────

type EditorTab = 'content' | 'sections' | 'design' | 'settings'
type ViewportMode = 'desktop' | 'tablet' | 'mobile'
type CopyState = 'idle' | 'copied' | 'failed'

interface EditorBundle {
  portfolio: Portfolio
  masterProfile: RendererProfile
  resolvedProfile: RendererProfile
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useToast() {
  const [message, setMessage] = useState('')
  const [type, setType] = useState<'success' | 'error'>('success')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const show = useCallback((msg: string, kind: 'success' | 'error' = 'success') => {
    if (timer.current) clearTimeout(timer.current)
    setMessage(msg)
    setType(kind)
    timer.current = setTimeout(() => setMessage(''), 4000)
  }, [])
  return { message, type, show }
}

function defaultSelections(): PortfolioSelections {
  return { featuredProjects: [], visibleExperience: [], visibleEducation: [], visibleCertifications: [] }
}

function defaultOverrides(): PortfolioOverrides {
  return {}
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Simple toggle switch */
function Toggle({
  checked, onChange, label,
}: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={[
        'flex h-5 w-9 shrink-0 items-center rounded-full border-2 transition-colors',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-pine',
        checked ? 'border-pine bg-pine' : 'border-line bg-line',
      ].join(' ')}
    >
      <span
        className={[
          'ml-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-4' : 'translate-x-0',
        ].join(' ')}
        aria-hidden="true"
      />
    </button>
  )
}

/** Publish confirmation modal */
function PublishModal({
  onConfirm, onCancel, publishing, validation,
}: {
  onConfirm: () => void
  onCancel: () => void
  publishing: boolean
  validation: PublishValidationResult | null
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="publish-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/30"
    >
      <div className="w-full max-w-md rounded-card border border-line bg-paper shadow-lift p-6 space-y-4">
        <h2 id="publish-modal-title" className="font-display text-2xl tracking-[-0.03em] text-ink">
          Ready to publish?
        </h2>
        <p className="text-sm text-muted">
          Your current draft will become the published version. The published version
          is immutable — editing the draft afterward won't change what's live.
        </p>

        {/* Validation warnings */}
        {validation && validation.warnings.length > 0 && (
          <div className="rounded-[var(--radius-control)] border border-[#b8860b]/30 bg-[#fdf8ed] p-3 space-y-1">
            <p className="text-xs font-bold text-[#7a5c00] uppercase tracking-wide">Warnings</p>
            {validation.warnings.map((w, i) => (
              <p key={i} className="text-xs text-[#7a5c00]">• {w}</p>
            ))}
          </div>
        )}

        {/* Validation errors (should be caught before modal opens, but just in case) */}
        {validation && validation.errors.length > 0 && (
          <div className="rounded-[var(--radius-control)] border border-red-200 bg-red-50 p-3 space-y-1">
            <p className="text-xs font-bold text-red-700 uppercase tracking-wide">Must fix before publishing</p>
            {validation.errors.map((e, i) => (
              <p key={i} className="text-xs text-red-700">• {e}</p>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 pt-1">
          <Button
            onClick={onConfirm}
            disabled={publishing || (validation !== null && !validation.valid)}
            className="px-5 py-2.5 text-sm"
          >
            {publishing ? 'Publishing…' : 'Publish'}
          </Button>
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={publishing}
            className="px-4 py-2.5 text-sm"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PortfolioEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()

  // Server state (persisted)
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [masterProfile, setMasterProfile] = useState<RendererProfile | null>(null)

  // Local draft state (drives preview + dirty detection)
  const [localPortfolio, setLocalPortfolio] = useState<Portfolio | null>(null)
  const [localOverrides, setLocalOverrides] = useState<PortfolioOverrides>(defaultOverrides())
  const [localSelections, setLocalSelections] = useState<PortfolioSelections>(defaultSelections())

  // UI state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<EditorTab>('content')
  const [mobileView, setMobileView] = useState<'controls' | 'preview'>('controls')
  const [viewport, setViewport] = useState<ViewportMode>('desktop')
  const [saving, setSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  // Publish UI state
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishValidation, setPublishValidation] = useState<PublishValidationResult | null>(null)

  // Settings form state (separate so SEO/name changes don't thrash the preview)
  const [portfolioName, setPortfolioName] = useState('')
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [settingsDirty, setSettingsDirty] = useState(false)

  // ── Load editor data on mount ─────────────────────────────────────────────

  useEffect(() => {
    if (!id) return
    void loadEditor()
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadEditor() {
    try {
      setLoading(true)
      const res = await api.get<EditorBundle>(`/api/portfolios/${id}/editor`)
      setPortfolio(res.portfolio)
      setMasterProfile(res.masterProfile)
      setLocalPortfolio(res.portfolio)
      setLocalOverrides(res.portfolio.overrides ?? defaultOverrides())
      setLocalSelections(res.portfolio.selections ?? defaultSelections())
      setPortfolioName(res.portfolio.name)
      setSeoTitle(res.portfolio.seo?.title ?? '')
      setSeoDescription(res.portfolio.seo?.description ?? '')
      setIsDirty(false)
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        navigate('/portfolio', { replace: true })
      } else {
        setError(err instanceof ApiError ? err.message : 'Failed to load editor.')
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Unsaved changes protection ─────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty || settingsDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty, settingsDirty])

  // ── Live preview: computed from local state ───────────────────────────────

  const resolvedProfile = masterProfile && localPortfolio
    ? resolveForPreview(masterProfile, localOverrides, localSelections)
    : null

  const previewPortfolio = localPortfolio

  // ── Mark dirty helpers ────────────────────────────────────────────────────

  function markDirty() { setIsDirty(true) }

  // ── Override handlers ─────────────────────────────────────────────────────

  function setOverrideField<K extends keyof PortfolioOverrides>(
    key: K, value: PortfolioOverrides[K] | null
  ) {
    setLocalOverrides((prev) => {
      const next = { ...prev }
      if (value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
        delete next[key]
      } else {
        next[key] = value as PortfolioOverrides[K]
      }
      return next
    })
    markDirty()
  }

  // ── Selection helpers ─────────────────────────────────────────────────────

  function toggleSelection(
    key: keyof PortfolioSelections,
    entryId: string,
    selected: boolean
  ) {
    setLocalSelections((prev) => {
      const arr = prev[key] as string[]
      const next = selected ? [...arr, entryId] : arr.filter((id) => id !== entryId)
      return { ...prev, [key]: next }
    })
    markDirty()
  }

  function selectAll(key: keyof PortfolioSelections) {
    if (!masterProfile) return
    const all: Record<keyof PortfolioSelections, string[]> = {
      featuredProjects: masterProfile.projects.map((p) => p._id),
      visibleExperience: masterProfile.experience.map((e) => e._id),
      visibleEducation: masterProfile.education.map((e) => e._id),
      visibleCertifications: masterProfile.certifications.map((c) => c._id),
    }
    setLocalSelections((prev) => ({ ...prev, [key]: all[key] }))
    markDirty()
  }

  function clearSelection(key: keyof PortfolioSelections) {
    setLocalSelections((prev) => ({ ...prev, [key]: [] }))
    markDirty()
  }

  // ── Section handlers ──────────────────────────────────────────────────────

  function toggleSection(type: SectionType) {
    if (!localPortfolio) return
    setLocalPortfolio({
      ...localPortfolio,
      sections: localPortfolio.sections.map((s) =>
        s.type === type ? { ...s, visible: !s.visible } : s
      ),
    })
    markDirty()
  }

  function moveSectionUp(type: SectionType) {
    if (!localPortfolio) return
    const sorted = [...localPortfolio.sections].sort((a, b) => a.order - b.order)
    const idx = sorted.findIndex((s) => s.type === type)
    if (idx <= 0) return
    const updated = sorted.map((s, i) => {
      if (i === idx)     return { ...s, order: sorted[idx - 1]!.order }
      if (i === idx - 1) return { ...s, order: sorted[idx]!.order }
      return s
    })
    setLocalPortfolio({ ...localPortfolio, sections: updated })
    markDirty()
  }

  function moveSectionDown(type: SectionType) {
    if (!localPortfolio) return
    const sorted = [...localPortfolio.sections].sort((a, b) => a.order - b.order)
    const idx = sorted.findIndex((s) => s.type === type)
    if (idx >= sorted.length - 1) return
    const updated = sorted.map((s, i) => {
      if (i === idx)     return { ...s, order: sorted[idx + 1]!.order }
      if (i === idx + 1) return { ...s, order: sorted[idx]!.order }
      return s
    })
    setLocalPortfolio({ ...localPortfolio, sections: updated })
    markDirty()
  }

  /**
   * Called by Reorder.Group when the user finishes a drag gesture.
   * `reordered` is the full sections array in its new order.
   * We reassign `order` values (1-based) from the new array position.
   * This is the same ordering scheme the existing PATCH /sections endpoint uses.
   */
  function reorderSections(reordered: typeof sortedSections) {
    if (!localPortfolio) return
    const updated = reordered.map((s, i) => ({ ...s, order: i + 1 }))
    setLocalPortfolio({ ...localPortfolio, sections: updated })
    markDirty()
  }

  // ── Design handlers ───────────────────────────────────────────────────────

  async function handleTemplateChange(template: Portfolio['template']) {
    if (!localPortfolio) return
    setLocalPortfolio({ ...localPortfolio, template })
    markDirty()
    // Template change is auto-saved immediately (cheap, no snapshot)
    try {
      const res = await api.patch<{ portfolio: Portfolio }>(`/api/portfolios/${id}/template`, { template })
      setPortfolio(res.portfolio)
      setLocalPortfolio((prev) => prev ? { ...prev, ...res.portfolio } : res.portfolio)
      toast.show(`Template: ${TEMPLATE_LABELS[template]}`)
    } catch (err) {
      toast.show(err instanceof ApiError ? err.message : 'Failed to update template.', 'error')
    }
  }

  function handleThemeChange<K extends keyof PortfolioTheme>(key: K, value: PortfolioTheme[K]) {
    if (!localPortfolio) return
    setLocalPortfolio({
      ...localPortfolio,
      theme: { ...localPortfolio.theme, [key]: value },
    })
    markDirty()
  }

  // ── Save all draft changes ─────────────────────────────────────────────────

  async function handleSave() {
    if (!localPortfolio) return
    setSaving(true)
    try {
      // Save in parallel where possible: overrides, selections, sections, theme
      const [overridesRes, selectionsRes, sectionsRes, themeRes] = await Promise.all([
        api.patch<{ portfolio: Portfolio }>(`/api/portfolios/${id}/overrides`, localOverrides),
        api.patch<{ portfolio: Portfolio; warnings: string[] }>(`/api/portfolios/${id}/selections`, localSelections),
        api.patch<{ portfolio: Portfolio }>(`/api/portfolios/${id}/sections`, {
          sections: localPortfolio.sections,
        }),
        api.patch<{ portfolio: Portfolio }>(`/api/portfolios/${id}/theme`, localPortfolio.theme),
      ])

      // Use the most recent snapshot (all return the same portfolio)
      const saved = themeRes.portfolio
      setPortfolio(saved)
      setLocalPortfolio(saved)
      setLocalOverrides(saved.overrides ?? defaultOverrides())
      setLocalSelections(saved.selections ?? defaultSelections())
      setIsDirty(false)

      if (selectionsRes.warnings.length > 0) {
        toast.show(`Saved. Note: ${selectionsRes.warnings[0]}`, 'error')
      } else {
        toast.show('Draft saved.')
      }

      // Report unused result to satisfy linter
      void overridesRes
      void sectionsRes

    } catch (err) {
      toast.show(err instanceof ApiError ? err.message : 'Failed to save.', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Save settings separately (name/SEO)
  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api.patch<{ portfolio: Portfolio }>(`/api/portfolios/${id}`, {
        name: portfolioName.trim() || localPortfolio?.name,
        seo: { title: seoTitle.trim(), description: seoDescription.trim() },
      })
      setPortfolio(res.portfolio)
      setLocalPortfolio((prev) => prev ? { ...prev, name: res.portfolio.name, seo: res.portfolio.seo } : res.portfolio)
      setSettingsDirty(false)
      toast.show('Settings saved.')
    } catch (err) {
      toast.show(err instanceof ApiError ? err.message : 'Failed to save settings.', 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── Publish flow ──────────────────────────────────────────────────────────

  async function handlePublishClick() {
    if (!id) return
    // Save any unsaved changes first
    if (isDirty) await handleSave()
    // Pre-validate
    try {
      const res = await api.get<PublishValidationResult>(`/api/portfolios/${id}/publish/validate`)
      setPublishValidation(res)
      setShowPublishModal(true)
    } catch (err) {
      toast.show(err instanceof ApiError ? err.message : 'Validation failed.', 'error')
    }
  }

  async function handleConfirmPublish() {
    if (!id) return
    setPublishing(true)
    try {
      const res = await api.post<{ portfolio: Portfolio; publishedAt: string }>(
        `/api/portfolios/${id}/publish`,
        {}
      )
      setPortfolio(res.portfolio)
      setLocalPortfolio(res.portfolio)
      setIsDirty(false)
      setShowPublishModal(false)
      toast.show('Portfolio published!')
    } catch (err) {
      if (err instanceof ApiError) {
        toast.show(err.message, 'error')
        setPublishValidation({
          valid: false,
          errors: [err.message],
          warnings: publishValidation?.warnings ?? [],
        })
      } else {
        toast.show('Publish failed.', 'error')
        setShowPublishModal(false)
      }
    } finally {
      setPublishing(false)
    }
  }

  // Phase 7+8: Unpublish with styled modal
  const [showUnpublishModal, setShowUnpublishModal] = useState(false)
  async function handleUnpublish() {
    if (!id || !localPortfolio) return
    setShowUnpublishModal(false)
    setSaving(true)
    try {
      const res = await api.post<{ portfolio: Portfolio }>(`/api/portfolios/${id}/unpublish`, {})
      setPortfolio(res.portfolio)
      setLocalPortfolio(res.portfolio)
      toast.show('Portfolio unpublished. The public URL is no longer active.')
    } catch (err) {
      toast.show(err instanceof ApiError ? err.message : 'Failed to unpublish.', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Phase 7+8: Copy public URL to clipboard with visual feedback
  const [copyState, setCopyState] = useState<CopyState>('idle')

  function getPublicUrl(): string {
    return `${window.location.origin}/p/${localPortfolio?.slug ?? ''}`
  }

  async function handleCopyPublicUrl() {
    try {
      await navigator.clipboard.writeText(getPublicUrl())
      setCopyState('copied')
      toast.show('Public URL copied to clipboard.')
      setTimeout(() => setCopyState('idle'), 2000)
    } catch {
      setCopyState('failed')
      toast.show('Could not copy — use the link below to copy manually.', 'error')
      setTimeout(() => setCopyState('idle'), 2000)
    }
  }

  async function handleSharePublicUrl() {
    const url = getPublicUrl()
    if (navigator.share) {
      try {
        await navigator.share({ title: localPortfolio?.name ?? 'Portfolio', url })
      } catch {
        // User cancelled share — no error needed
      }
    } else {
      void handleCopyPublicUrl()
    }
  }

  // ── Viewport widths ───────────────────────────────────────────────────────

  const viewportWidths: Record<ViewportMode, string> = {
    desktop: '100%',
    tablet:  '768px',
    mobile:  '375px',
  }

  // ── Status badge ──────────────────────────────────────────────────────────

  function StatusBadge() {
    if (saving) {
      return <span className="text-xs text-muted animate-pulse">Saving…</span>
    }
    if (isDirty || settingsDirty) {
      return (
        <span className="text-xs font-semibold text-[#7a5c00] flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#b8860b]" aria-hidden="true" />
          Unsaved changes
        </span>
      )
    }
    if (localPortfolio?.status === 'published') {
      const hasUnpublishedDraft = localPortfolio.updatedAt > (localPortfolio.lastPublishedAt ?? '')
      return hasUnpublishedDraft ? (
        <span className="text-xs font-semibold text-muted flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-muted" aria-hidden="true" />
          Unpublished changes
        </span>
      ) : (
        <span className="text-xs font-semibold text-pine flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-pine" aria-hidden="true" />
          Published
        </span>
      )
    }
    return (
      <span className="text-xs text-muted">Draft</span>
    )
  }

  // ── Loading / error ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <AppLayout>
        <div className="flex min-h-[calc(100vh-72px)] items-center justify-center">
          <p className="font-display text-xl text-pine animate-pulse">Loading editor…</p>
        </div>
      </AppLayout>
    )
  }

  if (error || !localPortfolio) {
    return (
      <AppLayout>
        <div className="section-shell py-16 text-center">
          <p className="text-sm text-red-700 font-semibold mb-4">{error || 'Portfolio not found.'}</p>
          <Link to="/portfolio">
            <Button variant="secondary" className="px-4 py-2 text-xs">← Back</Button>
          </Link>
        </div>
      </AppLayout>
    )
  }

  const sortedSections = [...localPortfolio.sections].sort((a, b) => a.order - b.order)

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      {/* ── Top Editor Bar ─────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-paper px-4 py-3 sm:px-6"
        aria-label="Portfolio editor toolbar"
      >
        {/* Left: back + name */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/portfolio"
            className="shrink-0 text-xs font-bold text-muted hover:text-pine focus-visible:outline focus-visible:outline-2 focus-visible:outline-pine rounded"
            aria-label="Back to portfolios"
          >
            ←
          </Link>
          <div className="min-w-0">
            <h1 className="font-display text-base sm:text-lg tracking-[-0.02em] text-ink truncate">
              {localPortfolio.name}
            </h1>
            <div className="mt-0.5">
              <StatusBadge />
            </div>
          </div>
        </div>

        {/* Right: viewport + preview + save + publish */}
        <div className="flex shrink-0 items-center gap-2">
          {/* Viewport switcher — desktop only */}
          <div className="hidden sm:flex items-center rounded-[var(--radius-control)] border border-line overflow-hidden">
            {(['desktop', 'tablet', 'mobile'] as ViewportMode[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setViewport(v)}
                className={[
                  'px-2.5 py-1.5 text-[11px] font-bold capitalize transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-pine',
                  viewport === v
                    ? 'bg-pine text-white'
                    : 'text-muted hover:text-ink bg-paper',
                ].join(' ')}
                aria-pressed={viewport === v}
              >
                {v === 'desktop' ? '⬛' : v === 'tablet' ? '▭' : '▮'}
                <span className="sr-only">{v} preview</span>
              </button>
            ))}
          </div>

          <Link
            to={`/portfolio/${id}/preview`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center rounded-[var(--radius-control)] border border-line bg-paper px-3 py-1.5 text-xs font-bold text-muted hover:text-ink transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-pine"
          >
            Preview ↗
          </Link>

          <Button
            variant="secondary"
            onClick={() => void handleSave()}
            disabled={saving || (!isDirty && !settingsDirty)}
            className="px-3.5 py-1.5 text-xs"
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>

          <Button
            onClick={() => void handlePublishClick()}
            disabled={saving || publishing}
            className="px-3.5 py-1.5 text-xs"
          >
            Publish
          </Button>
        </div>
      </header>

      {/* ── Mobile: edit/preview toggle ───────────────────────────────── */}
      <div className="flex items-center gap-0.5 border-b border-line bg-paper px-4 py-2 lg:hidden">
        {(['controls', 'preview'] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setMobileView(v)}
            className={[
              'rounded-[var(--radius-control)] px-3 py-1.5 text-xs font-bold capitalize transition-colors',
              mobileView === v ? 'bg-[#edf4f1] text-pine' : 'text-muted hover:text-ink',
            ].join(' ')}
            aria-pressed={mobileView === v}
          >
            {v === 'controls' ? 'Edit' : 'Preview'}
          </button>
        ))}
      </div>

      {/* ── Main editor layout ────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* ── Left: controls panel ─────────────────────────────────────── */}
        <aside
          className={[
            'w-full lg:w-[380px] lg:shrink-0 border-r border-line bg-paper overflow-y-auto flex-col',
            mobileView === 'controls' ? 'flex' : 'hidden lg:flex',
          ].join(' ')}
          aria-label="Editor controls"
        >
          {/* Tab navigation */}
          <nav
            className="sticky top-0 z-10 flex border-b border-line bg-paper px-3 pt-2"
            aria-label="Editor tabs"
          >
            {(['content', 'sections', 'design', 'settings'] as EditorTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={[
                  'px-3 py-2.5 text-xs font-bold capitalize transition-colors border-b-2 -mb-px',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-pine rounded-t',
                  activeTab === tab
                    ? 'border-pine text-pine'
                    : 'border-transparent text-muted hover:text-ink',
                ].join(' ')}
                aria-current={activeTab === tab ? 'page' : undefined}
              >
                {tab}
              </button>
            ))}
          </nav>

          <div className="flex-1 overflow-y-auto p-5 space-y-6">

            {/* ═══ TAB: CONTENT ════════════════════════════════════════ */}
            {activeTab === 'content' && (
              <ContentTab
                portfolio={localPortfolio}
                masterProfile={masterProfile}
                overrides={localOverrides}
                selections={localSelections}
                onOverrideChange={setOverrideField}
                onToggleSelection={toggleSelection}
                onSelectAll={selectAll}
                onClearSelection={clearSelection}
              />
            )}

            {/* ═══ TAB: SECTIONS ═══════════════════════════════════════ */}
            {activeTab === 'sections' && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-ink">
                    Section Visibility & Order
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Drag to reorder. Toggle to show/hide. Preview updates instantly; click Save to persist.
                  </p>
                </div>
                {/*
                 * Reorder.Group provides drag-and-drop reordering.
                 * framer-motion is already a project dependency.
                 * `values` must be the same array reference used by Reorder.Item `value` props.
                 * `onReorder` fires with the new sorted array after each drag.
                 * Arrow buttons remain as keyboard/accessibility fallback.
                 */}
                <Reorder.Group
                  axis="y"
                  values={sortedSections}
                  onReorder={reorderSections}
                  className="space-y-2"
                  aria-label="Portfolio sections — drag to reorder"
                  as="ul"
                >
                  {sortedSections.map((section, idx) => (
                    <Reorder.Item
                      key={section.type}
                      value={section}
                      as="li"
                      className="flex items-center gap-2 rounded-[var(--radius-control)] border border-line bg-paper px-3 py-2.5 cursor-default select-none"
                      /* Subtle lift on drag — within FOLVIRA's "subtle motion" theme */
                      whileDrag={{
                        scale: 1.02,
                        boxShadow: '0 8px 24px rgba(20,30,25,0.12)',
                        zIndex: 10,
                        position: 'relative',
                      }}
                      /* Disable framer-motion layout animation on initial mount */
                      layout="position"
                      transition={{ duration: 0.15 }}
                    >
                      {/* ── Drag handle ──────────────────────────────── */}
                      {/*
                       * The grip dots are the drag trigger area.
                       * aria-hidden="true" on the SVG — the surrounding li's
                       * aria-label from Reorder.Group + the text label describe
                       * the item. Screen readers use the arrow buttons for reorder.
                       */}
                      <span
                        className="shrink-0 cursor-grab active:cursor-grabbing touch-none text-muted hover:text-ink transition-colors"
                        aria-hidden="true"
                        title="Drag to reorder"
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                          <circle cx="4" cy="3" r="1.2" />
                          <circle cx="4" cy="7" r="1.2" />
                          <circle cx="4" cy="11" r="1.2" />
                          <circle cx="10" cy="3" r="1.2" />
                          <circle cx="10" cy="7" r="1.2" />
                          <circle cx="10" cy="11" r="1.2" />
                        </svg>
                      </span>

                      {/* ── Visibility toggle ─────────────────────────── */}
                      <Toggle
                        checked={section.visible}
                        onChange={() => toggleSection(section.type)}
                        label={`${section.visible ? 'Hide' : 'Show'} ${SECTION_LABELS[section.type]}`}
                      />

                      {/* ── Section label ─────────────────────────────── */}
                      <span className={`flex-1 text-xs font-semibold ${section.visible ? 'text-ink' : 'text-muted'}`}>
                        {SECTION_LABELS[section.type]}
                      </span>

                      {/* ── Arrow buttons (keyboard / accessibility fallback) ── */}
                      <div className="flex gap-0.5" aria-label={`Reorder ${SECTION_LABELS[section.type]}`}>
                        <button
                          type="button"
                          onClick={() => moveSectionUp(section.type)}
                          disabled={idx === 0}
                          aria-label={`Move ${SECTION_LABELS[section.type]} up`}
                          className="rounded p-1 text-muted hover:text-ink disabled:opacity-30 focus-visible:outline focus-visible:outline-1 focus-visible:outline-pine"
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
                            <path d="M6 2L10 8H2Z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSectionDown(section.type)}
                          disabled={idx === sortedSections.length - 1}
                          aria-label={`Move ${SECTION_LABELS[section.type]} down`}
                          className="rounded p-1 text-muted hover:text-ink disabled:opacity-30 focus-visible:outline focus-visible:outline-1 focus-visible:outline-pine"
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
                            <path d="M6 10L2 4H10Z" />
                          </svg>
                        </button>
                      </div>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              </div>
            )}

            {/* ═══ TAB: DESIGN ═════════════════════════════════════════ */}
            {activeTab === 'design' && (
              <DesignTab
                portfolio={localPortfolio}
                onTemplateChange={(t) => void handleTemplateChange(t)}
                onThemeChange={handleThemeChange}
                saving={saving}
              />
            )}

            {/* ═══ TAB: SETTINGS ═══════════════════════════════════════ */}
            {activeTab === 'settings' && (
              <form onSubmit={(e) => void handleSaveSettings(e)} className="space-y-5">
                <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-ink">Portfolio Settings</p>

                <div>
                  <label htmlFor="p-name" className="block text-xs font-bold uppercase tracking-[0.06em] text-muted mb-1">
                    Portfolio Name
                  </label>
                  <input
                    id="p-name"
                    type="text"
                    maxLength={100}
                    value={portfolioName}
                    onChange={(e) => { setPortfolioName(e.target.value); setSettingsDirty(true) }}
                    className="w-full rounded-[var(--radius-control)] border border-line bg-paper px-3.5 py-2 text-sm text-ink outline-none focus:border-pine"
                  />
                </div>

                <div>
                  <label htmlFor="seo-title" className="block text-xs font-bold uppercase tracking-[0.06em] text-muted mb-1">
                    SEO Title <span className="font-normal text-muted/60">(max 100)</span>
                  </label>
                  <input
                    id="seo-title"
                    type="text"
                    maxLength={100}
                    value={seoTitle}
                    onChange={(e) => { setSeoTitle(e.target.value); setSettingsDirty(true) }}
                    className="w-full rounded-[var(--radius-control)] border border-line bg-paper px-3.5 py-2 text-sm text-ink outline-none focus:border-pine"
                  />
                </div>

                <div>
                  <label htmlFor="seo-desc" className="block text-xs font-bold uppercase tracking-[0.06em] text-muted mb-1">
                    SEO Description <span className="font-normal text-muted/60">(max 300)</span>
                  </label>
                  <textarea
                    id="seo-desc"
                    maxLength={300}
                    rows={3}
                    value={seoDescription}
                    onChange={(e) => { setSeoDescription(e.target.value); setSettingsDirty(true) }}
                    className="w-full rounded-[var(--radius-control)] border border-line bg-paper px-3.5 py-2 text-sm text-ink outline-none focus:border-pine resize-none"
                  />
                  <p className="mt-1 text-[10px] text-muted">{seoDescription.length}/300</p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.06em] text-muted mb-1">Slug</p>
                  <p className="font-mono text-xs text-muted bg-[#f1eee6] rounded-[var(--radius-control)] px-3 py-2 break-all">
                    {localPortfolio.slug}
                  </p>
                </div>

                {localPortfolio.lastPublishedAt && (
                  <div className="rounded-[var(--radius-control)] border border-pine/20 bg-[#f4faf7] px-3 py-2 space-y-2">
                    <p className="text-xs font-semibold text-pine">
                      Last published:{' '}
                      {new Date(localPortfolio.lastPublishedAt).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                    {/* Phase 7: Public URL share */}
                    {localPortfolio.status === 'published' && (
                      <div className="space-y-1.5 border-t border-pine/15 pt-2">
                        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-pine">
                          Public URL
                        </p>
                        <div className="flex items-center gap-2">
                          <a
                            href={getPublicUrl()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 truncate font-mono text-[10px] text-pine hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-pine"
                            aria-label={`Open public portfolio at ${getPublicUrl()}`}
                          >
                            {getPublicUrl()}
                          </a>
                          <button
                            type="button"
                            onClick={() => void handleCopyPublicUrl()}
                            className={[
                              'shrink-0 rounded-[var(--radius-control)] border px-2 py-0.5 text-[10px] font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-pine',
                              copyState === 'copied'
                                ? 'border-pine bg-pine/10 text-pine'
                                : copyState === 'failed'
                                  ? 'border-[#b83232]/30 text-[#b83232]'
                                  : 'border-pine/30 text-pine hover:bg-pine/10',
                            ].join(' ')}
                            aria-label="Copy public URL to clipboard"
                            aria-live="polite"
                          >
                            {copyState === 'copied' ? '✓ Copied' : copyState === 'failed' ? 'Failed' : 'Copy'}
                          </button>
                          {typeof navigator.share === 'function' && (
                            <button
                              type="button"
                              onClick={() => void handleSharePublicUrl()}
                              className="shrink-0 rounded-[var(--radius-control)] border border-pine/30 px-2 py-0.5 text-[10px] font-bold text-pine hover:bg-pine/10 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-pine"
                              aria-label="Share public URL"
                            >
                              Share
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Phase 7+8: Unpublish button with styled modal */}
                {localPortfolio.status === 'published' && (
                  <div className="border-t border-line pt-4">
                    <button
                      type="button"
                      onClick={() => setShowUnpublishModal(true)}
                      disabled={saving}
                      className="w-full rounded-[var(--radius-control)] border border-[#b83232]/30 px-4 py-2 text-xs font-bold text-[#b83232] hover:border-[#b83232] hover:bg-[#fdf1f1] transition disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-pine"
                    >
                      Unpublish Portfolio
                    </button>
                    <p className="mt-1 text-[10px] text-muted">
                      The public URL will stop working. Your draft is preserved.
                    </p>
                  </div>
                )}

                <Button type="submit" disabled={saving || !settingsDirty} className="w-full py-2 text-xs">
                  {saving ? 'Saving…' : 'Save Settings'}
                </Button>
              </form>
            )}

          </div>
        </aside>

        {/* ── Right: live preview ───────────────────────────────────────── */}
        <div
          className={[
            'flex-1 flex flex-col min-w-0 bg-[#f0ede8]',
            mobileView === 'preview' ? 'flex' : 'hidden lg:flex',
          ].join(' ')}
        >
          {/* Preview container with viewport sizing */}
          <div className="flex-1 overflow-auto p-4 sm:p-6 flex justify-center">
            <div
              className="bg-paper shadow-soft overflow-x-hidden transition-all duration-300"
              style={{
                width: viewportWidths[viewport],
                maxWidth: '100%',
                minHeight: '100%',
              }}
            >
              {previewPortfolio && resolvedProfile ? (
                <PortfolioRenderer
                  portfolio={previewPortfolio}
                  profile={resolvedProfile}
                />
              ) : (
                <div className="flex min-h-[400px] items-center justify-center p-8 text-center">
                  <div>
                    <p className="text-sm font-semibold text-muted">
                      Add information to your{' '}
                      <Link to="/profile" className="text-pine font-bold hover:underline">Profile</Link>{' '}
                      to see a preview here.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ── Toast ─────────────────────────────────────────────────────── */}
      {toast.message && (
        <div
          role="status"
          aria-live="polite"
          className={[
            'fixed bottom-6 right-6 z-50 rounded-card border px-5 py-3 shadow-lift text-sm font-bold flex items-center gap-2',
            toast.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-pine/30 bg-paper text-pine',
          ].join(' ')}
        >
          <span
            className={`h-2 w-2 rounded-full animate-ping ${toast.type === 'error' ? 'bg-red-500' : 'bg-pine'}`}
            aria-hidden="true"
          />
          {toast.message}
        </div>
      )}

      {/* ── Unsaved changes nav warning ───────────────────────────────── */}
      {(isDirty || settingsDirty) && (
        <div
          role="alert"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 rounded-card border border-[#b8860b]/30 bg-[#fdf8ed] px-5 py-2.5 shadow-lift text-xs font-semibold text-[#7a5c00] flex items-center gap-3"
        >
          Unsaved changes
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="font-bold text-pine hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-pine"
          >
            Save now
          </button>
        </div>
      )}

      {/* ── Publish modal ─────────────────────────────────────────────── */}
      {showPublishModal && (
        <PublishModal
          onConfirm={() => void handleConfirmPublish()}
          onCancel={() => setShowPublishModal(false)}
          publishing={publishing}
          validation={publishValidation}
        />
      )}

      {/* Phase 8: Unpublish confirmation modal */}
      {showUnpublishModal && (
        <ConfirmModal
          title="Unpublish Portfolio?"
          description="Are you sure you want to unpublish this portfolio? The public URL will immediately stop working, but your portfolio data and draft will remain safely preserved in your account."
          confirmLabel="Unpublish"
          cancelLabel="Keep Published"
          variant="danger"
          loading={saving}
          onConfirm={() => void handleUnpublish()}
          onCancel={() => setShowUnpublishModal(false)}
        />
      )}
    </div>
  )
}

// ─── Content Tab component ────────────────────────────────────────────────────

interface ContentTabProps {
  portfolio: Portfolio
  masterProfile: RendererProfile | null
  overrides: PortfolioOverrides
  selections: PortfolioSelections
  onOverrideChange: <K extends keyof PortfolioOverrides>(key: K, value: PortfolioOverrides[K] | null) => void
  onToggleSelection: (key: keyof PortfolioSelections, id: string, selected: boolean) => void
  onSelectAll: (key: keyof PortfolioSelections) => void
  onClearSelection: (key: keyof PortfolioSelections) => void
}

function ContentTab({
  masterProfile, overrides, selections,
  onOverrideChange, onToggleSelection, onSelectAll, onClearSelection,
}: ContentTabProps) {
  if (!masterProfile) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-muted">Loading profile data…</p>
      </div>
    )
  }

  return (
    <div className="space-y-7">
      <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-ink">
        Portfolio Content
      </p>

      {/* ─ Headline override ─ */}
      <OverrideField
        label="Headline"
        masterValue={masterProfile.headline ?? ''}
        overrideValue={overrides.headline}
        placeholder={masterProfile.headline ?? 'No headline in profile'}
        maxLength={300}
        onSet={(v) => onOverrideChange('headline', v || null)}
        onReset={() => onOverrideChange('headline', null)}
      />

      {/* ─ About override ─ */}
      <OverrideField
        label="About / Bio"
        masterValue={masterProfile.about ?? ''}
        overrideValue={overrides.about}
        placeholder={masterProfile.about ?? 'No about section in profile'}
        maxLength={10000}
        multiline
        onSet={(v) => onOverrideChange('about', v || null)}
        onReset={() => onOverrideChange('about', null)}
      />

      {/* ─ Location override ─ */}
      <OverrideField
        label="Location"
        masterValue={masterProfile.location ?? ''}
        overrideValue={overrides.location}
        placeholder={masterProfile.location ?? 'No location in profile'}
        maxLength={200}
        onSet={(v) => onOverrideChange('location', v || null)}
        onReset={() => onOverrideChange('location', null)}
      />

      {/* ─ Website override ─ */}
      <OverrideField
        label="Website"
        masterValue={masterProfile.website ?? ''}
        overrideValue={overrides.website}
        placeholder={masterProfile.website ?? 'No website in profile'}
        maxLength={500}
        onSet={(v) => onOverrideChange('website', v || null)}
        onReset={() => onOverrideChange('website', null)}
      />

      {/* ─ Projects selection ─ */}
      {masterProfile.projects.length > 0 && (
        <SelectionGroup
          label="Featured Projects"
          description="Choose which projects appear. Empty = show all."
          items={masterProfile.projects.map((p) => ({
            id: p._id,
            label: p.name,
            sub: p.technologies.slice(0, 3).join(', '),
          }))}
          selected={selections.featuredProjects}
          onToggle={(id, sel) => onToggleSelection('featuredProjects', id, sel)}
          onSelectAll={() => onSelectAll('featuredProjects')}
          onClear={() => onClearSelection('featuredProjects')}
        />
      )}

      {/* ─ Experience selection ─ */}
      {masterProfile.experience.length > 0 && (
        <SelectionGroup
          label="Visible Experience"
          description="Choose which experience entries appear. Empty = show all."
          items={masterProfile.experience.map((e) => ({
            id: e._id,
            label: e.title,
            sub: e.company,
          }))}
          selected={selections.visibleExperience}
          onToggle={(id, sel) => onToggleSelection('visibleExperience', id, sel)}
          onSelectAll={() => onSelectAll('visibleExperience')}
          onClear={() => onClearSelection('visibleExperience')}
        />
      )}

      {/* ─ Education selection ─ */}
      {masterProfile.education.length > 0 && (
        <SelectionGroup
          label="Visible Education"
          description="Choose which education entries appear. Empty = show all."
          items={masterProfile.education.map((e) => ({
            id: e._id,
            label: e.institution,
            sub: [e.degree, e.field].filter(Boolean).join(' in '),
          }))}
          selected={selections.visibleEducation}
          onToggle={(id, sel) => onToggleSelection('visibleEducation', id, sel)}
          onSelectAll={() => onSelectAll('visibleEducation')}
          onClear={() => onClearSelection('visibleEducation')}
        />
      )}

      {/* ─ Certifications selection ─ */}
      {masterProfile.certifications.length > 0 && (
        <SelectionGroup
          label="Visible Certifications"
          description="Choose which certifications appear. Empty = show all."
          items={masterProfile.certifications.map((c) => ({
            id: c._id,
            label: c.name,
            sub: c.issuer,
          }))}
          selected={selections.visibleCertifications}
          onToggle={(id, sel) => onToggleSelection('visibleCertifications', id, sel)}
          onSelectAll={() => onSelectAll('visibleCertifications')}
          onClear={() => onClearSelection('visibleCertifications')}
        />
      )}

      {masterProfile.projects.length === 0 &&
       masterProfile.experience.length === 0 &&
       masterProfile.education.length === 0 &&
       masterProfile.certifications.length === 0 && (
        <div className="rounded-card border border-line bg-[#fffdf9] p-5 text-center">
          <p className="text-sm text-muted">
            Add projects, experience, education and certifications to your{' '}
            <Link to="/profile" className="text-pine font-bold hover:underline">Profile</Link>{' '}
            to configure selections here.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── OverrideField component ──────────────────────────────────────────────────

interface OverrideFieldProps {
  label: string
  masterValue: string
  overrideValue: string | undefined
  placeholder: string
  maxLength: number
  multiline?: boolean
  onSet: (value: string) => void
  onReset: () => void
}

function OverrideField({
  label, masterValue, overrideValue, placeholder, maxLength, multiline, onSet, onReset,
}: OverrideFieldProps) {
  const isCustomized = overrideValue !== undefined
  const [mode, setMode] = useState<'master' | 'custom'>(isCustomized ? 'custom' : 'master')
  const [localValue, setLocalValue] = useState(overrideValue ?? masterValue)

  // Sync when overrideValue changes externally (e.g. on save)
  useEffect(() => {
    if (overrideValue !== undefined) {
      setMode('custom')
      setLocalValue(overrideValue)
    } else {
      setMode('master')
      setLocalValue(masterValue)
    }
  }, [overrideValue, masterValue])

  function handleModeChange(newMode: 'master' | 'custom') {
    setMode(newMode)
    if (newMode === 'master') {
      onReset()
      setLocalValue(masterValue)
    } else {
      setLocalValue(overrideValue ?? masterValue)
    }
  }

  function handleValueChange(v: string) {
    setLocalValue(v)
    onSet(v)
  }

  const inputClass = 'w-full rounded-[var(--radius-control)] border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine transition'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.06em] text-muted">{label}</p>
        <div className="flex items-center rounded-[var(--radius-control)] border border-line overflow-hidden">
          <button
            type="button"
            onClick={() => handleModeChange('master')}
            className={[
              'px-2.5 py-1 text-[10px] font-bold transition-colors',
              mode === 'master' ? 'bg-pine text-white' : 'bg-paper text-muted hover:text-ink',
            ].join(' ')}
          >
            Master
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('custom')}
            className={[
              'px-2.5 py-1 text-[10px] font-bold transition-colors',
              mode === 'custom' ? 'bg-pine text-white' : 'bg-paper text-muted hover:text-ink',
            ].join(' ')}
          >
            Custom
          </button>
        </div>
      </div>

      {mode === 'master' ? (
        <div className="rounded-[var(--radius-control)] border border-line bg-[#f1eee6] px-3 py-2 text-sm text-muted">
          {masterValue || <span className="italic">—</span>}
        </div>
      ) : multiline ? (
        <textarea
          rows={4}
          maxLength={maxLength}
          value={localValue}
          onChange={(e) => handleValueChange(e.target.value)}
          placeholder={placeholder}
          className={`${inputClass} resize-y`}
          aria-label={`Custom ${label}`}
        />
      ) : (
        <input
          type="text"
          maxLength={maxLength}
          value={localValue}
          onChange={(e) => handleValueChange(e.target.value)}
          placeholder={placeholder}
          className={inputClass}
          aria-label={`Custom ${label}`}
        />
      )}

      {mode === 'custom' && (
        <p className="text-[10px] text-muted">
          Custom value — affects only this portfolio.{' '}
          <button
            type="button"
            onClick={() => handleModeChange('master')}
            className="font-bold text-pine hover:underline"
          >
            Reset to master profile
          </button>
        </p>
      )}
    </div>
  )
}

// ─── SelectionGroup component ─────────────────────────────────────────────────

interface SelectionGroupProps {
  label: string
  description: string
  items: Array<{ id: string; label: string; sub?: string }>
  selected: string[]
  onToggle: (id: string, selected: boolean) => void
  onSelectAll: () => void
  onClear: () => void
}

function SelectionGroup({
  label, description, items, selected, onToggle, onSelectAll, onClear,
}: SelectionGroupProps) {
  const selectedSet = new Set(selected)
  const allSelected = items.length > 0 && items.every((item) => selectedSet.has(item.id))
  const noneSelected = selected.length === 0

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.06em] text-muted">{label}</p>
          <p className="text-[10px] text-muted">{description}</p>
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            type="button"
            onClick={onSelectAll}
            disabled={allSelected}
            className="text-[10px] font-bold text-pine hover:underline disabled:opacity-40"
          >
            All
          </button>
          <span className="text-[10px] text-muted">/</span>
          <button
            type="button"
            onClick={onClear}
            disabled={noneSelected}
            className="text-[10px] font-bold text-muted hover:text-ink disabled:opacity-40"
          >
            None
          </button>
        </div>
      </div>

      {noneSelected && (
        <p className="text-[10px] text-pine font-semibold">
          Showing all {items.length} {label.toLowerCase()}
        </p>
      )}

      <ul className="space-y-1.5">
        {items.map((item) => {
          const checked = selectedSet.has(item.id) || noneSelected
          const isExplicitlySelected = selectedSet.has(item.id)
          return (
            <li key={item.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`sel-${item.id}`}
                checked={isExplicitlySelected || noneSelected}
                disabled={noneSelected}
                onChange={(e) => {
                  if (noneSelected) {
                    // First selection: select all then deselect this one
                    onSelectAll()
                    if (!e.target.checked) onToggle(item.id, false)
                  } else {
                    onToggle(item.id, e.target.checked)
                  }
                }}
                className="h-3.5 w-3.5 rounded accent-pine"
              />
              <label
                htmlFor={`sel-${item.id}`}
                className={`flex-1 text-xs cursor-pointer ${checked ? 'text-ink' : 'text-muted'}`}
              >
                <span className="font-semibold">{item.label}</span>
                {item.sub && <span className="ml-1 text-muted">· {item.sub}</span>}
              </label>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// ─── Design Tab component ─────────────────────────────────────────────────────

interface DesignTabProps {
  portfolio: Portfolio
  onTemplateChange: (t: Portfolio['template']) => void
  onThemeChange: <K extends keyof PortfolioTheme>(key: K, value: PortfolioTheme[K]) => void
  saving: boolean
}

function DesignTab({ portfolio, onTemplateChange, onThemeChange, saving }: DesignTabProps) {
  return (
    <div className="space-y-6">
      {/* Template selector */}
      <div className="space-y-3">
        <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-ink">Template</p>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {(['editorial', 'minimal', 'developer'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onTemplateChange(t)}
              disabled={saving}
              aria-pressed={portfolio.template === t}
              aria-label={`Select ${TEMPLATE_LABELS[t]} template`}
              className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-pine rounded-[0.55rem]"
            >
              <TemplateThumbnail name={t} active={portfolio.template === t} />
            </button>
          ))}
        </div>
        {(['editorial', 'minimal', 'developer'] as const).map((t) => {
          const descriptions = {
            editorial: 'Premium editorial layout with generous whitespace.',
            minimal: 'Clean, restrained design focused on content.',
            developer: 'Technical, project-forward for engineering portfolios.',
          }
          const isActive = portfolio.template === t
          return (
            <button
              key={t}
              type="button"
              onClick={() => onTemplateChange(t)}
              disabled={saving}
              aria-pressed={isActive}
              className={[
                'w-full text-left rounded-card border p-3.5 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-pine',
                isActive ? 'border-pine bg-[#f4faf7]' : 'border-line bg-paper hover:border-pine/40',
              ].join(' ')}
            >
              <div className="flex items-center justify-between">
                <span className={`text-sm font-bold ${isActive ? 'text-pine' : 'text-ink'}`}>{TEMPLATE_LABELS[t]}</span>
                {isActive && <span className="h-2 w-2 rounded-full bg-pine" aria-hidden="true" />}
              </div>
              <p className="mt-0.5 text-xs text-muted">{descriptions[t]}</p>
            </button>
          )
        })}
      </div>

      {/* Accent colour */}
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.06em] text-muted mb-2">Accent</p>
        <div className="grid grid-cols-2 gap-1.5">
          {(['forest', 'charcoal', 'brass', 'slate'] as const).map((accent) => {
            const colors = { forest: '#1e4a40', charcoal: '#2c3430', brass: '#9d602d', slate: '#3a5068' }
            return (
              <button
                key={accent}
                type="button"
                onClick={() => onThemeChange('accent', accent)}
                aria-pressed={portfolio.theme.accent === accent}
                className={[
                  'flex items-center gap-2 rounded-[var(--radius-control)] border px-3 py-1.5 text-xs font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-pine',
                  portfolio.theme.accent === accent ? 'border-pine bg-[#f4faf7] text-pine' : 'border-line bg-paper text-ink hover:border-pine/40',
                ].join(' ')}
              >
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: colors[accent] }} aria-hidden="true" />
                {THEME_ACCENT_LABELS[accent]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Background */}
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.06em] text-muted mb-2">Background</p>
        <div className="grid grid-cols-2 gap-1.5">
          {(['ivory', 'white', 'warm', 'dark'] as const).map((bg) => (
            <button
              key={bg}
              type="button"
              onClick={() => onThemeChange('background', bg)}
              aria-pressed={portfolio.theme.background === bg}
              className={[
                'rounded-[var(--radius-control)] border px-3 py-1.5 text-xs font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-pine',
                portfolio.theme.background === bg ? 'border-pine bg-[#f4faf7] text-pine' : 'border-line bg-paper text-ink hover:border-pine/40',
              ].join(' ')}
            >
              {THEME_BACKGROUND_LABELS[bg]}
            </button>
          ))}
        </div>
      </div>

      {/* Body font */}
      <div>
        <label htmlFor="body-font" className="block text-xs font-bold uppercase tracking-[0.06em] text-muted mb-1">Body Font</label>
        <select
          id="body-font"
          value={portfolio.theme.font}
          onChange={(e) => onThemeChange('font', e.target.value as PortfolioTheme['font'])}
          className="w-full rounded-[var(--radius-control)] border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        >
          {(['inter', 'dm-sans', 'manrope', 'playfair'] as const).map((f) => (
            <option key={f} value={f}>{THEME_FONT_LABELS[f]}</option>
          ))}
        </select>
      </div>

      {/* Heading font */}
      <div>
        <label htmlFor="heading-font" className="block text-xs font-bold uppercase tracking-[0.06em] text-muted mb-1">Heading Font</label>
        <select
          id="heading-font"
          value={portfolio.theme.headingFont}
          onChange={(e) => onThemeChange('headingFont', e.target.value as PortfolioTheme['headingFont'])}
          className="w-full rounded-[var(--radius-control)] border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
        >
          {(['inter', 'dm-sans', 'manrope', 'playfair'] as const).map((f) => (
            <option key={f} value={f}>{THEME_FONT_LABELS[f]}</option>
          ))}
        </select>
      </div>

      {/* Border radius */}
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.06em] text-muted mb-2">Border Radius</p>
        <div className="flex gap-1.5">
          {(['none', 'minimal', 'rounded'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onThemeChange('radius', r)}
              aria-pressed={portfolio.theme.radius === r}
              className={[
                'flex-1 border px-2 py-1.5 text-xs font-semibold capitalize transition-all rounded-[var(--radius-control)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-pine',
                portfolio.theme.radius === r ? 'border-pine bg-[#f4faf7] text-pine' : 'border-line bg-paper text-ink hover:border-pine/40',
              ].join(' ')}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Animation */}
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.06em] text-muted mb-2">Animation</p>
        <div className="flex gap-1.5">
          {(['none', 'subtle', 'moderate'] as const).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => onThemeChange('animation', a)}
              aria-pressed={portfolio.theme.animation === a}
              className={[
                'flex-1 border px-2 py-1.5 text-xs font-semibold capitalize transition-all rounded-[var(--radius-control)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-pine',
                portfolio.theme.animation === a ? 'border-pine bg-[#f4faf7] text-pine' : 'border-line bg-paper text-ink hover:border-pine/40',
              ].join(' ')}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-1">
        <Button
          variant="secondary"
          onClick={() => {
            const keys = ['font', 'headingFont', 'accent', 'background', 'radius', 'animation'] as const
            keys.forEach((k) => onThemeChange(k, DEFAULT_THEME[k] as never))
          }}
          className="w-full py-2 text-xs"
        >
          Reset to Default Theme
        </Button>
      </div>
    </div>
  )
}
