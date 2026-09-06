/**
 * ai.service.ts — AI Profile Intelligence business logic.
 *
 * Pure service functions — no HTTP concerns.
 * All functions:
 * 1. Accept profile data and userId
 * 2. Sanitize input via toAIInput() before any AI call
 * 3. Call the AI provider (never directly the vendor SDK)
 * 4. Persist suggestions to AISuggestion model
 * 5. Return structured, validated results
 *
 * Anti-fabrication guarantees:
 * - toAIInput() strips all secrets and irrelevant data
 * - Every AI response is validated by Zod schemas in the provider
 * - Suggestions are stored as PENDING — never auto-applied
 * - Profile data is never modified by this service directly
 *
 * Quality scoring:
 * - computeProfileQuality() is entirely deterministic — no AI call
 * - Scores are labelled as "FOLVIRA Profile Quality" — not an industry standard
 */

import mongoose from 'mongoose'
import { IProfile } from '../models/Profile'
import {
  AISuggestion,
  IAISuggestion,
  SuggestionType,
  SuggestionCategory,
} from '../models/AISuggestion'
import { getAIProvider, AIProfileInput } from './ai.provider'
import { toAIInput } from '../middleware/aiInput'
import { getOrCreateProfile } from './profile.service'

// ─── Profile Quality Score (deterministic — no AI) ───────────────────────────

export interface QualityDimension {
  label: string
  score: number           // 0–100
  maxScore: number
  explanation: string
}

export interface ProfileQualityReport {
  total: number           // 0–100
  label: string           // "FOLVIRA Profile Quality"
  dimensions: QualityDimension[]
  topActions: string[]    // 3–5 prioritised next steps
}

/**
 * Compute a deterministic profile quality score.
 * No AI call — grounded entirely in measurable profile completeness.
 * This is NOT a recruiter score or industry benchmark.
 */
export function computeProfileQuality(profile: IProfile): ProfileQualityReport {
  const dimensions: QualityDimension[] = []

  // ── Basic Information (0–25) ──────────────────────────────────────────────
  let basicScore = 0
  const basicMax = 25
  const basicIssues: string[] = []

  if (profile.fullName) basicScore += 5
  if (profile.headline && profile.headline.length > 5) basicScore += 7
  else basicIssues.push('Add a professional headline.')
  if (profile.location) basicScore += 3
  if (profile.email) basicScore += 3
  if (profile.about && profile.about.length > 100) basicScore += 7
  else if (profile.about && profile.about.length > 0) {
    basicScore += 3
    basicIssues.push('Expand your About section (aim for 100+ characters).')
  } else {
    basicIssues.push('Write an About/bio section.')
  }

  dimensions.push({
    label: 'Basic Information',
    score: Math.min(basicScore, basicMax),
    maxScore: basicMax,
    explanation: basicIssues.length > 0
      ? `Missing: ${basicIssues.join(' ')}`
      : 'Basic information is complete.',
  })

  // ── Work Experience (0–20) ────────────────────────────────────────────────
  let expScore = 0
  const expMax = 20
  const expIssues: string[] = []

  if (profile.experience.length === 0) {
    expIssues.push('Add at least one work experience entry.')
  } else {
    expScore += Math.min(profile.experience.length * 5, 10)
    const withDesc = profile.experience.filter((e) => e.description && e.description.length > 30)
    if (withDesc.length > 0) {
      expScore += Math.min(withDesc.length * 5, 10)
    } else {
      expIssues.push('Add descriptions to your experience entries.')
    }
    const noDate = profile.experience.filter((e) => !e.startDate)
    if (noDate.length > 0) {
      expIssues.push(`${noDate.length} experience ${noDate.length === 1 ? 'entry is' : 'entries are'} missing start dates.`)
    }
  }

  dimensions.push({
    label: 'Work Experience',
    score: Math.min(expScore, expMax),
    maxScore: expMax,
    explanation: expIssues.length > 0
      ? expIssues.join(' ')
      : `${profile.experience.length} well-described experience ${profile.experience.length === 1 ? 'entry' : 'entries'}.`,
  })

  // ── Projects (0–15) ───────────────────────────────────────────────────────
  let projScore = 0
  const projMax = 15
  const projIssues: string[] = []

  if (profile.projects.length === 0) {
    projIssues.push('Add portfolio projects to showcase your work.')
  } else {
    projScore += Math.min(profile.projects.length * 4, 8)
    const withTech = profile.projects.filter((p) => p.technologies.length > 0)
    if (withTech.length > 0) projScore += 4
    else projIssues.push('Add technology lists to your projects.')
    const withDesc = profile.projects.filter((p) => p.description && p.description.length > 30)
    if (withDesc.length > 0) projScore += 3
    else projIssues.push('Add descriptions to your projects.')
  }

  dimensions.push({
    label: 'Projects',
    score: Math.min(projScore, projMax),
    maxScore: projMax,
    explanation: projIssues.length > 0
      ? projIssues.join(' ')
      : `${profile.projects.length} projects with descriptions and tech stacks.`,
  })

  // ── Skills (0–15) ─────────────────────────────────────────────────────────
  let skillScore = 0
  const skillMax = 15
  const skillIssues: string[] = []

  if (profile.skills.length === 0) {
    skillIssues.push('Add relevant skills and technologies.')
  } else if (profile.skills.length < 3) {
    skillScore += 5
    skillIssues.push('Consider adding more skills (aim for 5+).')
  } else if (profile.skills.length < 8) {
    skillScore += 10
  } else {
    skillScore += 15
  }

  dimensions.push({
    label: 'Skills',
    score: Math.min(skillScore, skillMax),
    maxScore: skillMax,
    explanation: skillIssues.length > 0
      ? skillIssues.join(' ')
      : `${profile.skills.length} skills listed.`,
  })

  // ── Education (0–10) ──────────────────────────────────────────────────────
  let eduScore = 0
  const eduMax = 10
  const eduIssues: string[] = []

  if (profile.education.length > 0) {
    eduScore += Math.min(profile.education.length * 5, 8)
    const noGrad = profile.education.filter((e) => !e.endDate)
    if (noGrad.length > 0) {
      eduScore += 0
      eduIssues.push(`${noGrad.length} education ${noGrad.length === 1 ? 'entry is' : 'entries are'} missing graduation dates.`)
    } else {
      eduScore += 2
    }
  } else {
    eduIssues.push('Add education entries if applicable.')
  }

  dimensions.push({
    label: 'Education',
    score: Math.min(eduScore, eduMax),
    maxScore: eduMax,
    explanation: eduIssues.length > 0
      ? eduIssues.join(' ')
      : 'Education section is complete.',
  })

  // ── Certifications & Achievements (0–15) ─────────────────────────────────
  let credScore = 0
  const credMax = 15
  const credIssues: string[] = []

  if (profile.certifications.length > 0) credScore += Math.min(profile.certifications.length * 4, 8)
  else credIssues.push('Consider adding professional certifications.')

  if (profile.achievements.length > 0) credScore += Math.min(profile.achievements.length * 3, 7)
  else credIssues.push('Add notable achievements or awards if available.')

  dimensions.push({
    label: 'Credentials & Achievements',
    score: Math.min(credScore, credMax),
    maxScore: credMax,
    explanation: credIssues.length > 0
      ? credIssues.join(' ')
      : 'Credentials and achievements are represented.',
  })

  // ── Total ─────────────────────────────────────────────────────────────────
  const rawTotal = dimensions.reduce((sum, d) => sum + d.score, 0)
  const maxTotal = dimensions.reduce((sum, d) => sum + d.maxScore, 0)
  const total = Math.round((rawTotal / maxTotal) * 100)

  // Top actions: collect the most impactful issues
  const allIssues: string[] = dimensions
    .filter((d) => d.score < d.maxScore)
    .sort((a, b) => (b.maxScore - b.score) - (a.maxScore - a.score))
    .flatMap((d) => d.explanation.split('. ').filter(Boolean))
    .slice(0, 5)

  return {
    total,
    label: 'FOLVIRA Profile Quality',
    dimensions,
    topActions: allIssues,
  }
}

// ─── Missing Information Detection ───────────────────────────────────────────

export interface MissingInfoItem {
  field: string
  label: string
  priority: 'required' | 'recommended' | 'optional'
  reason: string
}

/**
 * Deterministic check for missing profile information.
 * No AI call — grounded only in the profile data structure.
 */
export function detectMissingInfo(profile: IProfile): MissingInfoItem[] {
  const missing: MissingInfoItem[] = []

  if (!profile.headline) {
    missing.push({
      field: 'headline',
      label: 'Professional Headline',
      priority: 'recommended',
      reason: 'A headline helps recruiters and visitors quickly understand your role.',
    })
  }

  if (!profile.about || profile.about.length < 50) {
    missing.push({
      field: 'about',
      label: 'About / Career Summary',
      priority: 'recommended',
      reason: 'A well-written career summary significantly improves profile impact.',
    })
  }

  if (profile.experience.length === 0) {
    missing.push({
      field: 'experience',
      label: 'Work Experience',
      priority: 'recommended',
      reason: 'At least one work experience entry is expected on a professional profile.',
    })
  } else {
    const noDesc = profile.experience.filter((e) => !e.description || e.description.length < 20)
    if (noDesc.length > 0) {
      missing.push({
        field: 'experience_descriptions',
        label: `Experience Descriptions (${noDesc.length} missing)`,
        priority: 'recommended',
        reason: 'Descriptions help explain your contributions and responsibilities.',
      })
    }
    const noStart = profile.experience.filter((e) => !e.startDate)
    if (noStart.length > 0) {
      missing.push({
        field: 'experience_dates',
        label: `Experience Start Dates (${noStart.length} missing)`,
        priority: 'optional',
        reason: 'Dates provide timeline context for your career progression.',
      })
    }
  }

  if (profile.skills.length === 0) {
    missing.push({
      field: 'skills',
      label: 'Skills',
      priority: 'recommended',
      reason: 'Skills are often the first thing parsed in profile searches.',
    })
  }

  if (profile.projects.length === 0) {
    missing.push({
      field: 'projects',
      label: 'Portfolio Projects',
      priority: 'optional',
      reason: 'Projects demonstrate applied skills and initiative.',
    })
  } else {
    const noTech = profile.projects.filter((p) => p.technologies.length === 0)
    if (noTech.length > 0) {
      missing.push({
        field: 'project_technologies',
        label: `Project Technology Lists (${noTech.length} missing)`,
        priority: 'recommended',
        reason: 'Technology tags make projects searchable and specific.',
      })
    }
    const noDesc = profile.projects.filter((p) => !p.description || p.description.length < 20)
    if (noDesc.length > 0) {
      missing.push({
        field: 'project_descriptions',
        label: `Project Descriptions (${noDesc.length} missing)`,
        priority: 'recommended',
        reason: 'Descriptions explain what the project does and your role in it.',
      })
    }
  }

  if (!profile.location) {
    missing.push({
      field: 'location',
      label: 'Location',
      priority: 'optional',
      reason: 'Location helps with geographic context for remote or local opportunities.',
    })
  }

  if (profile.education.length === 0) {
    missing.push({
      field: 'education',
      label: 'Education',
      priority: 'optional',
      reason: 'Add education history if relevant to your career goals.',
    })
  }

  return missing
}

// ─── Suggestion persistence helpers ──────────────────────────────────────────

interface CreateSuggestionParams {
  userId: string
  profileId: string
  type: SuggestionType
  sectionId?: string
  field: string
  category: SuggestionCategory
  original: string
  suggested: string
  reason: string
  aiModel: string
  providerName: string
}

async function saveSuggestion(params: CreateSuggestionParams): Promise<IAISuggestion> {
  const suggestion = await AISuggestion.create({
    userId: new mongoose.Types.ObjectId(params.userId),
    profileId: new mongoose.Types.ObjectId(params.profileId),
    type: params.type,
    sectionId: params.sectionId,
    field: params.field,
    category: params.category,
    original: params.original,
    suggested: params.suggested,
    reason: params.reason,
    status: 'pending',
    aiModel: params.aiModel,
    providerName: params.providerName,
  })
  return suggestion
}

// ─── AI Operations ────────────────────────────────────────────────────────────

/**
 * Run AI analysis on the user's profile.
 * Returns structured analysis findings — does NOT modify the profile.
 */
export async function analyzeProfile(userId: string): Promise<{
  analysis: Awaited<ReturnType<ReturnType<typeof getAIProvider>['analyzeProfile']>>
  quality: ProfileQualityReport
  missingInfo: MissingInfoItem[]
}> {
  const profile = await getOrCreateProfile(userId)

  const provider = getAIProvider()
  const aiInput = toAIInput(profile)

  const [analysis, quality, missingInfo] = await Promise.all([
    provider.analyzeProfile(aiInput),
    Promise.resolve(computeProfileQuality(profile)),
    Promise.resolve(detectMissingInfo(profile)),
  ])

  return { analysis, quality, missingInfo }
}

/**
 * Improve a specific field (about, headline, experience description, etc.)
 * Saves a PENDING suggestion — does NOT apply it to the profile.
 */
export async function improveField(
  userId: string,
  params: {
    type: SuggestionType
    sectionId?: string
    field: string
    category: SuggestionCategory
    originalContent: string
    instruction: string
  }
): Promise<IAISuggestion> {
  const profile = await getOrCreateProfile(userId)

  if (!params.originalContent || params.originalContent.trim().length === 0) {
    throw Object.assign(
      new Error('Cannot improve empty content. Please add content to this field first.'),
      { statusCode: 400 }
    )
  }

  const provider = getAIProvider()
  const aiInput = toAIInput(profile)

  const improvement = await provider.improveContent({
    fieldLabel: params.field,
    original: params.originalContent,
    context: aiInput,
    instruction: params.instruction,
  })

  const suggestion = await saveSuggestion({
    userId,
    profileId: String(profile._id),
    type: params.type,
    sectionId: params.sectionId,
    field: params.field,
    category: params.category,
    original: improvement.original,
    suggested: improvement.suggested,
    reason: improvement.reason,
    aiModel: provider.modelId,
    providerName: provider.name,
  })

  return suggestion
}

/**
 * Generate a professional summary.
 * Saves a PENDING suggestion if there is sufficient data.
 * If insufficient data, returns guidance without saving.
 */
export async function generateSummary(userId: string): Promise<{
  suggestion: IAISuggestion | null
  insufficientData: boolean
  missingForBetterSummary: string[]
}> {
  const profile = await getOrCreateProfile(userId)

  const provider = getAIProvider()
  const aiInput = toAIInput(profile)

  const result = await provider.generateSummary(aiInput)

  if (result.insufficientData || !result.summary.trim()) {
    return {
      suggestion: null,
      insufficientData: true,
      missingForBetterSummary: result.missingForBetterSummary,
    }
  }

  const suggestion = await saveSuggestion({
    userId,
    profileId: String(profile._id),
    type: 'summary',
    field: 'about',
    category: 'clarity',
    original: profile.about ?? '',
    suggested: result.summary,
    reason: `AI-generated summary sourced from: ${result.sourcedFrom.join(', ')}.`,
    aiModel: provider.modelId,
    providerName: provider.name,
  })

  return {
    suggestion,
    insufficientData: false,
    missingForBetterSummary: result.missingForBetterSummary,
  }
}

/**
 * Analyse skills for duplicates, normalization suggestions, and missing entries.
 * Saves PENDING suggestions for each finding.
 */
export async function analyzeSkills(userId: string): Promise<{
  intelligence: Awaited<ReturnType<ReturnType<typeof getAIProvider>['analyzeSkills']>>
  suggestions: IAISuggestion[]
}> {
  const profile = await getOrCreateProfile(userId)

  const provider = getAIProvider()
  const aiInput = toAIInput(profile)
  const intelligence = await provider.analyzeSkills(aiInput)

  const suggestions: IAISuggestion[] = []

  // Save normalization suggestions
  for (const norm of intelligence.normalizationSuggestions) {
    const suggestion = await saveSuggestion({
      userId,
      profileId: String(profile._id),
      type: 'skill_normalization',
      field: 'skills',
      category: 'consistency',
      original: norm.current,
      suggested: norm.suggested,
      reason: norm.reason,
      aiModel: provider.modelId,
      providerName: provider.name,
    })
    suggestions.push(suggestion)
  }

  // Save duplicate merge suggestions
  for (const dup of intelligence.duplicates) {
    const suggestion = await saveSuggestion({
      userId,
      profileId: String(profile._id),
      type: 'skill_merge',
      field: 'skills',
      category: 'consistency',
      original: dup.names.join(', '),
      suggested: dup.names[0] ?? dup.names[0],
      reason: dup.reason,
      aiModel: provider.modelId,
      providerName: provider.name,
    })
    suggestions.push(suggestion)
  }

  // Save missing-skill suggestions (as 'info' — user decides whether to add)
  for (const missing of intelligence.missingFromList) {
    const suggestion = await saveSuggestion({
      userId,
      profileId: String(profile._id),
      type: 'skill_missing',
      field: 'skills',
      category: 'completeness',
      original: '',
      suggested: missing.skill,
      reason: `"${missing.skill}" appears in your ${missing.foundIn} (${missing.context}) but is not in your skills list.`,
      aiModel: provider.modelId,
      providerName: provider.name,
    })
    suggestions.push(suggestion)
  }

  return { intelligence, suggestions }
}

// ─── Suggestion CRUD ──────────────────────────────────────────────────────────

/**
 * Get all suggestions for a user, optionally filtered by status.
 */
export async function getSuggestions(
  userId: string,
  filter?: { status?: 'pending' | 'accepted' | 'rejected'; type?: string }
): Promise<IAISuggestion[]> {
  const query: Record<string, unknown> = {
    userId: new mongoose.Types.ObjectId(userId),
  }
  if (filter?.status) query['status'] = filter.status
  if (filter?.type) query['type'] = filter.type

  return AISuggestion.find(query).sort({ createdAt: -1 }).limit(100)
}

/**
 * Get a single suggestion, verifying ownership.
 */
export async function getSuggestionById(
  userId: string,
  suggestionId: string
): Promise<IAISuggestion | null> {
  if (!mongoose.Types.ObjectId.isValid(suggestionId)) return null
  return AISuggestion.findOne({
    _id: new mongoose.Types.ObjectId(suggestionId),
    userId: new mongoose.Types.ObjectId(userId),
  })
}

/**
 * Accept a suggestion — updates the profile field and marks suggestion accepted.
 * This is the ONLY place AI content can be written to the profile.
 */
export async function acceptSuggestion(
  userId: string,
  suggestionId: string
): Promise<{ suggestion: IAISuggestion; updatedProfile: IProfile }> {
  const suggestion = await getSuggestionById(userId, suggestionId)
  if (!suggestion) {
    throw Object.assign(new Error('Suggestion not found.'), { statusCode: 404 })
  }
  if (suggestion.status !== 'pending') {
    throw Object.assign(
      new Error(`Suggestion has already been ${suggestion.status}.`),
      { statusCode: 409 }
    )
  }

  const profile = await getOrCreateProfile(userId)

  // Apply the suggestion to the correct profile field
  await applyToProfile(profile, suggestion)

  // Mark suggestion as accepted
  suggestion.status = 'accepted'
  suggestion.decidedAt = new Date()
  await suggestion.save()

  return { suggestion, updatedProfile: profile }
}

/**
 * Reject a suggestion — marks it rejected without touching the profile.
 */
export async function rejectSuggestion(
  userId: string,
  suggestionId: string
): Promise<IAISuggestion> {
  const suggestion = await getSuggestionById(userId, suggestionId)
  if (!suggestion) {
    throw Object.assign(new Error('Suggestion not found.'), { statusCode: 404 })
  }
  if (suggestion.status !== 'pending') {
    throw Object.assign(
      new Error(`Suggestion has already been ${suggestion.status}.`),
      { statusCode: 409 }
    )
  }

  suggestion.status = 'rejected'
  suggestion.decidedAt = new Date()
  await suggestion.save()

  return suggestion
}

/**
 * Accept multiple suggestions in one operation.
 * Stops on first error and reports partial success.
 */
export async function acceptManySuggestions(
  userId: string,
  suggestionIds: string[]
): Promise<{ accepted: string[]; failed: Array<{ id: string; reason: string }> }> {
  const accepted: string[] = []
  const failed: Array<{ id: string; reason: string }> = []

  for (const id of suggestionIds) {
    try {
      await acceptSuggestion(userId, id)
      accepted.push(id)
    } catch (err) {
      failed.push({
        id,
        reason: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  return { accepted, failed }
}

/**
 * Reject multiple suggestions in one operation.
 */
export async function rejectManySuggestions(
  userId: string,
  suggestionIds: string[]
): Promise<{ rejected: string[]; failed: Array<{ id: string; reason: string }> }> {
  const rejected: string[] = []
  const failed: Array<{ id: string; reason: string }> = []

  for (const id of suggestionIds) {
    try {
      await rejectSuggestion(userId, id)
      rejected.push(id)
    } catch (err) {
      failed.push({
        id,
        reason: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  return { rejected, failed }
}

// ─── Private helpers ──────────────────────────────────────────────────────────

/**
 * Apply an accepted suggestion's `suggested` value to the correct profile field.
 * This is the ONLY place the profile is mutated as a result of AI.
 * Records source: 'ai' for data provenance.
 */
async function applyToProfile(
  profile: IProfile,
  suggestion: IAISuggestion
): Promise<void> {
  const { type, sectionId, suggested } = suggestion

  switch (type) {
    case 'about':
    case 'summary':
      profile.about = suggested
      break

    case 'headline':
      profile.headline = suggested
      break

    case 'experience_description': {
      if (!sectionId) break
      const expArr = profile.experience as unknown as mongoose.Types.DocumentArray<Record<string, unknown>>
      const entry = expArr.id(sectionId)
      if (entry) {
        entry.set('description', suggested)
        entry.set('source', 'ai')
      }
      break
    }

    case 'project_description': {
      if (!sectionId) break
      const projArr = profile.projects as unknown as mongoose.Types.DocumentArray<Record<string, unknown>>
      const proj = projArr.id(sectionId)
      if (proj) {
        proj.set('description', suggested)
        proj.set('source', 'ai')
      }
      break
    }

    case 'achievement_description': {
      if (!sectionId) break
      const achArr = profile.achievements as unknown as mongoose.Types.DocumentArray<Record<string, unknown>>
      const ach = achArr.id(sectionId)
      if (ach) {
        ach.set('description', suggested)
        ach.set('source', 'ai')
      }
      break
    }

    case 'skill_normalization': {
      // Rename the skill in the list — do not delete, do not add
      const original = suggestion.original
      const skill = profile.skills.find(
        (s) => s.name.toLowerCase() === original.toLowerCase()
      )
      if (skill) {
        skill.name = suggested
        ;(skill as unknown as Record<string, unknown>)['source'] = 'ai'
      }
      break
    }

    case 'skill_missing': {
      // Add the skill — user explicitly accepted this
      const alreadyExists = profile.skills.some(
        (s) => s.name.toLowerCase() === suggested.toLowerCase()
      )
      if (!alreadyExists) {
        profile.skills.push({
          name: suggested,
          source: 'ai',
        } as IProfile['skills'][0])
      }
      break
    }

    case 'skill_merge':
      // Skill merge is advisory — user should manually delete duplicates
      // No automatic profile modification
      break

    case 'general':
    default:
      // General suggestions do not auto-apply to a specific field
      break
  }

  await profile.save()
}

// ─── Safe serialization ───────────────────────────────────────────────────────

export function toSafeSuggestion(suggestion: IAISuggestion): Record<string, unknown> {
  return {
    _id: String(suggestion._id),
    type: suggestion.type,
    sectionId: suggestion.sectionId,
    field: suggestion.field,
    category: suggestion.category,
    original: suggestion.original,
    suggested: suggestion.suggested,
    reason: suggestion.reason,
    status: suggestion.status,
    aiModel: suggestion.aiModel,
    providerName: suggestion.providerName,
    createdAt: suggestion.createdAt,
    updatedAt: suggestion.updatedAt,
    decidedAt: suggestion.decidedAt,
  }
}

/**
 * Get a safe AIProfileInput from a userId — used in controller for validation.
 */
export async function getAIInputForUser(userId: string): Promise<AIProfileInput | null> {
  const profile = await getOrCreateProfile(userId)
  return toAIInput(profile)
}
