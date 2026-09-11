/**
 * PortfolioListPage — Lists the user's portfolios and lets them create new ones.
 * Route: /portfolio
 */
import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppLayout } from '../../components/layout/AppLayout'
import { Button } from '../../components/common/Button'
import { TemplateThumbnail } from '../../components/portfolio/TemplateThumbnail'
import { api, ApiError } from '../../lib/api'
import type { Portfolio } from '../../types/portfolio'
import { TEMPLATE_LABELS } from '../../types/portfolio'

interface CreateForm {
  name: string
  template: Portfolio['template']
}

// ─── Slug preview helper ──────────────────────────────────────────────────────
// Mirrors the backend normalizeSlug without a round-trip for the live preview.
function previewSlug(name: string): string {
  const s = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
  return s || 'my-portfolio'
}

export function PortfolioListPage() {
  const navigate = useNavigate()
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [form, setForm] = useState<CreateForm>({ name: 'My Portfolio', template: 'editorial' })
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadPortfolios = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get<{ portfolios: Portfolio[] }>('/api/portfolios')
      setPortfolios(res.portfolios)
    } catch (err) {
      if (err instanceof ApiError) setError(err.message)
      else setError('Failed to load portfolios.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadPortfolios()
  }, [loadPortfolios])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      setCreateError('Portfolio name is required.')
      return
    }
    setCreating(true)
    setCreateError('')
    try {
      const res = await api.post<{ portfolio: Portfolio }>('/api/portfolios', {
        name: form.name.trim(),
        template: form.template,
      })
      navigate(`/portfolio/${res.portfolio._id}`)
    } catch (err) {
      if (err instanceof ApiError) setCreateError(err.message)
      else setCreateError('Failed to create portfolio.')
      setCreating(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    setDeletingId(id)
    try {
      await api.delete(`/api/portfolios/${id}`)
      setPortfolios((prev) => prev.filter((p) => p._id !== id))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete portfolio.')
    } finally {
      setDeletingId(null)
    }
  }

  const slugPreview = previewSlug(form.name)

  return (
    <AppLayout>
      <div className="section-shell py-10 sm:py-14">

        {/* Header */}
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow mb-2">Portfolio Generator</p>
            <h1 className="font-display text-3xl sm:text-4xl tracking-[-0.04em] text-ink">
              Your Portfolios
            </h1>
            <p className="mt-1 text-sm text-muted max-w-lg">
              Configure how your profile is presented. Each portfolio uses a different
              template, section selection, and theme.
            </p>
          </div>
          <Button
            onClick={() => { setShowCreate(!showCreate); setCreateError('') }}
            className="px-5 py-2.5 text-xs shrink-0"
            aria-expanded={showCreate}
            aria-controls="create-portfolio-form"
          >
            {showCreate ? 'Cancel' : '+ New Portfolio'}
          </Button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div
            id="create-portfolio-form"
            className="mb-10 rounded-card border border-pine/20 bg-[#f4faf7] p-6 shadow-soft"
          >
            <h2 className="mb-5 text-sm font-extrabold uppercase tracking-[0.1em] text-pine">
              Create Portfolio
            </h2>
            <form onSubmit={(e) => void handleCreate(e)} className="space-y-5">

              {/* Template selector (visual) */}
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.06em] text-muted mb-3">
                  Template
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {(['editorial', 'minimal', 'developer'] as const).map((t) => (
                    <label
                      key={t}
                      className={[
                        'flex flex-col items-center gap-2 cursor-pointer rounded-card border p-3 transition-all',
                        form.template === t
                          ? 'border-pine bg-white'
                          : 'border-line bg-paper hover:border-pine/40',
                      ].join(' ')}
                    >
                      <input
                        type="radio"
                        name="template"
                        value={t}
                        checked={form.template === t}
                        onChange={() => setForm({ ...form, template: t })}
                        className="sr-only"
                      />
                      <TemplateThumbnail name={t} active={form.template === t} size="sm" />
                      <span
                        className={`text-xs font-bold ${form.template === t ? 'text-pine' : 'text-muted'}`}
                      >
                        {TEMPLATE_LABELS[t]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Name field */}
              <div>
                <label
                  htmlFor="portfolio-name-input"
                  className="block text-xs font-bold uppercase tracking-[0.06em] text-muted mb-1"
                >
                  Portfolio Name <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <input
                  id="portfolio-name-input"
                  type="text"
                  required
                  maxLength={100}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-[var(--radius-control)] border border-line bg-paper px-3.5 py-2 text-sm text-ink outline-none focus:border-pine"
                  placeholder="e.g. Software Engineer Portfolio"
                  aria-describedby="slug-preview"
                />
                <p id="slug-preview" className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted">
                  <span className="font-semibold">Slug:</span>
                  <span className="font-mono">{slugPreview}</span>
                </p>
              </div>

              {createError && (
                <p role="alert" className="text-sm font-semibold text-red-700">
                  {createError}
                </p>
              )}

              <div className="flex items-center gap-3 pt-1">
                <Button type="submit" disabled={creating} className="px-5 py-2 text-xs">
                  {creating ? 'Creating…' : 'Create Portfolio'}
                </Button>
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => { setShowCreate(false); setCreateError('') }}
                  className="px-4 py-2 text-xs"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mb-6 rounded-card border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800"
          >
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="py-16 text-center">
            <p className="font-display text-xl text-pine animate-pulse">Loading portfolios…</p>
          </div>
        ) : portfolios.length === 0 ? (
          /* Empty state */
          <div className="rounded-card border border-line bg-paper p-10 text-center shadow-soft">
            <p className="font-display text-2xl text-ink mb-2">No portfolios yet.</p>
            <p className="text-sm text-muted mb-6 max-w-sm mx-auto">
              Create your first portfolio to configure how your profile is presented.
              Choose a template, show or hide sections, and customize the theme.
            </p>
            <Button
              onClick={() => setShowCreate(true)}
              className="px-6 py-2.5 text-sm"
            >
              Create your first portfolio
            </Button>
          </div>
        ) : (
          /* Portfolio cards grid */
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {portfolios.map((p) => {
              const visibleCount = p.sections.filter((s) => s.visible).length
              return (
                <div
                  key={p._id}
                  className="group flex flex-col rounded-card border border-line bg-paper shadow-soft transition-all hover:border-pine/40 hover:shadow-lift overflow-hidden"
                >
                  {/* Template thumbnail */}
                  <div className="px-5 pt-5 pb-3 flex justify-center">
                    <div className="w-full max-w-[200px]">
                      <TemplateThumbnail name={p.template} active={false} size="sm" />
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="flex flex-1 flex-col gap-1 px-5 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="font-bold text-base text-ink group-hover:text-pine transition-colors leading-snug">
                        {p.name}
                      </h2>
                      <span className="shrink-0 rounded-full bg-[#f1eee6] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-muted">
                        {TEMPLATE_LABELS[p.template]}
                      </span>
                    </div>
                    <p className="text-xs text-muted font-mono">{p.slug}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted">
                        {visibleCount} of {p.sections.length} sections visible
                      </p>
                      {/* Phase 6: Published status badge */}
                      {p.status === 'published' ? (
                        <span className="rounded-full bg-[#edf4f1] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-pine">
                          Published
                        </span>
                      ) : (
                        <span className="rounded-full bg-[#f1eee6] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-muted">
                          Draft
                        </span>
                      )}
                    </div>
                    {p.lastPublishedAt && (
                      <p className="text-[10px] text-muted">
                        Last published{' '}
                        {new Date(p.lastPublishedAt).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'short', day: 'numeric',
                        })}
                      </p>
                    )}
                  </div>

                  {/* Card actions */}
                  <div className="flex items-center gap-2 border-t border-line/60 px-5 py-3 mt-auto">
                    <Link to={`/portfolio/${p._id}`} className="flex-1">
                      <Button className="w-full py-1.5 text-xs">
                        Open Editor
                      </Button>
                    </Link>
                    <Link
                      to={`/portfolio/${p._id}/preview`}
                      aria-label={`Preview ${p.name}`}
                      className="rounded-[var(--radius-control)] border border-line bg-paper px-3 py-1.5 text-xs font-bold text-muted transition hover:border-pine/40 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-pine"
                    >
                      Preview
                    </Link>
                    {/* Phase 7: public link if published */}
                    {p.status === 'published' && (
                      <a
                        href={`/p/${p.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`View public portfolio for ${p.name}`}
                        className="rounded-[var(--radius-control)] border border-pine/30 bg-[#f4faf7] px-3 py-1.5 text-xs font-bold text-pine transition hover:bg-[#edf4f1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-pine"
                      >
                        Live ↗
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => void handleDelete(p._id, p.name)}
                      disabled={deletingId === p._id}
                      aria-label={`Delete ${p.name}`}
                      className="rounded-[var(--radius-control)] px-2.5 py-1.5 text-xs font-bold text-red-400 hover:text-red-600 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-pine transition"
                    >
                      {deletingId === p._id ? '…' : 'Delete'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </AppLayout>
  )
}
