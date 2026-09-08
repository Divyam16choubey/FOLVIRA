/**
 * Portfolio.ts — Mongoose Portfolio schema (Phase 5 + Phase 6).
 *
 * Phase 6 additions:
 *   - overrides: portfolio-specific overrides of master Profile fields
 *   - selections: which Profile entries appear in this portfolio
 *   - status: 'draft' | 'published'
 *   - lastPublishedAt: timestamp of last successful publish
 *   - publishedSnapshot: immutable resolved snapshot created at publish time
 *
 * Architecture:
 *   MASTER PROFILE = source of truth for professional facts
 *   PORTFOLIO     = presentation configuration + controlled overrides
 *   SNAPSHOT      = immutable resolved version published at a point in time
 *
 * Security:
 * - userId is indexed; all queries MUST filter by userId.
 * - slug uniqueness is scoped per user (not globally unique).
 * - Snapshot MUST NOT contain passwordHash, tokens, or auth metadata.
 * - Override whitelist is deliberate — arbitrary fields are not accepted.
 * - Selection arrays store only ObjectId references (strings), not copies.
 */
import mongoose, { Document, Schema, Types } from 'mongoose'

// ─── Template enum ────────────────────────────────────────────────────────────

export const PORTFOLIO_TEMPLATES = ['editorial', 'minimal', 'developer'] as const
export type PortfolioTemplate = (typeof PORTFOLIO_TEMPLATES)[number]

// ─── Section types ────────────────────────────────────────────────────────────
// Validated server-side — never accept arbitrary component names or HTML.

export const SECTION_TYPES = [
  'hero',
  'about',
  'experience',
  'projects',
  'skills',
  'education',
  'certifications',
  'contact',
] as const
export type SectionType = (typeof SECTION_TYPES)[number]

// ─── Theme allowed values ─────────────────────────────────────────────────────

export const THEME_FONTS = ['inter', 'dm-sans', 'manrope', 'playfair'] as const
export const THEME_HEADING_FONTS = ['inter', 'dm-sans', 'manrope', 'playfair'] as const
export const THEME_ACCENTS = ['forest', 'charcoal', 'brass', 'slate'] as const
export const THEME_BACKGROUNDS = ['ivory', 'white', 'warm', 'dark'] as const
export const THEME_RADII = ['none', 'minimal', 'rounded'] as const
export const THEME_ANIMATIONS = ['none', 'subtle', 'moderate'] as const

export type ThemeFont = (typeof THEME_FONTS)[number]
export type ThemeHeadingFont = (typeof THEME_HEADING_FONTS)[number]
export type ThemeAccent = (typeof THEME_ACCENTS)[number]
export type ThemeBackground = (typeof THEME_BACKGROUNDS)[number]
export type ThemeRadius = (typeof THEME_RADII)[number]
export type ThemeAnimation = (typeof THEME_ANIMATIONS)[number]

// ─── Portfolio status ─────────────────────────────────────────────────────────

export const PORTFOLIO_STATUSES = ['draft', 'published'] as const
export type PortfolioStatus = (typeof PORTFOLIO_STATUSES)[number]

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface IPortfolioSection {
  type: SectionType
  visible: boolean
  order: number
}

export interface IPortfolioTheme {
  font: ThemeFont
  headingFont: ThemeHeadingFont
  accent: ThemeAccent
  background: ThemeBackground
  radius: ThemeRadius
  animation: ThemeAnimation
}

export interface IPortfolioSeo {
  title?: string
  description?: string
}

/**
 * Phase 6: Controlled overrides of master Profile fields for this portfolio.
 *
 * Whitelist is deliberate — only safe presentation fields.
 * Sensitive fields (email, phone, userId, tokens, etc.) are never overridable.
 * When a field is undefined/null, the master Profile value is used.
 */
export interface IPortfolioOverrides {
  headline?: string
  about?: string
  location?: string
  website?: string
  socialLinks?: Array<{ platform: string; url: string }>
}

/**
 * Phase 6: Which Profile sub-document entries appear in this portfolio.
 *
 * Empty array = all entries from master Profile are used.
 * Non-empty array = only the listed IDs are shown.
 * IDs that no longer exist in the Profile are flagged on validation/publish.
 */
export interface IPortfolioSelections {
  featuredProjects: Types.ObjectId[]
  visibleExperience: Types.ObjectId[]
  visibleEducation: Types.ObjectId[]
  visibleCertifications: Types.ObjectId[]
}

/**
 * Phase 6: Immutable published snapshot.
 *
 * Created atomically at publish time by resolving:
 *   master Profile + overrides + selections + sections + theme + template + seo
 *
 * Once created, editing the draft does NOT modify publishedSnapshot.
 * Only a subsequent Publish action replaces it.
 *
 * Security: must NEVER contain passwordHash, tokens, or auth metadata.
 */
export interface IPublishedSnapshotProfile {
  fullName: string
  headline?: string
  profilePhoto?: string
  location?: string
  email?: string
  website?: string
  linkedinUrl?: string
  githubUrl?: string
  about?: string
  skills: Array<{ _id: string; name: string }>
  experience: Array<{
    _id: string; title: string; company: string; location?: string
    startDate?: string; endDate?: string; current: boolean; description?: string
  }>
  education: Array<{
    _id: string; institution: string; degree?: string; field?: string
    startDate?: string; endDate?: string; description?: string
  }>
  projects: Array<{
    _id: string; name: string; description?: string
    url?: string; repoUrl?: string; technologies: string[]
  }>
  certifications: Array<{ _id: string; name: string; issuer?: string; date?: string; url?: string }>
  achievements: Array<{ _id: string; title: string; description?: string; date?: string }>
  publications: Array<{ _id: string; title: string; publisher?: string; date?: string; url?: string }>
  languages: Array<{ _id: string; name: string; proficiency?: string }>
  socialLinks: Array<{ _id: string; platform: string; url: string }>
}

export interface IPublishedSnapshot {
  template: PortfolioTemplate
  sections: IPortfolioSection[]
  theme: IPortfolioTheme
  seo: IPortfolioSeo
  profile: IPublishedSnapshotProfile
  publishedAt: Date
}

// ─── Main Portfolio interface ─────────────────────────────────────────────────

export interface IPortfolio extends Document {
  _id: Types.ObjectId
  userId: Types.ObjectId
  profileId: Types.ObjectId
  name: string
  slug: string
  template: PortfolioTemplate
  sections: IPortfolioSection[]
  theme: IPortfolioTheme
  overrides: IPortfolioOverrides         // Phase 6
  selections: IPortfolioSelections       // Phase 6
  seo: IPortfolioSeo
  status: PortfolioStatus                // Phase 6: 'draft' | 'published'
  lastPublishedAt?: Date                 // Phase 6
  publishedSnapshot?: IPublishedSnapshot // Phase 6: immutable once created
  createdAt: Date
  updatedAt: Date
}

// ─── Default values ───────────────────────────────────────────────────────────

export const DEFAULT_SECTIONS: IPortfolioSection[] = [
  { type: 'hero',           visible: true,  order: 1 },
  { type: 'about',          visible: true,  order: 2 },
  { type: 'experience',     visible: true,  order: 3 },
  { type: 'projects',       visible: true,  order: 4 },
  { type: 'skills',         visible: true,  order: 5 },
  { type: 'education',      visible: true,  order: 6 },
  { type: 'certifications', visible: false, order: 7 },
  { type: 'contact',        visible: true,  order: 8 },
]

export const DEFAULT_THEME: IPortfolioTheme = {
  font: 'manrope',
  headingFont: 'playfair',
  accent: 'forest',
  background: 'ivory',
  radius: 'minimal',
  animation: 'subtle',
}

// ─── Sub-document schemas ─────────────────────────────────────────────────────

const sectionSchema = new Schema<IPortfolioSection>(
  {
    type:    { type: String, enum: SECTION_TYPES, required: true },
    visible: { type: Boolean, default: true },
    order:   { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: false }
)

const themeSchema = new Schema<IPortfolioTheme>(
  {
    font:        { type: String, enum: THEME_FONTS,         default: 'manrope' as ThemeFont },
    headingFont: { type: String, enum: THEME_HEADING_FONTS, default: 'playfair' as ThemeHeadingFont },
    accent:      { type: String, enum: THEME_ACCENTS,       default: 'forest' as ThemeAccent },
    background:  { type: String, enum: THEME_BACKGROUNDS,   default: 'ivory' as ThemeBackground },
    radius:      { type: String, enum: THEME_RADII,         default: 'minimal' as ThemeRadius },
    animation:   { type: String, enum: THEME_ANIMATIONS,    default: 'subtle' as ThemeAnimation },
  },
  { _id: false }
)

const seoSchema = new Schema<IPortfolioSeo>(
  {
    title:       { type: String, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 300 },
  },
  { _id: false }
)

// ─── Phase 6: Override schema ─────────────────────────────────────────────────

const socialLinkOverrideSchema = new Schema(
  {
    platform: { type: String, trim: true, maxlength: 50, required: true },
    url:      { type: String, trim: true, maxlength: 500, required: true },
  },
  { _id: false }
)

const overridesSchema = new Schema<IPortfolioOverrides>(
  {
    headline:    { type: String, trim: true, maxlength: 300 },
    about:       { type: String, trim: true, maxlength: 10000 },
    location:    { type: String, trim: true, maxlength: 200 },
    website:     { type: String, trim: true, maxlength: 500 },
    socialLinks: { type: [socialLinkOverrideSchema], default: undefined },
  },
  { _id: false }
)

// ─── Phase 6: Selections schema ───────────────────────────────────────────────

const selectionsSchema = new Schema<IPortfolioSelections>(
  {
    featuredProjects:    { type: [Schema.Types.ObjectId], default: [] },
    visibleExperience:   { type: [Schema.Types.ObjectId], default: [] },
    visibleEducation:    { type: [Schema.Types.ObjectId], default: [] },
    visibleCertifications: { type: [Schema.Types.ObjectId], default: [] },
  },
  { _id: false }
)

// ─── Phase 6: Published snapshot schema ──────────────────────────────────────
// Uses Mixed type for the profile sub-object to avoid deeply nested schemas.
// The content is validated before creation (never stored from raw client input).

const publishedSnapshotSchema = new Schema<IPublishedSnapshot>(
  {
    template:    { type: String, enum: PORTFOLIO_TEMPLATES, required: true },
    sections:    { type: [sectionSchema], required: true },
    theme:       { type: themeSchema, required: true },
    seo:         { type: seoSchema },
    profile:     { type: Schema.Types.Mixed, required: true },
    publishedAt: { type: Date, required: true },
  },
  { _id: false }
)

// ─── Main Portfolio schema ────────────────────────────────────────────────────

const portfolioSchema = new Schema<IPortfolio>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    profileId: {
      type: Schema.Types.ObjectId,
      ref: 'Profile',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      minlength: 1,
      maxlength: 80,
      match: [/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, digits, and hyphens'],
    },
    template: {
      type: String,
      enum: PORTFOLIO_TEMPLATES,
      required: true,
      default: 'editorial' as PortfolioTemplate,
    },
    sections: {
      type: [sectionSchema],
      default: DEFAULT_SECTIONS,
      validate: {
        validator: (sections: IPortfolioSection[]) => sections.length > 0,
        message: 'Portfolio must have at least one section',
      },
    },
    theme: {
      type: themeSchema,
      default: DEFAULT_THEME,
    },
    // Phase 6 fields
    overrides: {
      type: overridesSchema,
      default: {},
    },
    selections: {
      type: selectionsSchema,
      default: () => ({
        featuredProjects: [],
        visibleExperience: [],
        visibleEducation: [],
        visibleCertifications: [],
      }),
    },
    seo: {
      type: seoSchema,
      default: {},
    },
    status: {
      type: String,
      enum: PORTFOLIO_STATUSES,
      default: 'draft' as PortfolioStatus,
    },
    lastPublishedAt: {
      type: Date,
    },
    publishedSnapshot: {
      type: publishedSnapshotSchema,
    },
  },
  {
    timestamps: true,
  }
)

// ─── Indexes ──────────────────────────────────────────────────────────────────

portfolioSchema.index({ userId: 1, createdAt: -1 })
portfolioSchema.index({ userId: 1, slug: 1 }, { unique: true })
portfolioSchema.index({ userId: 1, status: 1 })

export const Portfolio = mongoose.model<IPortfolio>('Portfolio', portfolioSchema)
