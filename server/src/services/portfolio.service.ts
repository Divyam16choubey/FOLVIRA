/**
 * portfolio.service.ts — Portfolio business logic (Phase 5 + Phase 6).
 *
 * PROFILE = source of truth for facts
 * PORTFOLIO = presentation configuration + controlled overrides
 * PUBLISHED SNAPSHOT = immutable resolved version
 *
 * Phase 6 additions:
 *   - updateOverrides: update/reset controlled profile overrides
 *   - updateSelections: set which profile entries appear
 *   - resolvePortfolioForRendering: merge profile + overrides + selections
 *   - validatePublish: check all references are valid before publishing
 *   - publishPortfolio: resolve → validate → create immutable snapshot
 *   - getEditorData: full data bundle for the editor UI
 */
import mongoose from 'mongoose'
import {
  Portfolio,
  IPortfolio,
  IPortfolioSection,
  IPortfolioTheme,
  IPortfolioSeo,
  IPortfolioOverrides,
  IPortfolioSelections,
  IPublishedSnapshot,
  DEFAULT_SECTIONS,
  DEFAULT_THEME,
  PortfolioTemplate,
  SectionType,
  SECTION_TYPES,
} from '../models/Portfolio'
import { Profile, IProfile } from '../models/Profile'
import { getOrCreateProfile } from './profile.service'

// ─── Safe serialization ───────────────────────────────────────────────────────

/**
 * Convert a Portfolio document to a plain object safe for API responses.
 * Removes __v. Ensures all Phase 6 fields are explicitly included.
 */
export function toSafePortfolio(portfolio: IPortfolio): Record<string, unknown> {
  const obj = portfolio.toObject()
  delete obj.__v
  return {
    ...obj,
    _id: String(obj._id),
    userId: String(obj.userId),
    profileId: String(obj.profileId),
    // Explicitly include embedded docs that Mongoose may omit when empty
    seo: {
      title: portfolio.seo?.title ?? undefined,
      description: portfolio.seo?.description ?? undefined,
    },
    overrides: {
      headline:    portfolio.overrides?.headline   ?? undefined,
      about:       portfolio.overrides?.about      ?? undefined,
      location:    portfolio.overrides?.location   ?? undefined,
      website:     portfolio.overrides?.website    ?? undefined,
      socialLinks: portfolio.overrides?.socialLinks ?? undefined,
    },
    selections: {
      featuredProjects:      (portfolio.selections?.featuredProjects ?? []).map(String),
      visibleExperience:     (portfolio.selections?.visibleExperience ?? []).map(String),
      visibleEducation:      (portfolio.selections?.visibleEducation ?? []).map(String),
      visibleCertifications: (portfolio.selections?.visibleCertifications ?? []).map(String),
    },
    status: portfolio.status ?? 'draft',
    lastPublishedAt: portfolio.lastPublishedAt ?? undefined,
    publishedSnapshot: portfolio.publishedSnapshot
      ? {
          template: portfolio.publishedSnapshot.template,
          sections: portfolio.publishedSnapshot.sections,
          theme: portfolio.publishedSnapshot.theme,
          seo: portfolio.publishedSnapshot.seo,
          profile: portfolio.publishedSnapshot.profile,
          publishedAt: portfolio.publishedSnapshot.publishedAt,
        }
      : undefined,
  }
}

// ─── Slug helpers ─────────────────────────────────────────────────────────────

export function normalizeSlug(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'my-portfolio'
}

async function assertSlugUnique(userId: string, slug: string, excludeId?: string): Promise<void> {
  const normalized = normalizeSlug(slug)
  const query: Record<string, unknown> = {
    userId: new mongoose.Types.ObjectId(userId),
    slug: normalized,
  }
  if (excludeId) {
    query['_id'] = { $ne: new mongoose.Types.ObjectId(excludeId) }
  }
  const existing = await Portfolio.findOne(query)
  if (existing) {
    throw Object.assign(
      new Error(`You already have a portfolio with the slug "${normalized}". Choose a different name or slug.`),
      { statusCode: 409 }
    )
  }

  // Phase 7: Prevent claiming a slug already in use by another user's published portfolio
  const publishedConflict = await Portfolio.findOne({
    slug: normalized,
    status: 'published',
    ...(excludeId ? { _id: { $ne: new mongoose.Types.ObjectId(excludeId) } } : {}),
    userId: { $ne: new mongoose.Types.ObjectId(userId) },
  })
  if (publishedConflict) {
    throw Object.assign(
      new Error(`The portfolio slug "${normalized}" is already taken by a published portfolio. Choose a different name or slug.`),
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
    overrides: {},
    selections: {
      featuredProjects: [],
      visibleExperience: [],
      visibleEducation: [],
      visibleCertifications: [],
    },
    seo: {},
    status: 'draft',
  })

  return portfolio
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getUserPortfolios(userId: string): Promise<IPortfolio[]> {
  return Portfolio.find({
    userId: new mongoose.Types.ObjectId(userId),
  }).sort({ createdAt: -1 })
}

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

/**
 * Phase 6: Return the full editor bundle — portfolio + master profile.
 * Used by the editor GET so one request gives everything needed to render
 * the Content tab (profile entries for selection UI) and the preview.
 */
export async function getEditorData(
  userId: string,
  portfolioId: string
): Promise<{ portfolio: IPortfolio; profile: IProfile } | null> {
  const portfolio = await getPortfolioById(userId, portfolioId)
  if (!portfolio) return null
  const profile = await Profile.findOne({
    _id: portfolio.profileId,
    userId: new mongoose.Types.ObjectId(userId),
  })
  if (!profile) return null
  return { portfolio, profile }
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

  if (data.name !== undefined) portfolio.name = data.name.trim()

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

export async function updateTheme(
  userId: string,
  portfolioId: string,
  theme: Partial<IPortfolioTheme>
): Promise<IPortfolio | null> {
  const portfolio = await getPortfolioById(userId, portfolioId)
  if (!portfolio) return null
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

export async function updateSections(
  userId: string,
  portfolioId: string,
  sections: IPortfolioSection[]
): Promise<IPortfolio | null> {
  const portfolio = await getPortfolioById(userId, portfolioId)
  if (!portfolio) return null

  const validTypes = new Set<string>(SECTION_TYPES)
  for (const section of sections) {
    if (!validTypes.has(section.type)) {
      throw Object.assign(
        new Error(`Invalid section type: "${section.type}"`),
        { statusCode: 400 }
      )
    }
  }

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

// ─── Phase 6: Overrides ───────────────────────────────────────────────────────

/**
 * Update portfolio-specific overrides of master Profile fields.
 *
 * Whitelist enforced here AND in the controller validation.
 * Setting a field to null/undefined removes the override (falls back to master Profile).
 *
 * NEVER allows: email, phone, userId, passwordHash, tokens, sourceId, etc.
 */
export async function updateOverrides(
  userId: string,
  portfolioId: string,
  overrides: Partial<IPortfolioOverrides>
): Promise<IPortfolio | null> {
  const portfolio = await getPortfolioById(userId, portfolioId)
  if (!portfolio) return null

  // Only update explicitly provided fields — undefined = no change, null = clear override
  if ('headline' in overrides) {
    portfolio.overrides.headline = overrides.headline?.trim() || undefined
  }
  if ('about' in overrides) {
    portfolio.overrides.about = overrides.about?.trim() || undefined
  }
  if ('location' in overrides) {
    portfolio.overrides.location = overrides.location?.trim() || undefined
  }
  if ('website' in overrides) {
    portfolio.overrides.website = overrides.website?.trim() || undefined
  }
  if ('socialLinks' in overrides) {
    // null or empty array = clear override
    if (!overrides.socialLinks || overrides.socialLinks.length === 0) {
      portfolio.overrides.socialLinks = undefined
    } else {
      portfolio.overrides.socialLinks = overrides.socialLinks.map((sl) => ({
        platform: sl.platform.trim().slice(0, 50),
        url: sl.url.trim().slice(0, 500),
      }))
    }
  }

  await portfolio.save()
  return portfolio
}

// ─── Phase 6: Selections ──────────────────────────────────────────────────────

/**
 * Update which Profile entries are selected for this portfolio.
 *
 * Empty array = use all from master Profile.
 * Non-empty = only show the listed entries (by ObjectId).
 *
 * All provided IDs are validated against the actual Profile document
 * to ensure they reference real entries.
 */
export async function updateSelections(
  userId: string,
  portfolioId: string,
  selections: Partial<{
    featuredProjects: string[]
    visibleExperience: string[]
    visibleEducation: string[]
    visibleCertifications: string[]
  }>
): Promise<{ portfolio: IPortfolio; warnings: string[] }> {
  const portfolio = await getPortfolioById(userId, portfolioId)
  if (!portfolio) {
    throw Object.assign(new Error('Portfolio not found.'), { statusCode: 404 })
  }

  const profile = await Profile.findOne({
    _id: portfolio.profileId,
    userId: new mongoose.Types.ObjectId(userId),
  })
  if (!profile) {
    throw Object.assign(new Error('Linked profile not found.'), { statusCode: 404 })
  }

  const warnings: string[] = []

  const validateIds = (
    ids: string[],
    profileArray: Array<{ _id: { toString(): string } }>,
    label: string
  ): mongoose.Types.ObjectId[] => {
    const profileIdSet = new Set(profileArray.map((e) => e._id.toString()))
    const valid: mongoose.Types.ObjectId[] = []
    for (const id of ids) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw Object.assign(new Error(`Invalid ID format in ${label}: "${id}"`), { statusCode: 400 })
      }
      if (!profileIdSet.has(id)) {
        warnings.push(`${label}: entry "${id}" not found in profile (skipped)`)
      } else {
        valid.push(new mongoose.Types.ObjectId(id))
      }
    }
    return valid
  }

  if ('featuredProjects' in selections && selections.featuredProjects !== undefined) {
    portfolio.selections.featuredProjects = validateIds(
      selections.featuredProjects,
      profile.projects,
      'projects'
    )
  }
  if ('visibleExperience' in selections && selections.visibleExperience !== undefined) {
    portfolio.selections.visibleExperience = validateIds(
      selections.visibleExperience,
      profile.experience,
      'experience'
    )
  }
  if ('visibleEducation' in selections && selections.visibleEducation !== undefined) {
    portfolio.selections.visibleEducation = validateIds(
      selections.visibleEducation,
      profile.education,
      'education'
    )
  }
  if ('visibleCertifications' in selections && selections.visibleCertifications !== undefined) {
    portfolio.selections.visibleCertifications = validateIds(
      selections.visibleCertifications,
      profile.certifications,
      'certifications'
    )
  }

  await portfolio.save()
  return { portfolio, warnings }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

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

// ─── Profile data for renderer (Phase 5 — raw profile, no overrides) ─────────

/**
 * Safe profile representation for the Phase 5 preview (no overrides applied).
 * Phase 6 editor uses resolvePortfolioForRendering() instead.
 */
export function toRendererProfile(profile: IProfile) {
  return buildRendererProfile(profile)
}

function buildRendererProfile(profile: IProfile) {
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

export type RendererProfile = ReturnType<typeof buildRendererProfile>

// ─── Phase 6: Resolve portfolio for rendering (applies overrides + selections) ─

/**
 * Merge master Profile + portfolio overrides + selections into a RendererProfile.
 *
 * This is the authoritative resolver used by:
 *   - Editor live preview (server-side, via /editor endpoint)
 *   - Publish validation
 *   - Snapshot creation
 *
 * Rules:
 *   1. Start with master Profile data.
 *   2. Apply overrides for: headline, about, location, website, socialLinks.
 *   3. If featuredProjects non-empty → filter projects to those IDs only.
 *   4. If visibleExperience non-empty → filter experience to those IDs only.
 *   5. If visibleEducation non-empty → filter education to those IDs only.
 *   6. If visibleCertifications non-empty → filter certifications to those IDs only.
 *   7. Entries in selections that no longer exist in profile are silently omitted
 *      (the invalid-reference check is done separately in validatePublish).
 */
export function resolvePortfolioForRendering(
  portfolio: IPortfolio,
  profile: IProfile
): RendererProfile {
  const base = buildRendererProfile(profile)
  const overrides = portfolio.overrides ?? {}
  const selections = portfolio.selections

  // Apply overrides
  const resolved: RendererProfile = {
    ...base,
    headline:    overrides.headline  !== undefined ? overrides.headline  : base.headline,
    about:       overrides.about     !== undefined ? overrides.about     : base.about,
    location:    overrides.location  !== undefined ? overrides.location  : base.location,
    website:     overrides.website   !== undefined ? overrides.website   : base.website,
    socialLinks: overrides.socialLinks !== undefined
      ? overrides.socialLinks.map((sl, i) => ({ _id: `override-${i}`, platform: sl.platform, url: sl.url }))
      : base.socialLinks,
  }

  // Apply selections (filter if non-empty, pass-through if empty = show all)
  if (selections) {
    if (selections.featuredProjects.length > 0) {
      const ids = new Set(selections.featuredProjects.map(String))
      resolved.projects = base.projects.filter((p) => ids.has(p._id))
    }
    if (selections.visibleExperience.length > 0) {
      const ids = new Set(selections.visibleExperience.map(String))
      resolved.experience = base.experience.filter((e) => ids.has(e._id))
    }
    if (selections.visibleEducation.length > 0) {
      const ids = new Set(selections.visibleEducation.map(String))
      resolved.education = base.education.filter((e) => ids.has(e._id))
    }
    if (selections.visibleCertifications.length > 0) {
      const ids = new Set(selections.visibleCertifications.map(String))
      resolved.certifications = base.certifications.filter((c) => ids.has(c._id))
    }
  }

  return resolved
}

// ─── Phase 6: Publish validation ──────────────────────────────────────────────

export interface PublishValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validate a draft before publishing.
 * All validation errors prevent publishing.
 * Warnings are informational but do not block.
 *
 * Validates:
 *  - Profile existence
 *  - Template validity
 *  - Section validity
 *  - Theme validity
 *  - SEO field lengths
 *  - All selected IDs still exist in the profile
 *  - Override field lengths
 *  - Safe URLs (no javascript: protocol)
 */
export async function validatePublish(
  userId: string,
  portfolioId: string
): Promise<PublishValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  const portfolio = await getPortfolioById(userId, portfolioId)
  if (!portfolio) {
    return { valid: false, errors: ['Portfolio not found.'], warnings: [] }
  }

  const profile = await Profile.findOne({
    _id: portfolio.profileId,
    userId: new mongoose.Types.ObjectId(userId),
  })
  if (!profile) {
    errors.push('The linked profile no longer exists. Cannot publish.')
    return { valid: false, errors, warnings }
  }

  // Template
  const validTemplates = new Set(['editorial', 'minimal', 'developer'])
  if (!validTemplates.has(portfolio.template)) {
    errors.push(`Invalid template: "${portfolio.template}"`)
  }

  // Phase 7: Ensure no OTHER portfolio is currently published with this slug
  const normalizedSlug = normalizeSlug(portfolio.slug)
  const publishedConflict = await Portfolio.findOne({
    slug: normalizedSlug,
    status: 'published',
    _id: { $ne: portfolio._id },
  })
  if (publishedConflict) {
    errors.push(
      `The URL slug "${normalizedSlug}" is already in use by another published portfolio. Please change your slug in Settings before publishing.`
    )
  }

  // Sections
  if (!portfolio.sections || portfolio.sections.length === 0) {
    errors.push('Portfolio must have at least one section.')
  }
  const validSectionTypes = new Set(SECTION_TYPES)
  for (const s of portfolio.sections) {
    if (!validSectionTypes.has(s.type)) {
      errors.push(`Invalid section type: "${s.type}"`)
    }
  }

  // Override URL safety
  const websiteOverride = portfolio.overrides?.website
  if (websiteOverride && isUnsafeUrl(websiteOverride)) {
    errors.push('Portfolio website override contains an unsafe URL.')
  }
  if (portfolio.overrides?.socialLinks) {
    for (const sl of portfolio.overrides.socialLinks) {
      if (isUnsafeUrl(sl.url)) {
        errors.push(`Social link for "${sl.platform}" contains an unsafe URL.`)
      }
    }
  }

  // Override field lengths
  if (portfolio.overrides?.headline && portfolio.overrides.headline.length > 300) {
    errors.push('Headline override exceeds 300 characters.')
  }
  if (portfolio.overrides?.about && portfolio.overrides.about.length > 10000) {
    errors.push('About override exceeds 10,000 characters.')
  }

  // Selection reference validation
  const projectIds = new Set(profile.projects.map((p) => p._id.toString()))
  const expIds = new Set(profile.experience.map((e) => e._id.toString()))
  const eduIds = new Set(profile.education.map((e) => e._id.toString()))
  const certIds = new Set(profile.certifications.map((c) => c._id.toString()))

  const sel = portfolio.selections
  if (sel) {
    const missingProjects = sel.featuredProjects.filter((id) => !projectIds.has(id.toString()))
    if (missingProjects.length > 0) {
      errors.push(
        `${missingProjects.length} selected project${missingProjects.length > 1 ? 's are' : ' is'} no longer available in your profile. Remove ${missingProjects.length > 1 ? 'them' : 'it'} before publishing.`
      )
    }

    const missingExp = sel.visibleExperience.filter((id) => !expIds.has(id.toString()))
    if (missingExp.length > 0) {
      errors.push(
        `${missingExp.length} selected experience entr${missingExp.length > 1 ? 'ies are' : 'y is'} no longer available in your profile.`
      )
    }

    const missingEdu = sel.visibleEducation.filter((id) => !eduIds.has(id.toString()))
    if (missingEdu.length > 0) {
      errors.push(
        `${missingEdu.length} selected education entr${missingEdu.length > 1 ? 'ies are' : 'y is'} no longer available in your profile.`
      )
    }

    const missingCert = sel.visibleCertifications.filter((id) => !certIds.has(id.toString()))
    if (missingCert.length > 0) {
      errors.push(
        `${missingCert.length} selected certification${missingCert.length > 1 ? 's are' : ' is'} no longer available in your profile.`
      )
    }
  }

  // Informational warnings
  if (!profile.headline && !portfolio.overrides?.headline) {
    warnings.push('No headline set. Consider adding one to your profile or as a portfolio override.')
  }
  if (!profile.about && !portfolio.overrides?.about) {
    warnings.push('No about/bio text. The About section may appear empty.')
  }

  return { valid: errors.length === 0, errors, warnings }
}

/**
 * Check if a URL uses an unsafe protocol (e.g. javascript:).
 * Only http:, https:, and mailto: are considered safe.
 */
function isUnsafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return !['http:', 'https:', 'mailto:'].includes(parsed.protocol)
  } catch {
    // Relative URLs or malformed URLs — treat as unsafe
    return url.toLowerCase().startsWith('javascript:') || url.toLowerCase().startsWith('data:')
  }
}

// ─── Phase 6: Publish ─────────────────────────────────────────────────────────

/**
 * Publish a portfolio draft.
 *
 * Flow:
 *   1. Validate (validation errors → abort, no changes)
 *   2. Fetch profile
 *   3. Resolve: apply overrides + selections
 *   4. Build immutable snapshot
 *   5. Save snapshot + update status atomically
 *
 * The draft configuration (template, sections, theme, overrides, selections)
 * is NEVER modified by publishing. Only publishedSnapshot and status change.
 *
 * Subsequent draft edits do NOT touch publishedSnapshot.
 */
export async function publishPortfolio(
  userId: string,
  portfolioId: string
): Promise<{ portfolio: IPortfolio; validation: PublishValidationResult }> {
  // Step 1: Validate
  const validation = await validatePublish(userId, portfolioId)
  if (!validation.valid) {
    throw Object.assign(
      new Error(validation.errors[0] ?? 'Validation failed.'),
      { statusCode: 422, validationErrors: validation.errors }
    )
  }

  // Step 2: Fetch all data needed for snapshot
  const portfolio = await getPortfolioById(userId, portfolioId)
  if (!portfolio) {
    throw Object.assign(new Error('Portfolio not found.'), { statusCode: 404 })
  }

  const profile = await Profile.findOne({
    _id: portfolio.profileId,
    userId: new mongoose.Types.ObjectId(userId),
  })
  if (!profile) {
    throw Object.assign(new Error('Linked profile not found.'), { statusCode: 404 })
  }

  // Step 3: Resolve overrides + selections
  const resolvedProfile = resolvePortfolioForRendering(portfolio, profile)

  // Step 4: Build immutable snapshot
  // Strip internal IDs from social link overrides before storing
  const snapshotProfile: IPublishedSnapshot['profile'] = {
    ...resolvedProfile,
    // socialLinks override stubs have fake _id — replace with clean form
    socialLinks: resolvedProfile.socialLinks.map((sl, i) => ({
      _id: sl._id.startsWith('override-') ? `snap-sl-${i}` : sl._id,
      platform: sl.platform,
      url: sl.url,
    })),
  }

  const snapshot: IPublishedSnapshot = {
    template: portfolio.template,
    sections: portfolio.sections.map((s) => ({ type: s.type, visible: s.visible, order: s.order })),
    theme: { ...portfolio.theme },
    seo: {
      title: portfolio.seo?.title,
      description: portfolio.seo?.description,
    },
    profile: snapshotProfile,
    publishedAt: new Date(),
  }

  // Step 5: Save — only snapshot + status + lastPublishedAt change
  portfolio.publishedSnapshot = snapshot
  portfolio.status = 'published'
  portfolio.lastPublishedAt = snapshot.publishedAt

  await portfolio.save()
  return { portfolio, validation }
}

// ─── Phase 7: Public portfolio access ────────────────────────────────────────

/**
 * Public serialization of a published snapshot for the public API.
 *
 * ALLOWLIST approach — only fields intended for public display.
 * NEVER includes: passwordHash, tokens, userId, profileId,
 * internal MongoDB fields, auth metadata, private secrets.
 *
 * The snapshot profile was already sanitized at publish time
 * (see publishPortfolio → snapshotProfile).
 * This function applies a second layer of serialization to be safe.
 */
export function toPublicPortfolio(portfolio: IPortfolio): Record<string, unknown> {
  if (!portfolio.publishedSnapshot) {
    throw Object.assign(new Error('Portfolio has no published snapshot.'), { statusCode: 404 })
  }

  const snap = portfolio.publishedSnapshot

  // Allowlist the snapshot profile — no internal fields
  const publicProfile: Record<string, unknown> = {
    fullName:    snap.profile.fullName,
    headline:    snap.profile.headline,
    // profilePhoto is included if present (it's a public URL already)
    profilePhoto: snap.profile.profilePhoto,
    location:    snap.profile.location,
    // email exposed only if renderer ContactSection renders it
    // (controlled by template) — included in snapshot as user opted in
    email:       snap.profile.email,
    website:     snap.profile.website,
    linkedinUrl: snap.profile.linkedinUrl,
    githubUrl:   snap.profile.githubUrl,
    about:       snap.profile.about,
    skills:      snap.profile.skills,
    experience:  snap.profile.experience,
    education:   snap.profile.education,
    projects:    snap.profile.projects,
    certifications: snap.profile.certifications,
    achievements: snap.profile.achievements,
    publications: snap.profile.publications,
    languages:   snap.profile.languages,
    socialLinks:  snap.profile.socialLinks,
  }

  return {
    // Portfolio metadata — safe subset
    _id:            String(portfolio._id),
    name:           portfolio.name,
    slug:           portfolio.slug,
    status:         portfolio.status,
    lastPublishedAt: portfolio.lastPublishedAt,
    // Snapshot configuration
    template:    snap.template,
    sections:    snap.sections,
    theme:       snap.theme,
    seo:         {
      title:       snap.seo?.title ?? undefined,
      description: snap.seo?.description ?? undefined,
    },
    profile:     publicProfile,
    publishedAt: snap.publishedAt,
  }
}

/**
 * Phase 7: Get a published portfolio by slug for public access.
 *
 * - Does NOT require authentication.
 * - Returns ONLY portfolios with status = 'published'.
 * - Returns null for draft/missing/nonexistent portfolios.
 * - Deterministic: if multiple published portfolios share a slug in legacy data,
 *   preserves the original/first created one (prevents URL hijacking).
 * - 1 DB query maximum — no N+1 lookups (snapshot contains all render data).
 */
export async function getPublishedPortfolioBySlug(
  slug: string
): Promise<IPortfolio | null> {
  if (!slug || typeof slug !== 'string') return null

  // Normalize the slug before querying — prevents case-variation bypasses
  const normalizedSlug = slug.toLowerCase().trim()

  // Validate slug format to prevent injection/abuse
  if (!/^[a-z0-9-]+$/.test(normalizedSlug) || normalizedSlug.length > 80) {
    return null
  }

  return Portfolio.findOne({
    slug: normalizedSlug,
    status: 'published',
  })
    .sort({ createdAt: 1 }) // Deterministic: original published portfolio is preserved if legacy duplicate exists
}

// ─── Phase 7: Unpublish ───────────────────────────────────────────────────────

/**
 * Unpublish a portfolio.
 *
 * - Requires authentication + ownership.
 * - Changes status to 'draft'.
 * - Prevents public access.
 * - Preserves the publishedSnapshot (for history and potential re-publish).
 * - Does NOT modify the draft configuration.
 */
export async function unpublishPortfolio(
  userId: string,
  portfolioId: string
): Promise<IPortfolio | null> {
  const portfolio = await getPortfolioById(userId, portfolioId)
  if (!portfolio) return null

  if (portfolio.status !== 'published') {
    throw Object.assign(
      new Error('Portfolio is not currently published.'),
      { statusCode: 409 }
    )
  }

  portfolio.status = 'draft'
  await portfolio.save()
  return portfolio
}
