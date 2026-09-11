/**
 * portfolio.controller.ts — HTTP handlers for /api/portfolios/* routes.
 *
 * Phase 5 handlers preserved intact.
 * Phase 6 additions:
 *   - getEditorDataHandler (GET /:id/editor)
 *   - updateOverridesHandler (PATCH /:id/overrides)
 *   - updateSelectionsHandler (PATCH /:id/selections)
 *   - validatePublishHandler (GET /:id/publish/validate)
 *   - publishPortfolioHandler (POST /:id/publish)
 *
 * Security:
 * - userId always from req.userId (authenticate middleware).
 * - Ownership enforced in every service function.
 * - No passwordHash, tokens, or auth metadata in responses.
 * - Snapshot profile is sanitized before storage (service layer).
 */
import { Request, Response, NextFunction } from 'express'
import { validationResult } from 'express-validator'
import {
  createPortfolio,
  getUserPortfolios,
  getPortfolioById,
  getPortfolioProfile,
  getEditorData,
  updatePortfolio,
  updateTemplate,
  updateTheme,
  updateSections,
  updateOverrides,
  updateSelections,
  validatePublish,
  publishPortfolio,
  deletePortfolio,
  toSafePortfolio,
  toRendererProfile,
  normalizeSlug,
  resolvePortfolioForRendering,
  getPublishedPortfolioBySlug,
  toPublicPortfolio,
  unpublishPortfolio,
} from '../services/portfolio.service'
import { createError } from '../middleware/errorHandler'
import type { PortfolioTemplate, IPortfolioTheme, IPortfolioSection } from '../models/Portfolio'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function assertValidation(req: Request): void {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const message = errors.array()[0]?.msg ?? 'Validation failed'
    throw createError(message, 400)
  }
}

function paramId(req: Request): string {
  const id = req.params['id']
  return Array.isArray(id) ? id[0] : id
}

// ─── Phase 5: CRUD ────────────────────────────────────────────────────────────

export async function createPortfolioHandler(
  req: Request, res: Response, next: NextFunction
): Promise<void> {
  try {
    assertValidation(req)
    const { name, slug, template } = req.body as {
      name: string; slug?: string; template?: PortfolioTemplate
    }
    const portfolio = await createPortfolio(req.userId!, { name, slug, template })
    res.status(201).json({ success: true, data: { portfolio: toSafePortfolio(portfolio) } })
  } catch (err) { next(err) }
}

export async function getUserPortfoliosHandler(
  req: Request, res: Response, next: NextFunction
): Promise<void> {
  try {
    const portfolios = await getUserPortfolios(req.userId!)
    res.json({ success: true, data: { portfolios: portfolios.map(toSafePortfolio) } })
  } catch (err) { next(err) }
}

export async function getPortfolioHandler(
  req: Request, res: Response, next: NextFunction
): Promise<void> {
  try {
    assertValidation(req)
    const id = paramId(req)
    const portfolio = await getPortfolioById(req.userId!, id)
    if (!portfolio) { res.status(404).json({ success: false, error: 'Portfolio not found.' }); return }
    const profile = await getPortfolioProfile(req.userId!, id)
    res.json({
      success: true,
      data: {
        portfolio: toSafePortfolio(portfolio),
        profile: profile ? toRendererProfile(profile) : null,
      },
    })
  } catch (err) { next(err) }
}

export async function updatePortfolioHandler(
  req: Request, res: Response, next: NextFunction
): Promise<void> {
  try {
    assertValidation(req)
    const id = paramId(req)
    const { name, slug, seo } = req.body as {
      name?: string; slug?: string; seo?: { title?: string; description?: string }
    }
    const portfolio = await updatePortfolio(req.userId!, id, { name, slug, seo })
    if (!portfolio) { res.status(404).json({ success: false, error: 'Portfolio not found.' }); return }
    res.json({ success: true, data: { portfolio: toSafePortfolio(portfolio) } })
  } catch (err) { next(err) }
}

export async function deletePortfolioHandler(
  req: Request, res: Response, next: NextFunction
): Promise<void> {
  try {
    assertValidation(req)
    const id = paramId(req)
    const deleted = await deletePortfolio(req.userId!, id)
    if (!deleted) { res.status(404).json({ success: false, error: 'Portfolio not found.' }); return }
    res.json({ success: true, data: { deleted: true } })
  } catch (err) { next(err) }
}

export async function updateTemplateHandler(
  req: Request, res: Response, next: NextFunction
): Promise<void> {
  try {
    assertValidation(req)
    const id = paramId(req)
    const { template } = req.body as { template: PortfolioTemplate }
    const portfolio = await updateTemplate(req.userId!, id, template)
    if (!portfolio) { res.status(404).json({ success: false, error: 'Portfolio not found.' }); return }
    res.json({ success: true, data: { portfolio: toSafePortfolio(portfolio) } })
  } catch (err) { next(err) }
}

export async function updateThemeHandler(
  req: Request, res: Response, next: NextFunction
): Promise<void> {
  try {
    assertValidation(req)
    const id = paramId(req)
    const theme = req.body as Partial<IPortfolioTheme>
    const portfolio = await updateTheme(req.userId!, id, theme)
    if (!portfolio) { res.status(404).json({ success: false, error: 'Portfolio not found.' }); return }
    res.json({ success: true, data: { portfolio: toSafePortfolio(portfolio) } })
  } catch (err) { next(err) }
}

export async function updateSectionsHandler(
  req: Request, res: Response, next: NextFunction
): Promise<void> {
  try {
    assertValidation(req)
    const id = paramId(req)
    const { sections } = req.body as { sections: IPortfolioSection[] }
    const portfolio = await updateSections(req.userId!, id, sections)
    if (!portfolio) { res.status(404).json({ success: false, error: 'Portfolio not found.' }); return }
    res.json({ success: true, data: { portfolio: toSafePortfolio(portfolio) } })
  } catch (err) { next(err) }
}

export async function getPortfolioPreviewHandler(
  req: Request, res: Response, next: NextFunction
): Promise<void> {
  try {
    assertValidation(req)
    const id = paramId(req)
    const portfolio = await getPortfolioById(req.userId!, id)
    if (!portfolio) { res.status(404).json({ success: false, error: 'Portfolio not found.' }); return }
    const profile = await getPortfolioProfile(req.userId!, id)
    res.json({
      success: true,
      data: {
        portfolio: toSafePortfolio(portfolio),
        profile: profile ? toRendererProfile(profile) : null,
      },
    })
  } catch (err) { next(err) }
}

export async function previewSlugHandler(
  req: Request, res: Response, next: NextFunction
): Promise<void> {
  try {
    const { name } = req.query as { name?: string }
    const slug = normalizeSlug(name ?? 'my-portfolio')
    res.json({ success: true, data: { slug } })
  } catch (err) { next(err) }
}

// ─── Phase 6: Editor data ─────────────────────────────────────────────────────

/**
 * GET /:id/editor
 *
 * Returns everything the Phase 6 editor needs in one request:
 *   - Full portfolio config (with overrides, selections, publishedSnapshot)
 *   - Full master profile (for selection UI — showing all available entries)
 *   - Resolved preview profile (overrides + selections applied)
 */
export async function getEditorDataHandler(
  req: Request, res: Response, next: NextFunction
): Promise<void> {
  try {
    assertValidation(req)
    const id = paramId(req)
    const data = await getEditorData(req.userId!, id)
    if (!data) { res.status(404).json({ success: false, error: 'Portfolio not found.' }); return }

    const { portfolio, profile } = data
    const resolvedProfile = resolvePortfolioForRendering(portfolio, profile)

    res.json({
      success: true,
      data: {
        portfolio: toSafePortfolio(portfolio),
        // Master profile — for selection UI (all entries with _id)
        masterProfile: toRendererProfile(profile),
        // Resolved profile — for live preview (overrides + selections applied)
        resolvedProfile,
      },
    })
  } catch (err) { next(err) }
}

// ─── Phase 6: Overrides ───────────────────────────────────────────────────────

export async function updateOverridesHandler(
  req: Request, res: Response, next: NextFunction
): Promise<void> {
  try {
    assertValidation(req)
    const id = paramId(req)
    const overrides = req.body as {
      headline?: string | null
      about?: string | null
      location?: string | null
      website?: string | null
      socialLinks?: Array<{ platform: string; url: string }> | null
    }

    // Convert null to undefined (null = clear the override)
    const normalized = {
      ...('headline' in overrides ? { headline: overrides.headline ?? undefined } : {}),
      ...('about' in overrides ? { about: overrides.about ?? undefined } : {}),
      ...('location' in overrides ? { location: overrides.location ?? undefined } : {}),
      ...('website' in overrides ? { website: overrides.website ?? undefined } : {}),
      ...('socialLinks' in overrides ? { socialLinks: overrides.socialLinks ?? undefined } : {}),
    }

    const portfolio = await updateOverrides(req.userId!, id, normalized)
    if (!portfolio) { res.status(404).json({ success: false, error: 'Portfolio not found.' }); return }
    res.json({ success: true, data: { portfolio: toSafePortfolio(portfolio) } })
  } catch (err) { next(err) }
}

// ─── Phase 6: Selections ──────────────────────────────────────────────────────

export async function updateSelectionsHandler(
  req: Request, res: Response, next: NextFunction
): Promise<void> {
  try {
    assertValidation(req)
    const id = paramId(req)
    const body = req.body as {
      featuredProjects?: string[]
      visibleExperience?: string[]
      visibleEducation?: string[]
      visibleCertifications?: string[]
    }

    const result = await updateSelections(req.userId!, id, body)
    res.json({
      success: true,
      data: {
        portfolio: toSafePortfolio(result.portfolio),
        warnings: result.warnings,
      },
    })
  } catch (err) { next(err) }
}

// ─── Phase 6: Publish ─────────────────────────────────────────────────────────

/**
 * GET /:id/publish/validate
 * Pre-validate without publishing — gives the user a clear list of errors.
 */
export async function validatePublishHandler(
  req: Request, res: Response, next: NextFunction
): Promise<void> {
  try {
    assertValidation(req)
    const id = paramId(req)

    // Check ownership first — return 404 (not a validation result) if not owned
    const portfolio = await getPortfolioById(req.userId!, id)
    if (!portfolio) {
      res.status(404).json({ success: false, error: 'Portfolio not found.' })
      return
    }

    const result = await validatePublish(req.userId!, id)
    res.json({ success: true, data: result })
  } catch (err) { next(err) }
}

/**
 * POST /:id/publish
 * Validate → resolve → create immutable snapshot → update status.
 */
export async function publishPortfolioHandler(
  req: Request, res: Response, next: NextFunction
): Promise<void> {
  try {
    assertValidation(req)
    const id = paramId(req)

    // Explicit ownership check — return 404 before any processing
    const owned = await getPortfolioById(req.userId!, id)
    if (!owned) {
      res.status(404).json({ success: false, error: 'Portfolio not found.' })
      return
    }

    let result: Awaited<ReturnType<typeof publishPortfolio>>
    try {
      result = await publishPortfolio(req.userId!, id)
    } catch (err) {
      if (err instanceof Error) {
        const code = (err as { statusCode?: number }).statusCode
        const msg = err.message

        // Portfolio not found — ownership failure — return 404
        if (code === 404 || msg === 'Portfolio not found.' || msg === 'Linked profile not found.') {
          res.status(404).json({ success: false, error: msg })
          return
        }
        // Validation failure (422) — return structured errors
        if (code === 422) {
          const validationErrors = (err as { validationErrors?: string[] }).validationErrors ?? [msg]
          res.status(422).json({
            success: false,
            error: msg,
            data: { validationErrors },
          })
          return
        }
      }
      throw err
    }

    res.json({
      success: true,
      data: {
        portfolio: toSafePortfolio(result.portfolio),
        validation: result.validation,
        publishedAt: result.portfolio.lastPublishedAt,
      },
    })
  } catch (err) { next(err) }
}

// ─── Phase 7: Public portfolio access ────────────────────────────────────────

/**
 * GET /api/public/portfolio/:slug
 *
 * Public endpoint — NO authentication required.
 * Returns the published snapshot for a given slug.
 *
 * Security:
 * - Only published portfolios are returned.
 * - Slug is normalized/validated before the DB query.
 * - Response uses toPublicPortfolio() allowlist serialization.
 * - No draft data, no auth metadata, no secrets exposed.
 * - No req.userId is used — this is purely public.
 */
export async function getPublicPortfolioHandler(
  req: Request, res: Response, next: NextFunction
): Promise<void> {
  try {
    const rawSlug = req.params['slug']
    if (!rawSlug || typeof rawSlug !== 'string') {
      res.status(404).json({ success: false, error: 'Portfolio not found.' })
      return
    }

    const portfolio = await getPublishedPortfolioBySlug(rawSlug)

    if (!portfolio || !portfolio.publishedSnapshot) {
      // Return the same 404 regardless of whether the slug exists as a draft
      // — never leak whether a private draft exists at this slug
      res.status(404).json({
        success: false,
        error: 'Portfolio not found or not yet published.',
      })
      return
    }

    const publicData = toPublicPortfolio(portfolio as never)

    // Verify none of the forbidden fields leaked through (extra safety layer)
    const serialized = JSON.stringify(publicData)
    if (
      serialized.includes('passwordHash') ||
      serialized.includes('emailVerificationToken') ||
      serialized.includes('passwordResetToken') ||
      serialized.includes('JWT_SECRET') ||
      serialized.includes('AI_API_KEY')
    ) {
      // This should never happen — log and return safe error
      console.error('[Security] Forbidden field detected in public portfolio response — suppressed')
      res.status(500).json({ success: false, error: 'Internal error. Please try again.' })
      return
    }

    res.json({
      success: true,
      data: publicData,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/portfolios/:id/unpublish
 *
 * Authenticated owner endpoint.
 * Changes portfolio status from 'published' to 'draft'.
 * Preserves the publishedSnapshot for history.
 */
export async function unpublishPortfolioHandler(
  req: Request, res: Response, next: NextFunction
): Promise<void> {
  try {
    assertValidation(req)
    const id = paramId(req)

    const portfolio = await unpublishPortfolio(req.userId!, id)
    if (!portfolio) {
      res.status(404).json({ success: false, error: 'Portfolio not found.' })
      return
    }

    res.json({
      success: true,
      data: { portfolio: toSafePortfolio(portfolio) },
    })
  } catch (err) {
    next(err)
  }
}
