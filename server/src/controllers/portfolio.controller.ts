/**
 * portfolio.controller.ts — HTTP handlers for /api/portfolios/* routes.
 *
 * Thin HTTP translation layer:
 *   1. Validate input (express-validator)
 *   2. Call service
 *   3. Return { success, data } response
 *   4. next(err) on failure
 *
 * Security:
 * - userId always comes from req.userId (set by authenticate middleware).
 * - Client-provided user IDs are NEVER trusted.
 * - Ownership enforced in every service function.
 * - No passwordHash, tokens, or auth metadata in responses.
 */
import { Request, Response, NextFunction } from 'express'
import { validationResult } from 'express-validator'
import {
  createPortfolio,
  getUserPortfolios,
  getPortfolioById,
  getPortfolioProfile,
  updatePortfolio,
  updateTemplate,
  updateTheme,
  updateSections,
  deletePortfolio,
  toSafePortfolio,
  toRendererProfile,
  normalizeSlug,
} from '../services/portfolio.service'
import { createError } from '../middleware/errorHandler'
import type { PortfolioTemplate, IPortfolioTheme, IPortfolioSection } from '../models/Portfolio'

/** Read express-validator results and throw 400 if invalid. */
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

// ─── POST /api/portfolios ─────────────────────────────────────────────────────

export async function createPortfolioHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    assertValidation(req)

    const { name, slug, template } = req.body as {
      name: string
      slug?: string
      template?: PortfolioTemplate
    }

    const portfolio = await createPortfolio(req.userId!, { name, slug, template })

    res.status(201).json({
      success: true,
      data: { portfolio: toSafePortfolio(portfolio) },
    })
  } catch (err) {
    next(err)
  }
}

// ─── GET /api/portfolios ──────────────────────────────────────────────────────

export async function getUserPortfoliosHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const portfolios = await getUserPortfolios(req.userId!)
    res.json({
      success: true,
      data: { portfolios: portfolios.map(toSafePortfolio) },
    })
  } catch (err) {
    next(err)
  }
}

// ─── GET /api/portfolios/:id ──────────────────────────────────────────────────

export async function getPortfolioHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    assertValidation(req)
    const id = paramId(req)
    const portfolio = await getPortfolioById(req.userId!, id)
    if (!portfolio) {
      res.status(404).json({ success: false, error: 'Portfolio not found.' })
      return
    }

    // Also fetch the linked profile for the renderer
    const profile = await getPortfolioProfile(req.userId!, id)

    res.json({
      success: true,
      data: {
        portfolio: toSafePortfolio(portfolio),
        profile: profile ? toRendererProfile(profile) : null,
      },
    })
  } catch (err) {
    next(err)
  }
}

// ─── PATCH /api/portfolios/:id ────────────────────────────────────────────────

export async function updatePortfolioHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    assertValidation(req)
    const id = paramId(req)
    const { name, slug, seo } = req.body as {
      name?: string
      slug?: string
      seo?: { title?: string; description?: string }
    }

    const portfolio = await updatePortfolio(req.userId!, id, { name, slug, seo })
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

// ─── DELETE /api/portfolios/:id ───────────────────────────────────────────────

export async function deletePortfolioHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    assertValidation(req)
    const id = paramId(req)
    const deleted = await deletePortfolio(req.userId!, id)
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Portfolio not found.' })
      return
    }
    res.json({ success: true, data: { deleted: true } })
  } catch (err) {
    next(err)
  }
}

// ─── PATCH /api/portfolios/:id/template ──────────────────────────────────────

export async function updateTemplateHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    assertValidation(req)
    const id = paramId(req)
    const { template } = req.body as { template: PortfolioTemplate }

    const portfolio = await updateTemplate(req.userId!, id, template)
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

// ─── PATCH /api/portfolios/:id/theme ─────────────────────────────────────────

export async function updateThemeHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    assertValidation(req)
    const id = paramId(req)
    const theme = req.body as Partial<IPortfolioTheme>

    const portfolio = await updateTheme(req.userId!, id, theme)
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

// ─── PATCH /api/portfolios/:id/sections ──────────────────────────────────────

export async function updateSectionsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    assertValidation(req)
    const id = paramId(req)
    const { sections } = req.body as { sections: IPortfolioSection[] }

    const portfolio = await updateSections(req.userId!, id, sections)
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

// ─── GET /api/portfolios/:id/preview ─────────────────────────────────────────
// Returns portfolio config + renderer-safe profile in one call for the workspace.

export async function getPortfolioPreviewHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    assertValidation(req)
    const id = paramId(req)
    const portfolio = await getPortfolioById(req.userId!, id)
    if (!portfolio) {
      res.status(404).json({ success: false, error: 'Portfolio not found.' })
      return
    }

    const profile = await getPortfolioProfile(req.userId!, id)

    res.json({
      success: true,
      data: {
        portfolio: toSafePortfolio(portfolio),
        profile: profile ? toRendererProfile(profile) : null,
      },
    })
  } catch (err) {
    next(err)
  }
}

// ─── Slug preview helper ──────────────────────────────────────────────────────

export async function previewSlugHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name } = req.query as { name?: string }
    const slug = normalizeSlug(name ?? 'my-portfolio')
    res.json({ success: true, data: { slug } })
  } catch (err) {
    next(err)
  }
}
