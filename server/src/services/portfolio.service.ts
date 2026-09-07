/**
 * portfolio.service.ts — Portfolio business logic.
 *
 * Pure functions — no HTTP concerns.
 * All functions that accept a userId enforce ownership:
 * queries always include { userId } so users can never
 * access or modify another user's portfolio.
 *
 * The Profile document is the source of truth for professional content.
 * Portfolio only stores presentation/configuration data.
 */
import mongoose from 'mongoose'
import { Portfolio, IPortfolio, IPortfolioSection, IPortfolioTheme, IPortfolioSeo, DEFAULT_SECTIONS, DEFAULT_THEME, PortfolioTemplate, SectionType, SECTION_TYPES } from '../models/Portfolio'
import { Profile, IProfile } from '../models/Profile'
import { getOrCreateProfile } from './profile.service'

// ─── Safe serialization ───────────────────────────────────────────────────────

/**
 * Convert a Portfolio document to a plain object safe for API responses.
 * Removes __v.
 */
export function toSafePortfolio(portfolio: IPortfolio): Record<string, unknown> {
  const obj = portfolio.toObject()
  delete obj.__v
  return {
    ...obj,
    _id: String(obj._id),
    userId: String(obj.userId),
    profileId: String(obj.profileId),
    // Explicitly include seo — Mongoose may omit empty embedded docs
    seo: {
      title: portfolio.seo?.title ?? undefined,
      description: portfolio.seo?.description ?? undefined,
    },
  }
}

// ─── Slug helpers ─────────────────────────────────────────────────────────────

/**
 * Normalize a string to a safe URL slug:
 * lowercase, letters/digits only, hyphens for separators.
 */
export function normalizeSlug(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'my-portfolio'
}

/**
 * Check that a slug is unique for this user (excluding a specific portfolio id).
 * Throws a 409 conflict error if already taken.
 */
async function assertSlugUnique(userId: string, slug: string, excludeId?: string): Promise<void> {
  const query: Record<string, unknown> = {
    userId: new mongoose.Types.ObjectId(userId),
    slug,
  }
  if (excludeId) {
    query['_id'] = { $ne: new mongoose.Types.ObjectId(excludeId) }
  }
  const existing = await Portfolio.findOne(query)
  if (existing) {
    throw Object.assign(
      new Error(`You already have a portfolio with the slug "${slug}". Choose a different name or slug.`),
      { statusCode: 409 }
    )
  }
}

// ─── Create ───────────────────────────────────────────────────────────────────

export interface CreatePortfolioInput {
  name: string
  slug?: string
  template?: PortfolioTemplate
}

export async function createPortfolio(
  userId: string,
  data: CreatePortfolioInput
): Promise<IPortfolio> {
  // Get or create the user's profile — portfolios always reference a profile
  const profile = await getOrCreateProfile(userId)

  const slug = normalizeSlug(data.slug || data.name)
  await assertSlugUnique(userId, slug)

  const portfolio = await Portfolio.create({
    userId: new mongoose.Types.ObjectId(userId),
    profileId: profile._id,
    name: data.name.trim(),
    slug,
    template: data.template ?? 'editorial',
    sections: DEFAULT_SECTIONS.map((s) => ({ ...s })),
    theme: { ...DEFAULT_THEME },
    seo: {},
    status: 'draft',
  })

  return portfolio
}

// ─── Read ─────────────────────────────────────────────────────────────────────

/**
 * Get all portfolios for a user, ordered newest first.
 * Never returns another user's portfolios.
 */
export async function getUserPortfolios(userId: string): Promise<IPortfolio[]> {
  return Portfolio.find({
    userId: new mongoose.Types.ObjectId(userId),
  }).sort({ createdAt: -1 })
}

/**
 * Get one portfolio by id, enforcing ownership.
 * Returns null if not found or owned by a different user.
 */
export async function getPortfolioById(
  userId: string,
  portfolioId: string
): Promise<IPortfolio | null> {
  if (!mongoose.Types.ObjectId.isValid(portfolioId)) return null
  return Portfolio.findOne({
    _id: new mongoose.Types.ObjectId(portfolioId),
    userId: new mongoose.Types.ObjectId(userId),
  })
}

/**
 * Get the profile linked to a portfolio, enforcing that the profile
 * also belongs to the same user.
 */
export async function getPortfolioProfile(
  userId: string,
  portfolioId: string
): Promise<IProfile | null> {
  const portfolio = await getPortfolioById(userId, portfolioId)
  if (!portfolio) return null
  return Profile.findOne({
    _id: portfolio.profileId,
    userId: new mongoose.Types.ObjectId(userId),
  })
}

// ─── Update ───────────────────────────────────────────────────────────────────

export interface UpdatePortfolioInput {
  name?: string
  slug?: string
  seo?: IPortfolioSeo
}

export async function updatePortfolio(
  userId: string,
  portfolioId: string,
  data: UpdatePortfolioInput
): Promise<IPortfolio | null> {
  const portfolio = await getPortfolioById(userId, portfolioId)
  if (!portfolio) return null

  if (data.name !== undefined) {
    portfolio.name = data.name.trim()
  }

  if (data.slug !== undefined) {
    const normalized = normalizeSlug(data.slug)
    await assertSlugUnique(userId, normalized, portfolioId)
    portfolio.slug = normalized
  }

  if (data.seo !== undefined) {
    portfolio.seo = {
      title: data.seo.title?.trim(),
      description: data.seo.description?.trim(),
    }
  }

  await portfolio.save()
  return portfolio
}

/**
 * Update the template selection.
 * Does NOT modify the Profile.
 */
export async function updateTemplate(
  userId: string,
  portfolioId: string,
  template: PortfolioTemplate
): Promise<IPortfolio | null> {
  const portfolio = await getPortfolioById(userId, portfolioId)
  if (!portfolio) return null

  portfolio.template = template
  await portfolio.save()
  return portfolio
}

/**
 * Update theme configuration.
 * Only predefined values are accepted — validated in controller.
 */
export async function updateTheme(
  userId: string,
  portfolioId: string,
  theme: Partial<IPortfolioTheme>
): Promise<IPortfolio | null> {
  const portfolio = await getPortfolioById(userId, portfolioId)
  if (!portfolio) return null

  // Merge with existing theme — only update provided fields
  portfolio.theme = {
    font:        theme.font        ?? portfolio.theme.font,
    headingFont: theme.headingFont ?? portfolio.theme.headingFont,
    accent:      theme.accent      ?? portfolio.theme.accent,
    background:  theme.background  ?? portfolio.theme.background,
    radius:      theme.radius      ?? portfolio.theme.radius,
    animation:   theme.animation   ?? portfolio.theme.animation,
  }

  await portfolio.save()
  return portfolio
}

/**
 * Replace the section configuration.
 * Validates that all types are from the allowed enum.
 * Validates that each type appears at most once.
 * Does NOT accept arbitrary HTML or component names.
 */
export async function updateSections(
  userId: string,
  portfolioId: string,
  sections: IPortfolioSection[]
): Promise<IPortfolio | null> {
  const portfolio = await getPortfolioById(userId, portfolioId)
  if (!portfolio) return null

  // Ensure all section types are valid
  const validTypes = new Set<string>(SECTION_TYPES)
  for (const section of sections) {
    if (!validTypes.has(section.type)) {
      throw Object.assign(
        new Error(`Invalid section type: "${section.type}"`),
        { statusCode: 400 }
      )
    }
  }

  // Ensure no duplicate types
  const typesSeen = new Set<SectionType>()
  for (const section of sections) {
    if (typesSeen.has(section.type)) {
      throw Object.assign(
        new Error(`Duplicate section type: "${section.type}"`),
        { statusCode: 400 }
      )
    }
    typesSeen.add(section.type)
  }

  portfolio.sections = sections as IPortfolio['sections']
  await portfolio.save()
  return portfolio
}

// ─── Delete ───────────────────────────────────────────────────────────────────

/**
 * Delete a portfolio by id, enforcing ownership.
 * Returns true if deleted, false if not found or not owned.
 */
export async function deletePortfolio(
  userId: string,
  portfolioId: string
): Promise<boolean> {
  if (!mongoose.Types.ObjectId.isValid(portfolioId)) return false
  const result = await Portfolio.deleteOne({
    _id: new mongoose.Types.ObjectId(portfolioId),
    userId: new mongoose.Types.ObjectId(userId),
  })
  return result.deletedCount === 1
}

// ─── Profile data for renderer ────────────────────────────────────────────────

/**
 * Safe profile representation for portfolio rendering.
 * Excludes internal fields not needed by the renderer.
 * Does NOT exclude professional content — that's what gets displayed.
 */
export function toRendererProfile(profile: IProfile) {
  return {
    fullName: profile.fullName,
    headline: profile.headline,
    profilePhoto: profile.profilePhoto,
    location: profile.location,
    email: profile.email,
    phone: profile.phone,
    website: profile.website,
    linkedinUrl: profile.linkedinUrl,
    githubUrl: profile.githubUrl,
    about: profile.about,
    skills: profile.skills.map((s) => ({
      _id: String(s._id),
      name: s.name,
    })),
    experience: profile.experience.map((e) => ({
      _id: String(e._id),
      title: e.title,
      company: e.company,
      location: e.location,
      startDate: e.startDate,
      endDate: e.endDate,
      current: e.current,
      description: e.description,
    })),
    education: profile.education.map((edu) => ({
      _id: String(edu._id),
      institution: edu.institution,
      degree: edu.degree,
      field: edu.field,
      startDate: edu.startDate,
      endDate: edu.endDate,
      description: edu.description,
    })),
    projects: profile.projects.map((p) => ({
      _id: String(p._id),
      name: p.name,
      description: p.description,
      url: p.url,
      repoUrl: p.repoUrl,
      technologies: p.technologies,
    })),
    certifications: profile.certifications.map((c) => ({
      _id: String(c._id),
      name: c.name,
      issuer: c.issuer,
      date: c.date,
      url: c.url,
    })),
    achievements: profile.achievements.map((a) => ({
      _id: String(a._id),
      title: a.title,
      description: a.description,
      date: a.date,
    })),
    publications: profile.publications.map((pub) => ({
      _id: String(pub._id),
      title: pub.title,
      publisher: pub.publisher,
      date: pub.date,
      url: pub.url,
    })),
    languages: profile.languages.map((l) => ({
      _id: String(l._id),
      name: l.name,
      proficiency: l.proficiency,
    })),
    socialLinks: profile.socialLinks.map((sl) => ({
      _id: String(sl._id),
      platform: sl.platform,
      url: sl.url,
    })),
  }
}

export type RendererProfile = ReturnType<typeof toRendererProfile>
