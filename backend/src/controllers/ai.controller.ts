/**
 * ai.controller.ts — HTTP handlers for /api/ai/* routes.
 *
 * Thin HTTP translation layer — same pattern as profile.controller.ts:
 *   1. Validate input
 *   2. Call service
 *   3. Return safe { success, data } response
 *   4. next(err) on failure
 *
 * Security:
 * - All routes require authenticate middleware (set in router).
 * - User identity comes from req.userId — never from req.body.
 * - AI provider errors are caught and mapped to clean 503 responses.
 * - No AI provider secrets or stack traces are returned to clients.
 * - Profile data sent to AI is sanitized by toAIInput() inside the service.
 */
import { Request, Response, NextFunction } from 'express'
import { validationResult, body, param } from 'express-validator'
import {
  analyzeProfile,
  improveField,
  generateSummary,
  analyzeSkills,
  getSuggestions,
  getSuggestionById,
  acceptSuggestion,
  rejectSuggestion,
  acceptManySuggestions,
  rejectManySuggestions,
  computeProfileQuality,
  detectMissingInfo,
  toSafeSuggestion,
} from '../services/ai.service'
import { getOrCreateProfile } from '../services/profile.service'
import { createError } from '../middleware/errorHandler'
import type { SuggestionType, SuggestionCategory } from '../models/AISuggestion'

/** Reads express-validator results and throws 400 if invalid. */
function assertValidation(req: Request): void {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const message = errors.array()[0]?.msg ?? 'Validation failed'
    throw createError(message, 400)
  }
}

/** Safely extract route param 'id'. */
function paramId(req: Request): string {
  const id = req.params['id']
  return Array.isArray(id) ? id[0] : id
}

/**
 * Maps AI provider errors to clean HTTP responses.
 * Never exposes provider API keys, stack traces, or internal details.
 */
function mapAIError(err: unknown): never {
  if (err instanceof Error) {
    const msg = err.message

    if (msg.includes('AI_API_KEY') || msg.includes('not configured')) {
      throw createError(
        'AI features are not configured on this server. Contact the administrator.',
        503
      )
    }
    if (msg.includes('timeout') || msg.includes('ETIMEDOUT') || msg.includes('ECONNREFUSED')) {
      throw createError('AI provider is temporarily unavailable. Please try again.', 503)
    }
    if (msg.includes('rate limit') || msg.includes('429')) {
      throw createError('AI provider rate limit reached. Please try again in a moment.', 429)
    }
    if (msg.includes('context') || msg.includes('token') || msg.includes('too long')) {
      throw createError('Profile content is too long for AI processing. Shorten some fields and retry.', 400)
    }
    // Zod validation failure (malformed AI output)
    if (msg.includes('ZodError') || msg.includes('invalid_type') || msg.includes('Required')) {
      throw createError('AI returned an unexpected response format. Please try again.', 502)
    }
  }
  throw createError('AI operation failed. Please try again.', 500)
}

// ─── GET /api/ai/profile/quality ─────────────────────────────────────────────

/**
 * Returns the deterministic profile quality score.
 * No AI call — fast, always available regardless of AI configuration.
 */
export async function getProfileQuality(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const profile = await getOrCreateProfile(req.userId!)
    const quality = computeProfileQuality(profile)
    const missingInfo = detectMissingInfo(profile)

    res.json({
      success: true,
      data: { quality, missingInfo },
    })
  } catch (err) {
    next(err)
  }
}

// ─── POST /api/ai/profile/analyze ────────────────────────────────────────────

/**
 * Runs AI analysis on the user's full profile.
 * Returns structured findings — does not modify the profile.
 * Requires AI to be configured (503 if not).
 */
export async function analyzeProfileHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await analyzeProfile(req.userId!)
    res.json({
      success: true,
      data: result,
    })
  } catch (err) {
    if (
      err instanceof Error &&
      (err.message.includes('AI') ||
        err.message.includes('provider') ||
        err.message.includes('configured') ||
        err.message.includes('timeout') ||
        err.message.includes('ZodError'))
    ) {
      mapAIError(err)
    }
    next(err)
  }
}

// ─── POST /api/ai/profile/summary ────────────────────────────────────────────

export async function generateSummaryHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await generateSummary(req.userId!)
    res.json({
      success: true,
      data: {
        suggestion: result.suggestion ? toSafeSuggestion(result.suggestion) : null,
        insufficientData: result.insufficientData,
        missingForBetterSummary: result.missingForBetterSummary,
      },
    })
  } catch (err) {
    if (err instanceof Error && (err.message.includes('AI') || err.message.includes('configured'))) {
      mapAIError(err)
    }
    next(err)
  }
}

// ─── POST /api/ai/profile/skills ─────────────────────────────────────────────

export async function analyzeSkillsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await analyzeSkills(req.userId!)
    res.json({
      success: true,
      data: {
        intelligence: result.intelligence,
        suggestions: result.suggestions.map(toSafeSuggestion),
      },
    })
  } catch (err) {
    if (err instanceof Error && (err.message.includes('AI') || err.message.includes('configured'))) {
      mapAIError(err)
    }
    next(err)
  }
}

// ─── POST /api/ai/content/improve ────────────────────────────────────────────

/**
 * Validate request body for content improvement.
 */
export const improveContentValidation = [
  body('type')
    .isIn([
      'about',
      'headline',
      'experience_description',
      'project_description',
      'achievement_description',
      'general',
    ])
    .withMessage('Invalid suggestion type.'),
  body('field')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Field name is required (max 100 characters).'),
  body('originalContent')
    .trim()
    .isLength({ min: 1, max: 10000 })
    .withMessage('originalContent is required (max 10,000 characters).'),
  body('sectionId')
    .optional()
    .trim()
    .isMongoId()
    .withMessage('sectionId must be a valid MongoDB ID if provided.'),
  body('category')
    .optional()
    .isIn([
      'clarity',
      'grammar',
      'conciseness',
      'impact',
      'specificity',
      'consistency',
      'missing_context',
      'recruiter_readability',
      'skill_intelligence',
      'completeness',
    ])
    .withMessage('Invalid category.'),
  body('instruction')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Instruction must be at most 500 characters.'),
]

export async function improveContentHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    assertValidation(req)

    const {
      type,
      sectionId,
      field,
      category = 'clarity',
      originalContent,
      instruction = 'Improve the clarity and professional tone of this content.',
    } = req.body as {
      type: SuggestionType
      sectionId?: string
      field: string
      category?: SuggestionCategory
      originalContent: string
      instruction?: string
    }

    const suggestion = await improveField(req.userId!, {
      type,
      sectionId,
      field,
      category,
      originalContent,
      instruction,
    })

    res.status(201).json({
      success: true,
      data: { suggestion: toSafeSuggestion(suggestion) },
    })
  } catch (err) {
    if (err instanceof Error && (err.message.includes('AI') || err.message.includes('configured'))) {
      mapAIError(err)
    }
    next(err)
  }
}

// ─── GET /api/ai/suggestions ──────────────────────────────────────────────────

export async function getSuggestionsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { status, type } = req.query as { status?: string; type?: string }

    const validStatuses = ['pending', 'accepted', 'rejected']
    const statusFilter =
      status && validStatuses.includes(status)
        ? (status as 'pending' | 'accepted' | 'rejected')
        : undefined

    const suggestions = await getSuggestions(req.userId!, {
      status: statusFilter,
      type,
    })

    res.json({
      success: true,
      data: { suggestions: suggestions.map(toSafeSuggestion) },
    })
  } catch (err) {
    next(err)
  }
}

// ─── GET /api/ai/suggestions/:id ─────────────────────────────────────────────

export async function getSuggestionHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    assertValidation(req)
    const id = paramId(req)
    const suggestion = await getSuggestionById(req.userId!, id)
    if (!suggestion) {
      res.status(404).json({ success: false, error: 'Suggestion not found.' })
      return
    }
    res.json({
      success: true,
      data: { suggestion: toSafeSuggestion(suggestion) },
    })
  } catch (err) {
    next(err)
  }
}

// ─── POST /api/ai/suggestions/:id/accept ─────────────────────────────────────

export async function acceptSuggestionHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    assertValidation(req)
    const id = paramId(req)
    const { suggestion, updatedProfile } = await acceptSuggestion(req.userId!, id)
    res.json({
      success: true,
      data: {
        suggestion: toSafeSuggestion(suggestion),
        profileUpdated: true,
        profileId: String(updatedProfile._id),
      },
    })
  } catch (err) {
    next(err)
  }
}

// ─── POST /api/ai/suggestions/:id/reject ─────────────────────────────────────

export async function rejectSuggestionHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    assertValidation(req)
    const id = paramId(req)
    const suggestion = await rejectSuggestion(req.userId!, id)
    res.json({
      success: true,
      data: { suggestion: toSafeSuggestion(suggestion) },
    })
  } catch (err) {
    next(err)
  }
}

// ─── POST /api/ai/suggestions/accept-many ────────────────────────────────────

export const acceptManyValidation = [
  body('ids')
    .isArray({ min: 1, max: 20 })
    .withMessage('ids must be an array of 1–20 suggestion IDs.'),
  body('ids.*')
    .isMongoId()
    .withMessage('Each id must be a valid MongoDB ID.'),
]

export async function acceptManySuggestionsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    assertValidation(req)
    const { ids } = req.body as { ids: string[] }
    const result = await acceptManySuggestions(req.userId!, ids)
    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}

// ─── POST /api/ai/suggestions/reject-many ────────────────────────────────────

export const rejectManyValidation = [
  body('ids')
    .isArray({ min: 1, max: 20 })
    .withMessage('ids must be an array of 1–20 suggestion IDs.'),
  body('ids.*')
    .isMongoId()
    .withMessage('Each id must be a valid MongoDB ID.'),
]

export async function rejectManySuggestionsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    assertValidation(req)
    const { ids } = req.body as { ids: string[] }
    const result = await rejectManySuggestions(req.userId!, ids)
    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}

// ─── Validation exports ───────────────────────────────────────────────────────

export const suggestionIdParam = [
  param('id').isMongoId().withMessage('Invalid suggestion ID.'),
]
