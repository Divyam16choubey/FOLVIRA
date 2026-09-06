/**
 * ai.routes.ts — /api/ai/* router.
 *
 * All routes require authentication.
 * AI analysis/generation endpoints use aiLimiter (20/hour) — expensive.
 * Suggestion accept/reject endpoints use suggestionActionLimiter (60/15min) — cheaper.
 *
 * Route map:
 *   GET  /profile/quality         — deterministic quality score (no AI, no limiter)
 *   POST /profile/analyze         — full AI profile analysis
 *   POST /profile/summary         — AI professional summary generation
 *   POST /profile/skills          — AI skill intelligence analysis
 *   POST /content/improve         — AI content improvement for a specific field
 *   GET  /suggestions             — list suggestions (filterable)
 *   GET  /suggestions/:id         — get one suggestion
 *   POST /suggestions/:id/accept  — accept one suggestion
 *   POST /suggestions/:id/reject  — reject one suggestion
 *   POST /suggestions/accept-many — bulk accept
 *   POST /suggestions/reject-many — bulk reject
 */
import { Router } from 'express'
import { authenticate } from '../middleware/authenticate'
import { aiLimiter, suggestionActionLimiter } from '../middleware/rateLimiter'
import {
  getProfileQuality,
  analyzeProfileHandler,
  generateSummaryHandler,
  analyzeSkillsHandler,
  improveContentHandler,
  improveContentValidation,
  getSuggestionsHandler,
  getSuggestionHandler,
  acceptSuggestionHandler,
  rejectSuggestionHandler,
  acceptManySuggestionsHandler,
  rejectManySuggestionsHandler,
  acceptManyValidation,
  rejectManyValidation,
  suggestionIdParam,
} from '../controllers/ai.controller'

const router = Router()

// All AI routes require authentication
router.use(authenticate)

// ─── Profile intelligence (no body mutations) ─────────────────────────────────

// Quality score — deterministic, no AI call, no special limiter
router.get('/profile/quality', getProfileQuality)

// AI analysis — expensive
router.post('/profile/analyze', aiLimiter, analyzeProfileHandler)
router.post('/profile/summary', aiLimiter, generateSummaryHandler)
router.post('/profile/skills', aiLimiter, analyzeSkillsHandler)

// ─── Content improvement (AI call, per-field) ─────────────────────────────────
router.post('/content/improve', aiLimiter, improveContentValidation, improveContentHandler)

// ─── Suggestion workflow ──────────────────────────────────────────────────────

// Bulk operations first (before :id routes to avoid param collision)
router.post(
  '/suggestions/accept-many',
  suggestionActionLimiter,
  acceptManyValidation,
  acceptManySuggestionsHandler
)
router.post(
  '/suggestions/reject-many',
  suggestionActionLimiter,
  rejectManyValidation,
  rejectManySuggestionsHandler
)

// List and single-item
router.get('/suggestions', getSuggestionsHandler)
router.get('/suggestions/:id', suggestionIdParam, getSuggestionHandler)

// Accept / reject individual suggestions
router.post(
  '/suggestions/:id/accept',
  suggestionActionLimiter,
  suggestionIdParam,
  acceptSuggestionHandler
)
router.post(
  '/suggestions/:id/reject',
  suggestionActionLimiter,
  suggestionIdParam,
  rejectSuggestionHandler
)

export default router
