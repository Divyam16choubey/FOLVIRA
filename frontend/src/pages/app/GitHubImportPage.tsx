/**
 * GitHubImportPage.tsx — GitHub repository ingestion and project mapping.
 *
 * Implements:
 * 1. Username or URL input with validation
 * 2. Fetch from GitHub API via backend proxy (/api/profile/github/fetch)
 * 3. Repository selection with language tags and stars
 * 4. Safe import with data provenance tracking (source: 'github')
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppLayout } from '../../components/layout/AppLayout'
import { Button } from '../../components/common/Button'
import { api } from '../../lib/api'
import type { GitHubProfile, GitHubRepo, Profile } from '../../types/profile'

export function GitHubImportPage() {
  const navigate = useNavigate()
  const [usernameInput, setUsernameInput] = useState('')
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState('')

  // Result state
  const [githubUser, setGithubUser] = useState<GitHubProfile | null>(null)
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [selectedRepoIds, setSelectedRepoIds] = useState<number[]>([])
  const [updateBioLocation, setUpdateBioLocation] = useState(true)

  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ count: number } | null>(null)

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!usernameInput.trim()) {
      setError('Please enter a GitHub username or profile URL.')
      return
    }

    setIsFetching(true)
    try {
      const res = await api.post<{ profile: GitHubProfile; repos: GitHubRepo[] }>(
        '/api/profile/github/fetch',
        { username: usernameInput.trim() }
      )
      setGithubUser(res.profile)
      setRepos(res.repos)

      // By default preselect non-fork, non-archived repositories
      const defaultSelected = res.repos
        .filter((r) => !r.isFork && !r.isArchived)
        .map((r) => r.id)
      setSelectedRepoIds(defaultSelected)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to fetch GitHub data. Please check the username.')
      }
    } finally {
      setIsFetching(false)
    }
  }

  const toggleRepo = (id: number) => {
    if (selectedRepoIds.includes(id)) {
      setSelectedRepoIds(selectedRepoIds.filter((rId) => rId !== id))
    } else {
      setSelectedRepoIds([...selectedRepoIds, id])
    }
  }

  const handleImport = async () => {
    if (!githubUser || selectedRepoIds.length === 0) return
    setIsImporting(true)
    setError('')

    const selectedRepos = repos
      .filter((r) => selectedRepoIds.includes(r.id))
      .map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description || undefined,
        url: r.url,
        homepage: r.homepage || undefined,
        language: r.language || undefined,
        topics: r.topics || [],
      }))

    const profileUpdates = updateBioLocation
      ? {
          githubUrl: githubUser.profileUrl,
          location: githubUser.location || undefined,
          about: githubUser.bio || undefined,
        }
      : undefined

    try {
      const res = await api.post<{
        profile: Profile
        completeness: number
        importedCount: number
      }>('/api/profile/github/import', {
        repos: selectedRepos,
        updateProfile: profileUpdates,
      })

      setImportResult({ count: res.importedCount })
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to import selected repositories.')
      }
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <AppLayout>
      <div className="section-shell max-w-4xl py-10 sm:py-14">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            to="/profile"
            className="text-xs font-bold text-muted hover:text-pine transition-colors"
          >
            ← Back to Profile Editor
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <p className="eyebrow mb-2">Data Ingestion</p>
          <h1 className="font-display text-3xl sm:text-4xl tracking-[-0.04em] text-ink">
            GitHub Import
          </h1>
          <p className="mt-1 text-sm text-muted">
            Connect your public GitHub repositories to automatically showcase your open-source projects, languages, and technical contributions.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-card border border-red-300 bg-red-50 p-4 text-sm font-semibold text-red-800"
          >
            {error}
          </div>
        )}

        {importResult ? (
          <div className="rounded-card border border-pine/30 bg-[#edf4f1] p-8 text-center shadow-soft">
            <span className="inline-block rounded-full bg-pine/10 p-3 text-pine mb-3">
              ✓
            </span>
            <h2 className="font-display text-2xl text-pine">
              {importResult.count} {importResult.count === 1 ? 'Project' : 'Projects'} Successfully Imported
            </h2>
            <p className="mt-2 text-sm text-ink/80 max-w-md mx-auto">
              Your chosen repositories have been added to your profile projects showcase with &lsquo;github&rsquo; provenance.
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <Button onClick={() => navigate('/profile')}>
                View Profile Editor
              </Button>
              <Button variant="secondary" onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </Button>
            </div>
          </div>
        ) : !githubUser ? (
          /* Username Search Box */
          <div className="rounded-card border border-line bg-paper p-8 sm:p-10 shadow-soft">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f1eee6] text-pine text-2xl mb-4">
              🐙
            </div>

            <h2 className="font-display text-xl text-center text-ink">
              Enter your GitHub handle or profile link
            </h2>
            <p className="mt-1 text-center text-xs text-muted">
              We only read your public repositories and profile details. No authorization tokens or secrets required.
            </p>

            <form onSubmit={handleFetch} className="mt-6 max-w-md mx-auto flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="e.g. torvalds or github.com/torvalds"
                className="flex-1 rounded-[var(--radius-control)] border border-line bg-paper px-3.5 py-2 text-sm text-ink outline-none transition focus:border-pine"
              />
              <Button type="submit" disabled={isFetching || !usernameInput.trim()}>
                {isFetching ? 'Fetching…' : 'Fetch Repos'}
              </Button>
            </form>
          </div>
        ) : (
          /* Review & Repository Selection */
          <div className="space-y-6">
            {/* GitHub Profile Card */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between rounded-card border border-line bg-paper p-6 shadow-soft">
              <div className="flex items-center gap-4">
                {githubUser.avatarUrl ? (
                  <img
                    src={githubUser.avatarUrl}
                    alt={githubUser.username}
                    className="h-16 w-16 rounded-full border border-line object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-pine/10 flex items-center justify-center text-pine font-bold">
                    {githubUser.username[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="font-display text-lg text-ink">
                    {githubUser.name || githubUser.username}
                  </h3>
                  <p className="text-xs text-muted">
                    @{githubUser.username} · {githubUser.publicRepos} public repositories
                  </p>
                  {githubUser.bio && (
                    <p className="mt-1 text-xs text-ink/80 line-clamp-2 max-w-md">
                      {githubUser.bio}
                    </p>
                  )}
                </div>
              </div>

              <Button
                variant="secondary"
                className="text-xs self-start sm:self-auto"
                onClick={() => {
                  setGithubUser(null)
                  setRepos([])
                }}
              >
                Change User
              </Button>
            </div>

            {/* Ingestion Settings */}
            <div className="rounded-card border border-line bg-[#fbf9f4] p-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-ink">
                <input
                  type="checkbox"
                  checked={updateBioLocation}
                  onChange={(e) => setUpdateBioLocation(e.target.checked)}
                  className="h-4 w-4 rounded border-line text-pine focus:ring-pine"
                />
                Update profile Bio, Location, and GitHub URL if they are currently blank
              </label>
            </div>

            {/* Repositories List */}
            <div className="rounded-card border border-line bg-paper p-6 shadow-soft">
              <div className="flex items-center justify-between border-b border-line pb-4 mb-4">
                <div>
                  <h3 className="font-display text-xl text-ink">
                    Select Repositories to Showcase
                  </h3>
                  <p className="text-xs text-muted">
                    {selectedRepoIds.length} of {repos.length} selected
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedRepoIds(
                      selectedRepoIds.length === repos.length
                        ? []
                        : repos.map((r) => r.id)
                    )
                  }
                  className="text-xs font-bold text-pine hover:underline"
                >
                  {selectedRepoIds.length === repos.length
                    ? 'Deselect All'
                    : 'Select All'}
                </button>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {repos.map((repo) => {
                  const isSelected = selectedRepoIds.includes(repo.id)
                  return (
                    <div
                      key={repo.id}
                      onClick={() => toggleRepo(repo.id)}
                      className={`cursor-pointer rounded-[var(--radius-card)] border p-4 transition-all ${
                        isSelected
                          ? 'border-pine bg-[#f8fbf9]'
                          : 'border-line bg-paper opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRepo(repo.id)}
                          className="mt-0.5 h-4 w-4 rounded border-line text-pine focus:ring-pine"
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-ink">
                              {repo.name}
                            </span>
                            {repo.stars > 0 && (
                              <span className="text-xs text-brass font-bold">
                                ★ {repo.stars}
                              </span>
                            )}
                            {repo.isFork && (
                              <span className="rounded bg-line/60 px-1 py-0.2 text-[9px] uppercase font-bold text-muted">
                                fork
                              </span>
                            )}
                          </div>

                          {repo.description && (
                            <p className="text-xs text-muted line-clamp-2">
                              {repo.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                            {repo.language && (
                              <span className="rounded bg-[#f1eee6] px-2 py-0.5 font-bold text-pine">
                                {repo.language}
                              </span>
                            )}
                            {repo.topics.slice(0, 4).map((t, idx) => (
                              <span
                                key={idx}
                                className="rounded bg-line/50 px-1.5 py-0.5 text-muted"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setGithubUser(null)
                  setRepos([])
                }}
                disabled={isImporting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={isImporting || selectedRepoIds.length === 0}
              >
                {isImporting
                  ? 'Importing…'
                  : `Import ${selectedRepoIds.length} Projects`}
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
