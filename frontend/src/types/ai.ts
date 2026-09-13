/**
 * AI-related TypeScript types for the FOLVIRA frontend.
 * These mirror the backend AISuggestion model and ai.service shapes.
 * Never import server-side types directly into the frontend.
 */

// ─── Suggestion types ─────────────────────────────────────────────────────────

export type SuggestionType =
  | 'about'
  | 'headline'
  | 'experience_description'
  | 'project_description'
  | 'achievement_description'
  | 'skill_normalization'
  | 'skill_merge'
  | 'skill_missing'
  | 'summary'
  | 'general'

export type SuggestionCategory =
  | 'clarity'
  | 'grammar'
  | 'conciseness'
  | 'impact'
  | 'specificity'
  | 'consistency'
  | 'missing_context'
  | 'recruiter_readability'
  | 'skill_intelligence'
  | 'completeness'

export type SuggestionStatus = 'pending' | 'accepted' | 'rejected'

export interface AISuggestion {
  _id: string
  type: SuggestionType
  sectionId?: string
  field: string
  category: SuggestionCategory
  original: string
  suggested: string
  reason: string
  status: SuggestionStatus
  aiModel: string
  providerName: string
  createdAt: string
  updatedAt: string
  decidedAt?: string
}

// ─── Analysis types ───────────────────────────────────────────────────────────

export type FindingSeverity = 'info' | 'warning' | 'improvement'

export interface AnalysisFinding {
  area: string
  issue: string
  severity: FindingSeverity
  suggestion: string
}

export type ReadabilityLevel = 'poor' | 'fair' | 'good' | 'excellent'

export interface ProfileAnalysis {
  strengths: string[]
  weaknesses: string[]
  missingInformation: string[]
  findings: AnalysisFinding[]
  overallReadability: ReadabilityLevel
  summary: string
}

// ─── Quality score types ──────────────────────────────────────────────────────

export interface QualityDimension {
  label: string
  score: number
  maxScore: number
  explanation: string
}

export interface ProfileQualityReport {
  total: number
  label: string
  dimensions: QualityDimension[]
  topActions: string[]
}

// ─── Missing info types ───────────────────────────────────────────────────────

export type InfoPriority = 'required' | 'recommended' | 'optional'

export interface MissingInfoItem {
  field: string
  label: string
  priority: InfoPriority
  reason: string
}

// ─── Skill intelligence types ─────────────────────────────────────────────────

export interface SkillDuplicate {
  names: string[]
  reason: string
}

export interface SkillNormalization {
  current: string
  suggested: string
  reason: string
}

export interface SkillMissing {
  skill: string
  foundIn: 'experience' | 'projects'
  context: string
}

export interface SkillIntelligence {
  duplicates: SkillDuplicate[]
  normalizationSuggestions: SkillNormalization[]
  missingFromList: SkillMissing[]
}

// ─── Summary generation ───────────────────────────────────────────────────────

export interface SummaryResult {
  suggestion: AISuggestion | null
  insufficientData: boolean
  missingForBetterSummary: string[]
}
