/**
 * portfolio.routes.ts — /api/portfolios/* router.
 *
 * All routes require authentication.
 * Input validation via express-validator on mutation endpoints.
 *
 * Route map:
 *   GET    /slug-preview                    — normalize a name to a slug
 *   POST   /                                — create portfolio
 *   GET    /                                — list user portfolios
 *   GET    /:id                             — get portfolio + renderer profile
 *   PATCH  /:id                             — update name/slug/seo
 *   DELETE /:id                             — delete portfolio
 *   PATCH  /:id/template                    — change template
 *   PATCH  /:id/theme                       — update theme config
 *   PATCH  /:id/sections                    — update sections config
 */
import { Router } from 'express'
import { body, param } from 'express-validator'
import { authenticate } from '../middleware/authenticate'
import {
  createPortfolioHandler,
  getUserPortfoliosHandler,
  getPortfolioHandler,
  updatePortfolioHandler,
  deletePortfolioHandler,
  updateTemplateHandler,
  updateThemeHandler,
  updateSectionsHandler,
  previewSlugHandler,
} from '../controllers/portfolio.controller'
import {
  PORTFOLIO_TEMPLATES,
  SECTION_TYPES,
  THEME_FONTS,
  THEME_HEADING_FONTS,
  THEME_ACCENTS,
  THEME_BACKGROUNDS,
  THEME_RADII,
  THEME_ANIMATIONS,
} from '../models/Portfolio'

const router = Router()

// All portfolio routes require authentication
router.use(authenticate)

// ─── Validation helpers ───────────────────────────────────────────────────────

const idParam = [
  param('id').isMongoId().withMessage('Invalid portfolio ID'),
]

const createValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Portfolio name is required (max 100 characters)'),
  body('slug')
    .optional()
    .trim()
    .isLength({ min: 1, max: 80 })
    .withMessage('Slug must be 1–80 characters'),
  body('template')
    .optional()
    .isIn(PORTFOLIO_TEMPLATES)
    .withMessage(`Template must be one of: ${PORTFOLIO_TEMPLATES.join(', ')}`),
]

const updateValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Portfolio name must be 1–100 characters'),
  body('slug')
    .optional()
    .trim()
    .isLength({ min: 1, max: 80 })
    .withMessage('Slug must be 1–80 characters'),
  body('seo.title')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('SEO title must be at most 100 characters'),
  body('seo.description')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('SEO description must be at most 300 characters'),
]

const templateValidation = [
  body('template')
    .isIn(PORTFOLIO_TEMPLATES)
    .withMessage(`Template must be one of: ${PORTFOLIO_TEMPLATES.join(', ')}`),
]

const themeValidation = [
  body('font')
    .optional()
    .isIn(THEME_FONTS)
    .withMessage(`Font must be one of: ${THEME_FONTS.join(', ')}`),
  body('headingFont')
    .optional()
    .isIn(THEME_HEADING_FONTS)
    .withMessage(`Heading font must be one of: ${THEME_HEADING_FONTS.join(', ')}`),
  body('accent')
    .optional()
    .isIn(THEME_ACCENTS)
    .withMessage(`Accent must be one of: ${THEME_ACCENTS.join(', ')}`),
  body('background')
    .optional()
    .isIn(THEME_BACKGROUNDS)
    .withMessage(`Background must be one of: ${THEME_BACKGROUNDS.join(', ')}`),
  body('radius')
    .optional()
    .isIn(THEME_RADII)
    .withMessage(`Radius must be one of: ${THEME_RADII.join(', ')}`),
  body('animation')
    .optional()
    .isIn(THEME_ANIMATIONS)
    .withMessage(`Animation must be one of: ${THEME_ANIMATIONS.join(', ')}`),
]

const sectionsValidation = [
  body('sections')
    .isArray({ min: 1, max: 20 })
    .withMessage('Sections must be a non-empty array (max 20)'),
  body('sections.*.type')
    .isIn(SECTION_TYPES)
    .withMessage(`Section type must be one of: ${SECTION_TYPES.join(', ')}`),
  body('sections.*.visible')
    .isBoolean()
    .withMessage('Section visible must be a boolean'),
  body('sections.*.order')
    .isInt({ min: 0, max: 100 })
    .withMessage('Section order must be an integer 0–100'),
]

// ─── Routes ───────────────────────────────────────────────────────────────────

// Slug preview helper (GET, no body, no id param — must come before /:id)
router.get('/slug-preview', previewSlugHandler)

// Portfolio CRUD
router.post('/', createValidation, createPortfolioHandler)
router.get('/', getUserPortfoliosHandler)
router.get('/:id', idParam, getPortfolioHandler)
router.patch('/:id', [...idParam, ...updateValidation], updatePortfolioHandler)
router.delete('/:id', idParam, deletePortfolioHandler)

// Portfolio configuration sub-resources
router.patch('/:id/template', [...idParam, ...templateValidation], updateTemplateHandler)
router.patch('/:id/theme', [...idParam, ...themeValidation], updateThemeHandler)
router.patch('/:id/sections', [...idParam, ...sectionsValidation], updateSectionsHandler)

export default router
