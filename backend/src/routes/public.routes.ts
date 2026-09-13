/**
 * public.routes.ts — Phase 7 public portfolio routes.
 *
 * These routes require NO authentication.
 * They serve only published portfolio snapshots.
 * Draft data is never accessible here.
 *
 * Rate limiting:
 *   publicReadLimiter — 300 req/15min per IP (2000 in test)
 *   Separate from the authenticated general limiter so normal portfolio
 *   sharing traffic doesn't consume authenticated user quotas.
 *
 * Route:
 *   GET /api/public/portfolio/:slug — get published portfolio by slug
 */
import { Router } from 'express'
import { param } from 'express-validator'
import { publicReadLimiter } from '../middleware/rateLimiter'
import { getPublicPortfolioHandler } from '../controllers/portfolio.controller'

const router = Router()

// Rate limit all public reads
router.use(publicReadLimiter)

// Slug parameter validation — only safe characters accepted
const slugParam = [
  param('slug')
    .trim()
    .isLength({ min: 1, max: 80 })
    .withMessage('Invalid portfolio slug')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug must contain only lowercase letters, digits, and hyphens'),
]

// GET /api/public/portfolio/:slug
// No authentication. Returns published snapshot only. Never returns draft data.
router.get('/portfolio/:slug', slugParam, getPublicPortfolioHandler)

export default router
