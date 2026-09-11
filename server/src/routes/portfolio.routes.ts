/**
 * portfolio.routes.ts — /api/portfolios/* router (Phase 5 + Phase 6).
 *
 * All routes require authentication.
 *
 * Phase 5 routes (preserved):
 *   GET    /slug-preview
 *   POST   /
 *   GET    /
 *   GET    /:id
 *   PATCH  /:id
 *   DELETE /:id
 *   PATCH  /:id/template
 *   PATCH  /:id/theme
 *   PATCH  /:id/sections
 *
 * Phase 6 additions:
 *   GET    /:id/editor              — editor bundle (portfolio + masterProfile + resolvedProfile)
 *   PATCH  /:id/overrides           — update/clear controlled overrides
 *   PATCH  /:id/selections          — update entry selections
 *   GET    /:id/publish/validate    — pre-validate without publishing
 *   POST   /:id/publish             — publish (validate + resolve + snapshot)
 */
import { Router } from 'express'
import { body, param } from 'express-validator'
import { authenticate } from '../middleware/authenticate'
import { publishLimiter } from '../middleware/rateLimiter'
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
  // Phase 6
  getEditorDataHandler,
  updateOverridesHandler,
  updateSelectionsHandler,
  validatePublishHandler,
  publishPortfolioHandler,
  // Phase 7
  unpublishPortfolioHandler,
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
router.use(authenticate)

// ─── Validation helpers ───────────────────────────────────────────────────────

const idParam = [
  param('id').isMongoId().withMessage('Invalid portfolio ID'),
]

const createValidation = [
  body('name')
    .trim().isLength({ min: 1, max: 100 })
    .withMessage('Portfolio name is required (max 100 characters)'),
  body('slug')
    .optional().trim().isLength({ min: 1, max: 80 })
    .withMessage('Slug must be 1–80 characters'),
  body('template')
    .optional().isIn(PORTFOLIO_TEMPLATES)
    .withMessage(`Template must be one of: ${PORTFOLIO_TEMPLATES.join(', ')}`),
]

const updateValidation = [
  body('name')
    .optional().trim().isLength({ min: 1, max: 100 })
    .withMessage('Portfolio name must be 1–100 characters'),
  body('slug')
    .optional().trim().isLength({ min: 1, max: 80 })
    .withMessage('Slug must be 1–80 characters'),
  body('seo.title')
    .optional().trim().isLength({ max: 100 })
    .withMessage('SEO title must be at most 100 characters'),
  body('seo.description')
    .optional().trim().isLength({ max: 300 })
    .withMessage('SEO description must be at most 300 characters'),
]

const templateValidation = [
  body('template')
    .isIn(PORTFOLIO_TEMPLATES)
    .withMessage(`Template must be one of: ${PORTFOLIO_TEMPLATES.join(', ')}`),
]

const themeValidation = [
  body('font').optional().isIn(THEME_FONTS).withMessage(`Font must be one of: ${THEME_FONTS.join(', ')}`),
  body('headingFont').optional().isIn(THEME_HEADING_FONTS).withMessage(`Heading font must be one of: ${THEME_HEADING_FONTS.join(', ')}`),
  body('accent').optional().isIn(THEME_ACCENTS).withMessage(`Accent must be one of: ${THEME_ACCENTS.join(', ')}`),
  body('background').optional().isIn(THEME_BACKGROUNDS).withMessage(`Background must be one of: ${THEME_BACKGROUNDS.join(', ')}`),
  body('radius').optional().isIn(THEME_RADII).withMessage(`Radius must be one of: ${THEME_RADII.join(', ')}`),
  body('animation').optional().isIn(THEME_ANIMATIONS).withMessage(`Animation must be one of: ${THEME_ANIMATIONS.join(', ')}`),
]

const sectionsValidation = [
  body('sections')
    .isArray({ min: 1, max: 20 })
    .withMessage('Sections must be a non-empty array (max 20)'),
  body('sections.*.type')
    .isIn(SECTION_TYPES)
    .withMessage(`Section type must be one of: ${SECTION_TYPES.join(', ')}`),
  body('sections.*.visible')
    .isBoolean().withMessage('Section visible must be a boolean'),
  body('sections.*.order')
    .isInt({ min: 0, max: 100 }).withMessage('Section order must be an integer 0–100'),
]

// Phase 6 validation

const overridesValidation = [
  body('headline')
    .optional({ nullable: true }).trim().isLength({ max: 300 })
    .withMessage('Headline override must be at most 300 characters'),
  body('about')
    .optional({ nullable: true }).trim().isLength({ max: 10000 })
    .withMessage('About override must be at most 10,000 characters'),
  body('location')
    .optional({ nullable: true }).trim().isLength({ max: 200 })
    .withMessage('Location override must be at most 200 characters'),
  body('website')
    .optional({ nullable: true }).trim().isLength({ max: 500 })
    .withMessage('Website override must be at most 500 characters'),
  body('socialLinks')
    .optional({ nullable: true }).isArray({ max: 20 })
    .withMessage('Social links must be an array (max 20)'),
  body('socialLinks.*.platform')
    .optional().trim().isLength({ min: 1, max: 50 })
    .withMessage('Social link platform is required (max 50 characters)'),
  body('socialLinks.*.url')
    .optional().trim().isLength({ min: 1, max: 500 })
    .withMessage('Social link URL is required (max 500 characters)'),
]

const selectionsValidation = [
  body('featuredProjects')
    .optional().isArray({ max: 50 })
    .withMessage('featuredProjects must be an array (max 50)'),
  body('featuredProjects.*')
    .optional().isMongoId()
    .withMessage('Each project ID must be a valid MongoDB ObjectId'),
  body('visibleExperience')
    .optional().isArray({ max: 50 })
    .withMessage('visibleExperience must be an array (max 50)'),
  body('visibleExperience.*')
    .optional().isMongoId()
    .withMessage('Each experience ID must be a valid MongoDB ObjectId'),
  body('visibleEducation')
    .optional().isArray({ max: 50 })
    .withMessage('visibleEducation must be an array (max 50)'),
  body('visibleEducation.*')
    .optional().isMongoId()
    .withMessage('Each education ID must be a valid MongoDB ObjectId'),
  body('visibleCertifications')
    .optional().isArray({ max: 50 })
    .withMessage('visibleCertifications must be an array (max 50)'),
  body('visibleCertifications.*')
    .optional().isMongoId()
    .withMessage('Each certification ID must be a valid MongoDB ObjectId'),
]

// ─── Routes ───────────────────────────────────────────────────────────────────

// Slug preview (before /:id to avoid param collision)
router.get('/slug-preview', previewSlugHandler)

// Phase 5 CRUD
router.post('/', createValidation, createPortfolioHandler)
router.get('/', getUserPortfoliosHandler)
router.get('/:id', idParam, getPortfolioHandler)
router.patch('/:id', [...idParam, ...updateValidation], updatePortfolioHandler)
router.delete('/:id', idParam, deletePortfolioHandler)

// Phase 5 sub-resources
router.patch('/:id/template', [...idParam, ...templateValidation], updateTemplateHandler)
router.patch('/:id/theme', [...idParam, ...themeValidation], updateThemeHandler)
router.patch('/:id/sections', [...idParam, ...sectionsValidation], updateSectionsHandler)

// Phase 6: Editor data bundle
router.get('/:id/editor', idParam, getEditorDataHandler)

// Phase 6: Overrides and selections
router.patch('/:id/overrides', [...idParam, ...overridesValidation], updateOverridesHandler)
router.patch('/:id/selections', [...idParam, ...selectionsValidation], updateSelectionsHandler)

// Phase 6: Publish (validate-then-publish route must be before /publish to avoid collision)
router.get('/:id/publish/validate', idParam, validatePublishHandler)
router.post('/:id/publish', [...idParam], publishLimiter, publishPortfolioHandler)

// Phase 7: Unpublish
router.post('/:id/unpublish', idParam, unpublishPortfolioHandler)

export default router
