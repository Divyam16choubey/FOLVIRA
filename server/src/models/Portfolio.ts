/**
 * Portfolio.ts — Mongoose Portfolio schema.
 *
 * A Portfolio is a presentation configuration that references the user's
 * Profile as its content source. It does NOT duplicate Profile data.
 *
 * One user can have multiple portfolios (e.g. "General", "Frontend Dev").
 * Each portfolio configures which template, sections, and theme to use
 * when rendering the user's profile information.
 *
 * Security:
 * - userId is indexed; all queries MUST filter by userId.
 * - slug uniqueness is scoped per user (not globally unique).
 * - No auth secrets are stored here.
 * - Never return passwordHash or tokens in portfolio responses.
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
// All values are predefined — arbitrary CSS is never accepted.

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

export const PORTFOLIO_STATUSES = ['draft'] as const
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

export interface IPortfolio extends Document {
  _id: Types.ObjectId
  userId: Types.ObjectId
  profileId: Types.ObjectId
  name: string
  slug: string
  template: PortfolioTemplate
  sections: IPortfolioSection[]
  theme: IPortfolioTheme
  seo: IPortfolioSeo
  status: PortfolioStatus
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
    type: {
      type: String,
      enum: SECTION_TYPES,
      required: true,
    },
    visible: { type: Boolean, default: true },
    order: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: false } // sections are identified by type, not _id
)

const themeSchema = new Schema<IPortfolioTheme>(
  {
    font:        { type: String, enum: THEME_FONTS,          default: 'manrope' as ThemeFont },
    headingFont: { type: String, enum: THEME_HEADING_FONTS,  default: 'playfair' as ThemeHeadingFont },
    accent:      { type: String, enum: THEME_ACCENTS,        default: 'forest' as ThemeAccent },
    background:  { type: String, enum: THEME_BACKGROUNDS,    default: 'ivory' as ThemeBackground },
    radius:      { type: String, enum: THEME_RADII,          default: 'minimal' as ThemeRadius },
    animation:   { type: String, enum: THEME_ANIMATIONS,     default: 'subtle' as ThemeAnimation },
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
      // Validates: lowercase letters, digits, hyphens only
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
    seo: {
      type: seoSchema,
      default: {},
    },
    status: {
      type: String,
      enum: PORTFOLIO_STATUSES,
      default: 'draft' as PortfolioStatus,
    },
  },
  {
    timestamps: true,
  }
)

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Per-user queries ordered by recency
portfolioSchema.index({ userId: 1, createdAt: -1 })

// User-scoped slug uniqueness (user A and user B can both have slug "portfolio")
portfolioSchema.index({ userId: 1, slug: 1 }, { unique: true })

export const Portfolio = mongoose.model<IPortfolio>('Portfolio', portfolioSchema)
