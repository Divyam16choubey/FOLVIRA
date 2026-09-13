/**
 * PortfolioWorkspacePage — Portfolio editor at /portfolio/:id
 *
 * Layout:
 *   Left panel (380px fixed): workspace controls — template, sections, theme, SEO
 *   Right panel: live preview via PortfolioRenderer
 *
 * On mobile the user can toggle between the controls panel and the preview.
 *
 * Security:
 * - No arbitrary HTML/CSS accepted from user.
 * - Template selection restricted to closed enum.
 * - Section types restricted to server-validated enum.
 * - Theme values restricted to predefined allowed values.
 */
import { useEffect, useState, useCallback, useRef } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { AppLayout } from '../../components/layout/AppLayout'
import { Button } from '../../components/common/Button'
import { PortfolioRenderer } from '../../components/portfolio/PortfolioRenderer'
import { TemplateThumbnail } from '../../components/portfolio/TemplateThumbnail'
import { api, ApiError } from '../../lib/api'
import type {
  Portfolio,
  RendererProfile,
  PortfolioTheme,
  SectionType,
} from '../../types/portfolio'
import {
  TEMPLATE_LABELS,
  SECTION_LABELS,
  THEME_ACCENT_LABELS,
  THEME_BACKGROUND_LABELS,
  THEME_FONT_LABELS,
  DEFAULT_THEME,
} from '../../types/portfolio'

// ─── Tab type ─────────────────────────────────────────────────────────────────
type WorkspaceTab = 'template' | 'sections' | 'theme' | 'seo'

// ─── Toast helper ─────────────────────────────────────────────────────────────
function useToast() {
  const [message, setMessage] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const show = useCallback((msg: string) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setMessage(msg)
    timerRef.current = setTimeout(() => setMessage(''), 3500)
  }, [])
  return { message, show }
}

// ─── Page component ───────────────────────────────────────────────────────────
export function PortfolioWorkspacePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()

  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [profile, setProfile] = useState<RendererProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [localPortfolio, setLocalPortfolio] = useState<Portfolio | null>(null)

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('template')
  const [saving, setSaving] = useState(false)

  // Mobile: toggle between 'controls' and 'preview'
  const [mobileView, setMobileView] = useState<'controls' | 'preview'>('controls')

  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [portfolioName, setPortfolioName] = useState('')

  // ── Load portfolio on mount ────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return
    void loadPortfolio()
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadPortfolio() {
    try {
      setLoading(true)
      const res = await api.get<{ portfolio: Portfolio; profile: RendererProfile | null }>(
        `/api/portfolios/${id}`
      )
      setPortfolio(res.portfolio)
      setLocalPortfolio(res.portfolio)
      setProfile(res.profile)
      setSeoTitle(res.portfolio.seo?.title ?? '')
      setSeoDescription(res.portfolio.seo?.description ?? '')
      setPortfolioName(res.portfolio.name)
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        navigate('/portfolio', { replace: true })
      } else {
        setError(err instanceof ApiError ? err.message : 'Failed to load portfolio.')
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Template change ────────────────────────────────────────────────────────
  async function handleTemplateChange(template: Portfolio['template']) {
    if (!localPortfolio) return
    setLocalPortfolio({ ...localPortfolio, template })
    setSaving(true)
    try {
      const res = await api.patch<{ portfolio: Portfolio }>(`/api/portfolios/${id}/template`, { template })
      setPortfolio(res.portfolio)
      setLocalPortfolio(res.portfolio)
      toast.show(`Template changed to ${TEMPLATE_LABELS[template]}.`)
    } catch (err) {
      if (portfolio) setLocalPortfolio(portfolio)
      toast.show(err instanceof ApiError ? err.message : 'Failed to update template.')
    } finally {
      setSaving(false)
    }
  }

  // ── Section toggle ─────────────────────────────────────────────────────────
  function toggleSection(type: SectionType) {
    if (!localPortfolio) return
    const updated = localPortfolio.sections.map((s) =>
      s.type === type ? { ...s, visible: !s.visible } : s
    )
    setLocalPortfolio({ ...localPortfolio, sections: updated })
  }

  async function saveSections() {
    if (!localPortfolio) return
    setSaving(true)
    try {
      const res = await api.patch<{ portfolio: Portfolio }>(
        `/api/portfolios/${id}/sections`,
        { sections: localPortfolio.sections }
      )
      setPortfolio(res.portfolio)
      setLocalPortfolio(res.portfolio)
      toast.show('Sections saved.')
    } catch (err) {
      if (portfolio) setLocalPortfolio(portfolio)
      toast.show(err instanceof ApiError ? err.message : 'Failed to save sections.')
    } finally {
      setSaving(false)
    }
  }

  // ── Section reorder ────────────────────────────────────────────────────────
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
  }

  // ── Theme change ───────────────────────────────────────────────────────────
  function handleThemeChange<K extends keyof PortfolioTheme>(key: K, value: PortfolioTheme[K]) {
    if (!localPortfolio) return
    setLocalPortfolio({
      ...localPortfolio,
      theme: { ...localPortfolio.theme, [key]: value },
    })
  }

  async function saveTheme() {
    if (!localPortfolio) return
    setSaving(true)
    try {
      const res = await api.patch<{ portfolio: Portfolio }>(
        `/api/portfolios/${id}/theme`,
        localPortfolio.theme
      )
      setPortfolio(res.portfolio)
      setLocalPortfolio(res.portfolio)
      toast.show('Theme saved.')
    } catch (err) {
      if (portfolio) setLocalPortfolio(portfolio)
      toast.show(err instanceof ApiError ? err.message : 'Failed to save theme.')
    } finally {
      setSaving(false)
    }
  }

  // ── SEO & name save ────────────────────────────────────────────────────────
  async function saveMeta(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api.patch<{ portfolio: Portfolio }>(
        `/api/portfolios/${id}`,
        {
          name: portfolioName.trim() || localPortfolio?.name,
          seo: { title: seoTitle.trim(), description: seoDescription.trim() },
        }
      )
      setPortfolio(res.portfolio)
      setLocalPortfolio(res.portfolio)
      toast.show('Settings saved.')
    } catch (err) {
      toast.show(err instanceof ApiError ? err.message : 'Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  // ── Loading / error states ─────────────────────────────────────────────────
  if (loading) {
    return (
      <AppLayout>
        <div className="section-shell py-24 text-center">
          <p className="font-display text-xl text-pine animate-pulse">Loading workspace…</p>
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
            <Button variant="secondary" className="px-4 py-2 text-xs">← Back to Portfolios</Button>
          </Link>
        </div>
      </AppLayout>
    )
  }

  const sortedSections = [...localPortfolio.sections].sort((a, b) => a.order - b.order)

  return (
    <AppLayout>
      {/* Toast */}
      {toast.message && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 rounded-card border border-pine/30 bg-paper px-5 py-3 shadow-lift text-sm font-bold text-pine flex items-center gap-2"
        >
          <span className="h-2 w-2 rounded-full bg-pine animate-ping" aria-hidden="true" />
          {toast.message}
        </div>
      )}

      {/* Mobile view toggle bar */}
      <div className="flex items-center gap-0.5 border-b border-line bg-paper px-4 py-2 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileView('controls')}
          className={[
            'rounded-[var(--radius-control)] px-3 py-1.5 text-xs font-bold transition-colors',
            mobileView === 'controls' ? 'bg-[#edf4f1] text-pine' : 'text-muted hover:text-ink',
          ].join(' ')}
          aria-pressed={mobileView === 'controls'}
        >
          Controls
        </button>
        <button
          type="button"
          onClick={() => setMobileView('preview')}
          className={[
            'rounded-[var(--radius-control)] px-3 py-1.5 text-xs font-bold transition-colors',
            mobileView === 'preview' ? 'bg-[#edf4f1] text-pine' : 'text-muted hover:text-ink',
          ].join(' ')}
          aria-pressed={mobileView === 'preview'}
        >
          Preview
        </button>
      </div>

      <div className="flex min-h-[calc(100vh-72px)]">

        {/* ── Left Panel: Workspace Controls ─────────────────────────────── */}
        <aside
          className={[
            'w-full lg:w-[380px] lg:shrink-0 border-r border-line bg-paper overflow-y-auto flex-col',
            mobileView === 'controls' ? 'flex' : 'hidden lg:flex',
          ].join(' ')}
          aria-label="Portfolio workspace controls"
        >
          {/* Panel header */}
          <div className="sticky top-0 z-10 bg-paper border-b border-line px-5 py-4">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <Link
                  to="/portfolio"
                  className="text-xs text-muted hover:text-pine font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-pine rounded"
                >
                  ← Portfolios
                </Link>
                <h1 className="font-display text-xl tracking-[-0.03em] text-ink truncate mt-0.5">
                  {localPortfolio.name}
                </h1>
              </div>
              <span className="shrink-0 rounded-full bg-[#f1eee6] px-2 py-0.5 text-[10px] font-bold uppercase text-muted">
                {TEMPLATE_LABELS[localPortfolio.template]}
              </span>
            </div>

            {/* Tab nav */}
            <nav className="flex gap-0.5 mt-4" aria-label="Workspace sections">
              {(['template', 'sections', 'theme', 'seo'] as WorkspaceTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={[
                    'rounded-[var(--radius-control)] px-3 py-1.5 text-xs font-bold capitalize transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-pine',
                    activeTab === tab ? 'bg-[#edf4f1] text-pine' : 'text-muted hover:text-ink',
                  ].join(' ')}
                  aria-current={activeTab === tab ? 'page' : undefined}
                >
                  {tab === 'seo' ? 'Settings' : tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Panel body */}
          <div className="flex-1 p-5 space-y-6">

            {/* ── Tab: Template ──────────────────────────────────────────── */}
            {activeTab === 'template' && (
              <div className="space-y-3">
                <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-ink">
                  Choose Template
                </p>
                <p className="text-xs text-muted">
                  The preview updates immediately when you select a template.
                </p>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {(['editorial', 'minimal', 'developer'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => void handleTemplateChange(t)}
                      disabled={saving}
                      className="group focus-visible:outline focus-visible:outline-2 focus-visible:outline-pine rounded-[0.55rem]"
                      aria-pressed={localPortfolio.template === t}
                      aria-label={`Select ${TEMPLATE_LABELS[t]} template`}
                    >
                      <TemplateThumbnail name={t} active={localPortfolio.template === t} />
                    </button>
                  ))}
                </div>
                {(['editorial', 'minimal', 'developer'] as const).map((t) => {
                  const isActive = localPortfolio.template === t
                  const descriptions: Record<typeof t, string> = {
                    editorial: 'Premium editorial layout with generous whitespace and strong typography.',
                    minimal:   'Clean, restrained design focused on content and hierarchy.',
                    developer: 'Technical, project-forward layout for engineering portfolios.',
                  }
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => void handleTemplateChange(t)}
                      disabled={saving}
                      className={[
                        'w-full text-left rounded-card border p-4 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-pine',
                        isActive ? 'border-pine bg-[#f4faf7]' : 'border-line bg-paper hover:border-pine/40',
                      ].join(' ')}
                      aria-pressed={isActive}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-bold ${isActive ? 'text-pine' : 'text-ink'}`}>
                          {TEMPLATE_LABELS[t]}
                        </span>
                        {isActive && <span className="h-2 w-2 rounded-full bg-pine" aria-hidden="true" />}
                      </div>
                      <p className="mt-1 text-xs text-muted">{descriptions[t]}</p>
                    </button>
                  )
                })}
              </div>
            )}

            {/* ── Tab: Sections ─────────────────────────────────────────── */}
            {activeTab === 'sections' && (
              <div className="space-y-4">
                <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-ink">
                  Section Visibility & Order
                </p>
                <p className="text-xs text-muted">
                  Toggle sections on or off and reorder with the arrows.
                  Changes apply to the preview immediately; save to persist.
                </p>
                <ul className="space-y-2" aria-label="Portfolio sections">
                  {sortedSections.map((section, idx) => (
                    <li
                      key={section.type}
                      className="flex items-center gap-2 rounded-[var(--radius-control)] border border-line bg-paper px-3 py-2.5"
                    >
                      {/* Visibility toggle */}
                      <button
                        type="button"
                        onClick={() => toggleSection(section.type)}
                        className={[
                          'flex h-5 w-9 shrink-0 items-center rounded-full border-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-pine',
                          section.visible ? 'border-pine bg-pine' : 'border-line bg-line',
                        ].join(' ')}
                        role="switch"
                        aria-checked={section.visible}
                        aria-label={`${section.visible ? 'Hide' : 'Show'} ${SECTION_LABELS[section.type]}`}
                      >
                        <span
                          className={[
                            'ml-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform',
                            section.visible ? 'translate-x-4' : 'translate-x-0',
                          ].join(' ')}
                          aria-hidden="true"
                        />
                      </button>

                      <span className={`flex-1 text-xs font-semibold ${section.visible ? 'text-ink' : 'text-muted'}`}>
                        {SECTION_LABELS[section.type]}
                      </span>

                      <div className="flex gap-0.5">
                        <button
                          type="button"
                          onClick={() => moveSectionUp(section.type)}
                          disabled={idx === 0}
                          className="rounded p-1 text-muted hover:text-ink disabled:opacity-30 focus-visible:outline focus-visible:outline-1 focus-visible:outline-pine"
                          aria-label={`Move ${SECTION_LABELS[section.type]} up`}
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
                            <path d="M6 2L10 8H2L6 2Z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSectionDown(section.type)}
                          disabled={idx === sortedSections.length - 1}
                          className="rounded p-1 text-muted hover:text-ink disabled:opacity-30 focus-visible:outline focus-visible:outline-1 focus-visible:outline-pine"
                          aria-label={`Move ${SECTION_LABELS[section.type]} down`}
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
                            <path d="M6 10L2 4H10L6 10Z" />
                          </svg>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => void saveSections()}
                  disabled={saving}
                  className="w-full py-2 text-xs"
                >
                  {saving ? 'Saving…' : 'Save Sections'}
                </Button>
              </div>
            )}

            {/* ── Tab: Theme ─────────────────────────────────────────────── */}
            {activeTab === 'theme' && (
              <div className="space-y-5">
                <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-ink">
                  Theme Configuration
                </p>
                <p className="text-xs text-muted">
                  All values are predefined — no arbitrary CSS accepted.
                </p>

                {/* Accent colour */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.06em] text-muted mb-2">Accent Colour</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(['forest', 'charcoal', 'brass', 'slate'] as const).map((accent) => {
                      const swatchColors = { forest: '#1e4a40', charcoal: '#2c3430', brass: '#9d602d', slate: '#3a5068' }
                      return (
                        <button
                          key={accent}
                          type="button"
                          onClick={() => handleThemeChange('accent', accent)}
                          className={[
                            'flex items-center gap-2 rounded-[var(--radius-control)] border px-3 py-2 text-xs font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-pine',
                            localPortfolio.theme.accent === accent
                              ? 'border-pine bg-[#f4faf7] text-pine'
                              : 'border-line bg-paper text-ink hover:border-pine/40',
                          ].join(' ')}
                          aria-pressed={localPortfolio.theme.accent === accent}
                        >
                          <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: swatchColors[accent] }} aria-hidden="true" />
                          {THEME_ACCENT_LABELS[accent]}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Background */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.06em] text-muted mb-2">Background</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(['ivory', 'white', 'warm', 'dark'] as const).map((bg) => (
                      <button
                        key={bg}
                        type="button"
                        onClick={() => handleThemeChange('background', bg)}
                        className={[
                          'rounded-[var(--radius-control)] border px-3 py-2 text-xs font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-pine',
                          localPortfolio.theme.background === bg
                            ? 'border-pine bg-[#f4faf7] text-pine'
                            : 'border-line bg-paper text-ink hover:border-pine/40',
                        ].join(' ')}
                        aria-pressed={localPortfolio.theme.background === bg}
                      >
                        {THEME_BACKGROUND_LABELS[bg]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Body font */}
                <div>
                  <label htmlFor="theme-font" className="block text-xs font-bold uppercase tracking-[0.06em] text-muted mb-1">Body Font</label>
                  <select
                    id="theme-font"
                    value={localPortfolio.theme.font}
                    onChange={(e) => handleThemeChange('font', e.target.value as PortfolioTheme['font'])}
                    className="w-full rounded-[var(--radius-control)] border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
                  >
                    {(['inter', 'dm-sans', 'manrope', 'playfair'] as const).map((f) => (
                      <option key={f} value={f}>{THEME_FONT_LABELS[f]}</option>
                    ))}
                  </select>
                </div>

                {/* Heading font */}
                <div>
                  <label htmlFor="theme-heading-font" className="block text-xs font-bold uppercase tracking-[0.06em] text-muted mb-1">Heading Font</label>
                  <select
                    id="theme-heading-font"
                    value={localPortfolio.theme.headingFont}
                    onChange={(e) => handleThemeChange('headingFont', e.target.value as PortfolioTheme['headingFont'])}
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
                  <div className="flex gap-2">
                    {(['none', 'minimal', 'rounded'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => handleThemeChange('radius', r)}
                        className={[
                          'flex-1 border px-2 py-2 text-xs font-semibold capitalize transition-all rounded-[var(--radius-control)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-pine',
                          localPortfolio.theme.radius === r
                            ? 'border-pine bg-[#f4faf7] text-pine'
                            : 'border-line bg-paper text-ink hover:border-pine/40',
                        ].join(' ')}
                        aria-pressed={localPortfolio.theme.radius === r}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Animation */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.06em] text-muted mb-2">Animation</p>
                  <div className="flex gap-2">
                    {(['none', 'subtle', 'moderate'] as const).map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => handleThemeChange('animation', a)}
                        className={[
                          'flex-1 border px-2 py-2 text-xs font-semibold capitalize transition-all rounded-[var(--radius-control)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-pine',
                          localPortfolio.theme.animation === a
                            ? 'border-pine bg-[#f4faf7] text-pine'
                            : 'border-line bg-paper text-ink hover:border-pine/40',
                        ].join(' ')}
                        aria-pressed={localPortfolio.theme.animation === a}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button onClick={() => void saveTheme()} disabled={saving} className="flex-1 py-2 text-xs">
                    {saving ? 'Saving…' : 'Save Theme'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      if (localPortfolio) setLocalPortfolio({ ...localPortfolio, theme: DEFAULT_THEME })
                    }}
                    className="py-2 px-3 text-xs"
                  >
                    Reset
                  </Button>
                </div>
              </div>
            )}

            {/* ── Tab: Settings ──────────────────────────────────────────── */}
            {activeTab === 'seo' && (
              <form onSubmit={(e) => void saveMeta(e)} className="space-y-5">
                <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-ink">Settings</p>

                <div>
                  <label htmlFor="portfolio-name" className="block text-xs font-bold uppercase tracking-[0.06em] text-muted mb-1">
                    Portfolio Name
                  </label>
                  <input
                    id="portfolio-name"
                    type="text"
                    maxLength={100}
                    value={portfolioName}
                    onChange={(e) => setPortfolioName(e.target.value)}
                    className="w-full rounded-[var(--radius-control)] border border-line bg-paper px-3.5 py-2 text-sm text-ink outline-none focus:border-pine"
                  />
                </div>

                <div>
                  <label htmlFor="seo-title" className="block text-xs font-bold uppercase tracking-[0.06em] text-muted mb-1">
                    SEO Title
                    <span className="ml-1 font-normal normal-case text-muted/70">(max 100)</span>
                  </label>
                  <input
                    id="seo-title"
                    type="text"
                    maxLength={100}
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder={profile?.fullName ?? 'Your Name — Portfolio'}
                    className="w-full rounded-[var(--radius-control)] border border-line bg-paper px-3.5 py-2 text-sm text-ink outline-none focus:border-pine"
                  />
                </div>

                <div>
                  <label htmlFor="seo-desc" className="block text-xs font-bold uppercase tracking-[0.06em] text-muted mb-1">
                    SEO Description
                    <span className="ml-1 font-normal normal-case text-muted/70">(max 300)</span>
                  </label>
                  <textarea
                    id="seo-desc"
                    maxLength={300}
                    rows={3}
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    placeholder="Brief description for search engines and link previews."
                    className="w-full rounded-[var(--radius-control)] border border-line bg-paper px-3.5 py-2 text-sm text-ink outline-none focus:border-pine resize-none"
                  />
                  <p className="mt-1 text-[10px] text-muted">{seoDescription.length}/300</p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.06em] text-muted mb-1">Slug</p>
                  <p className="font-mono text-xs text-muted bg-[#f1eee6] rounded-[var(--radius-control)] px-3 py-2 break-all">
                    {localPortfolio.slug}
                  </p>
                  <p className="mt-1 text-[10px] text-muted">
                    Unique identifier for this portfolio. Auto-generated from the name.
                  </p>
                </div>

                <Button type="submit" disabled={saving} className="w-full py-2 text-xs">
                  {saving ? 'Saving…' : 'Save Settings'}
                </Button>
              </form>
            )}

          </div>
        </aside>

        {/* ── Right Panel: Live Preview ────────────────────────────────────── */}
        <div
          className={[
            'flex-1 flex flex-col min-w-0',
            mobileView === 'preview' ? 'flex' : 'hidden lg:flex',
          ].join(' ')}
        >
          {/* Preview toolbar */}
          <div className="flex items-center justify-between gap-2 border-b border-line bg-paper px-4 py-2.5">
            <div className="flex items-center gap-3">
              <p className="text-xs font-semibold text-muted">Live Preview</p>
              {saving && (
                <span className="text-[10px] font-bold text-pine animate-pulse">Saving…</span>
              )}
            </div>
            <Link
              to={`/portfolio/${id}/preview`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-pine rounded"
              aria-label="Open full-screen preview in new tab"
            >
              Open full preview ↗
            </Link>
          </div>

          {/* Preview content */}
          <div className="flex-1 overflow-auto">
            {profile ? (
              <PortfolioRenderer portfolio={localPortfolio} profile={profile} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4 p-8 text-center">
                <p className="text-sm font-semibold text-ink">No profile data found.</p>
                <p className="text-xs text-muted max-w-sm">
                  Add experience, projects, and skills to your{' '}
                  <Link to="/profile" className="text-pine font-bold hover:underline">
                    Profile
                  </Link>{' '}
                  to see them rendered here.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </AppLayout>
  )
}
