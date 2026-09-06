/**
 * Shared TypeScript types for the profile domain.
 * These mirror the backend Profile schema shapes.
 * Never import server-side types directly into the frontend.
 */

// ─── Data provenance ────────────────────────────────────────────────────────

export type DataSourceType = 'manual' | 'resume' | 'github' | 'linkedin'

// ─── Sub-document types ─────────────────────────────────────────────────────

export interface Skill {
  _id: string
  name: string
  source: DataSourceType
  sourceId?: string
}

export interface Experience {
  _id: string
  title: string
  company: string
  location?: string
  startDate?: string
  endDate?: string
  current: boolean
  description?: string
  source: DataSourceType
  sourceId?: string
}

export interface Education {
  _id: string
  institution: string
  degree?: string
  field?: string
  startDate?: string
  endDate?: string
  description?: string
  source: DataSourceType
  sourceId?: string
}

export interface Project {
  _id: string
  name: string
  description?: string
  url?: string
  repoUrl?: string
  technologies: string[]
  source: DataSourceType
  sourceId?: string
}

export interface Certification {
  _id: string
  name: string
  issuer?: string
  date?: string
  url?: string
  source: DataSourceType
}

export interface Achievement {
  _id: string
  title: string
  description?: string
  date?: string
  source: DataSourceType
}

export interface Publication {
  _id: string
  title: string
  publisher?: string
  date?: string
  url?: string
  source: DataSourceType
}

export interface Language {
  _id: string
  name: string
  proficiency?: string
  source: DataSourceType
}

export interface SocialLink {
  _id: string
  platform: string
  url: string
}

// ─── Profile ────────────────────────────────────────────────────────────────

export interface Profile {
  _id: string
  userId: string
  fullName: string
  headline?: string
  profilePhoto?: string
  location?: string
  email?: string
  phone?: string
  website?: string
  linkedinUrl?: string
  githubUrl?: string
  about?: string
  skills: Skill[]
  experience: Experience[]
  education: Education[]
  projects: Project[]
  certifications: Certification[]
  achievements: Achievement[]
  publications: Publication[]
  languages: Language[]
  socialLinks: SocialLink[]
  createdAt: string
  updatedAt: string
}

// ─── Data Source ─────────────────────────────────────────────────────────────

export interface DataSource {
  _id: string
  userId: string
  type: 'resume' | 'github' | 'linkedin'
  status: 'connected' | 'imported' | 'error' | 'pending'
  metadata: Record<string, unknown>
  lastImportedAt?: string
  sourceIdentifier?: string
  createdAt: string
  updatedAt: string
}

// ─── Resume extraction (preview before merge) ───────────────────────────────

export interface ExtractedExperience {
  title: string
  company: string
  location?: string
  startDate?: string
  endDate?: string
  current: boolean
  description?: string
}

export interface ExtractedEducation {
  institution: string
  degree?: string
  field?: string
  startDate?: string
  endDate?: string
}

export interface ResumeExtraction {
  fullName?: string
  email?: string
  phone?: string
  location?: string
  website?: string
  linkedinUrl?: string
  githubUrl?: string
  about?: string
  skills: string[]
  experience: ExtractedExperience[]
  education: ExtractedEducation[]
}

// ─── GitHub types ───────────────────────────────────────────────────────────

export interface GitHubProfile {
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
