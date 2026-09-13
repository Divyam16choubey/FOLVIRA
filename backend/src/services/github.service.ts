/**
 * github.service.ts — GitHub public API integration.
 *
 * Fetches public user profile and repositories from the GitHub REST API.
 * No authentication required for public data, but respects rate limits.
 *
 * Security:
 * - No GitHub OAuth or stored credentials.
 * - Only public data is accessed.
 * - API credentials (if added later) stay server-side.
 * - Responses are sanitized before returning.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface GitHubUserProfile {
  username: string
  name: string | null
  bio: string | null
  avatarUrl: string | null
  location: string | null
  website: string | null
  publicRepos: number
  profileUrl: string
}

export interface GitHubRepo {
  id: number
  name: string
  fullName: string
  description: string | null
  url: string
  homepage: string | null
  language: string | null
  languages: string[]
  stars: number
  forks: number
  topics: string[]
  isArchived: boolean
  isFork: boolean
  createdAt: string
  updatedAt: string
}

export interface GitHubFetchResult {
  profile: GitHubUserProfile
  repos: GitHubRepo[]
}

// ─── GitHub API types (subset of what the API returns) ──────────────────────

interface GitHubAPIUser {
  login: string
  name: string | null
  bio: string | null
  avatar_url: string
  location: string | null
  blog: string | null
  public_repos: number
  html_url: string
}

interface GitHubAPIRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  homepage: string | null
  language: string | null
  stargazers_count: number
  forks_count: number
  topics: string[]
  archived: boolean
  fork: boolean
  created_at: string
  updated_at: string
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const GITHUB_API_BASE = 'https://api.github.com'
const MAX_REPOS = 100
const REQUEST_TIMEOUT_MS = 15_000

/**
 * Extract GitHub username from a username string or profile URL.
 * Returns null if the input doesn't look like a valid GitHub username.
 */
export function extractGitHubUsername(input: string): string | null {
  const trimmed = input.trim()

  // If it looks like a URL, extract the username from the path
  const urlMatch = trimmed.match(
    /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38})\/?$/i
  )
  if (urlMatch) {
    return urlMatch[1]
  }

  // If it's just a username (no slashes, no special chars except hyphens)
  if (/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(trimmed)) {
    return trimmed
  }

  return null
}

/**
 * Make a request to the GitHub API with proper headers and timeout.
 */
async function githubFetch<T>(path: string): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${GITHUB_API_BASE}${path}`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'FOLVIRA-Portfolio-Builder',
      },
      signal: controller.signal,
    })

    if (response.status === 404) {
      throw new GitHubError('GitHub user not found', 'NOT_FOUND')
    }

    if (response.status === 403) {
      const remaining = response.headers.get('X-RateLimit-Remaining')
      if (remaining === '0') {
        const resetTime = response.headers.get('X-RateLimit-Reset')
        const resetDate = resetTime
          ? new Date(parseInt(resetTime) * 1000).toISOString()
          : 'unknown'
        throw new GitHubError(
          `GitHub API rate limit exceeded. Resets at ${resetDate}`,
          'RATE_LIMITED'
        )
      }
      throw new GitHubError('GitHub API access forbidden', 'FORBIDDEN')
    }

    if (!response.ok) {
      throw new GitHubError(
        `GitHub API error: ${response.status} ${response.statusText}`,
        'API_ERROR'
      )
    }

    return (await response.json()) as T
  } finally {
    clearTimeout(timeoutId)
  }
}

// ─── Custom error class ────────────────────────────────────────────────────

export type GitHubErrorCode =
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'FORBIDDEN'
  | 'API_ERROR'
  | 'INVALID_USERNAME'
  | 'TIMEOUT'

export class GitHubError extends Error {
  public readonly code: GitHubErrorCode

  constructor(message: string, code: GitHubErrorCode) {
    super(message)
    this.name = 'GitHubError'
    this.code = code
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Fetch a GitHub user's public profile and repositories.
 * Returns structured data for user review — does NOT auto-import.
 */
export async function fetchGitHubData(
  usernameOrUrl: string
): Promise<GitHubFetchResult> {
  const username = extractGitHubUsername(usernameOrUrl)

  if (!username) {
    throw new GitHubError(
      'Invalid GitHub username or URL',
      'INVALID_USERNAME'
    )
  }

  try {
    // Fetch user profile and repos in parallel
    const [apiUser, apiRepos] = await Promise.all([
      githubFetch<GitHubAPIUser>(`/users/${username}`),
      githubFetch<GitHubAPIRepo[]>(
        `/users/${username}/repos?per_page=${MAX_REPOS}&sort=updated&direction=desc&type=owner`
      ),
    ])

    const profile: GitHubUserProfile = {
      username: apiUser.login,
      name: apiUser.name,
      bio: apiUser.bio,
      avatarUrl: apiUser.avatar_url,
      location: apiUser.location,
      website: apiUser.blog || null,
      publicRepos: apiUser.public_repos,
      profileUrl: apiUser.html_url,
    }

    const repos: GitHubRepo[] = apiRepos
      .filter((r) => !r.archived) // Exclude archived repos
      .map((r) => ({
        id: r.id,
        name: r.name,
        fullName: r.full_name,
        description: r.description,
        url: r.html_url,
        homepage: r.homepage || null,
        language: r.language,
        languages: r.language ? [r.language] : [],
        stars: r.stargazers_count,
        forks: r.forks_count,
        topics: r.topics || [],
        isArchived: r.archived,
        isFork: r.fork,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }))

    return { profile, repos }
  } catch (err) {
    if (err instanceof GitHubError) throw err

    if (err instanceof Error && err.name === 'AbortError') {
      throw new GitHubError(
        'GitHub API request timed out. Please try again.',
        'TIMEOUT'
      )
    }

    throw new GitHubError(
      'Failed to connect to GitHub API. Please try again later.',
      'API_ERROR'
    )
  }
}

/**
 * Convert a GitHubRepo into a project candidate for import.
 */
export function repoToProject(repo: GitHubRepo) {
  return {
    name: repo.name,
    description: repo.description || '',
    url: repo.homepage || repo.url,
    repoUrl: repo.url,
    technologies: [
      ...new Set([
        ...(repo.language ? [repo.language] : []),
        ...repo.topics,
      ]),
    ],
    source: 'github' as const,
    sourceId: String(repo.id),
  }
}
