/**
 * Portfolio TypeScript types for the FOLVIRA frontend.
 * These mirror the backend Portfolio model.
 * Never import server-side types directly into the frontend.
 */

// ─── Template types ───────────────────────────────────────────────────────────

export type PortfolioTemplate = 'editorial' | 'minimal' | 'developer'

// ─── Section types ────────────────────────────────────────────────────────────

export type SectionType =
  | 'hero'
  | 'about'
  | 'experience'
  | 'projects'
  | 'skills'
  | 'education'
  | 'certifications'
  | 'contact'

export interface PortfolioSection {
  type: SectionType
  visible: boolean
  order: number
}

// ─── Theme types ──────────────────────────────────────────────────────────────

export type ThemeFont = 'inter' | 'dm-sans' | 'manrope' | 'playfair'
export type ThemeHeadingFont = 'inter' | 'dm-sans' | 'manrope' | 'playfair'
export type ThemeAccent = 'forest' | 'charcoal' | 'brass' | 'slate'
export type ThemeBackground = 'ivory' | 'white' | 'warm' | 'dark'
export type ThemeRadius = 'none' | 'minimal' | 'rounded'
export type ThemeAnimation = 'none' | 'subtle' | 'moderate'

export interface PortfolioTheme {
  font: ThemeFont
  headingFont: ThemeHeadingFont
  accent: ThemeAccent
  background: ThemeBackground
  radius: ThemeRadius
  animation: ThemeAnimation
}

// ─── SEO ──────────────────────────────────────────────────────────────────────

export interface PortfolioSeo {
  title?: string
  description?: string
}

// ─── Portfolio ────────────────────────────────────────────────────────────────

export type PortfolioStatus = 'draft'

export interface Portfolio {
  _id: string
  userId: string
  profileId: string
  name: string
  slug: string
  template: PortfolioTemplate
  sections: PortfolioSection[]
  theme: PortfolioTheme
  seo: PortfolioSeo
  status: PortfolioStatus
  createdAt: string
  updatedAt: string
}

// ─── Renderer profile — safe subset of full profile for rendering ─────────────

export interface RendererSkill {
  _id: string
  name: string
}

export interface RendererExperience {
  _id: string
  title: string
  company: string
  location?: string
  startDate?: string
  endDate?: string
  current: boolean
  description?: string
}

export interface RendererEducation {
  _id: string
  institution: string
  degree?: string
  field?: string
  startDate?: string
  endDate?: string
  description?: string
}

export interface RendererProject {
  _id: string
  name: string
  description?: string
  url?: string
  repoUrl?: string
  technologies: string[]
}

export interface RendererCertification {
  _id: string
  name: string
  issuer?: string
  date?: string
  url?: string
}

export interface RendererAchievement {
  _id: string
  title: string
  description?: string
  date?: string
}

export interface RendererPublication {
  _id: string
  title: string
  publisher?: string
  date?: string
  url?: string
}

export interface RendererLanguage {
  _id: string
  name: string
  proficiency?: string
}

export interface RendererSocialLink {
  _id: string
  platform: string
  url: string
}

export interface RendererProfile {
  fullName: string
  headline?: string
  profilePhoto?: string
  location?: string
  email?: string
  phone?: string
  website?: string
  linkedinUrl?: string
  githubUrl?: string
  about?: string
  skills: RendererSkill[]
  experience: RendererExperience[]
  education: RendererEducation[]
  projects: RendererProject[]
  certifications: RendererCertification[]
  achievements: RendererAchievement[]
  publications: RendererPublication[]
  languages: RendererLanguage[]
  socialLinks: RendererSocialLink[]
}

// ─── Theme display helpers ────────────────────────────────────────────────────

export const TEMPLATE_LABELS: Record<PortfolioTemplate, string> = {
  editorial: 'Editorial',
  minimal: 'Minimal',
  developer: 'Developer',
}

export const SECTION_LABELS: Record<SectionType, string> = {
  hero: 'Hero & Name',
  about: 'About Me',
  experience: 'Work Experience',
  projects: 'Projects',
  skills: 'Skills',
  education: 'Education',
  certifications: 'Certifications',
  contact: 'Contact',
}

export const THEME_FONT_LABELS: Record<ThemeFont, string> = {
  'inter': 'Inter',
  'dm-sans': 'DM Sans',
  'manrope': 'Manrope',
  'playfair': 'Playfair',
}

export const THEME_ACCENT_LABELS: Record<ThemeAccent, string> = {
  forest: 'Forest Green',
  charcoal: 'Charcoal',
  brass: 'Brass Gold',
  slate: 'Slate Blue',
}

export const THEME_BACKGROUND_LABELS: Record<ThemeBackground, string> = {
  ivory: 'Warm Ivory',
  white: 'Clean White',
  warm: 'Warm Beige',
  dark: 'Dark',
}

// ─── Theme CSS values ─────────────────────────────────────────────────────────
// Maps theme config values to CSS variables/classes used in the renderer.

export function getThemeColors(theme: PortfolioTheme): {
  bg: string
  surface: string
  text: string
  muted: string
  accent: string
  border: string
} {
  const backgrounds: Record<ThemeBackground, { bg: string; surface: string }> = {
    ivory: { bg: '#f8f5ef', surface: '#fffdfa' },
    white: { bg: '#ffffff', surface: '#f9fafb' },
    warm:  { bg: '#f5f0e8', surface: '#faf7f2' },
    dark:  { bg: '#161e1b', surface: '#1f2b27' },
  }

  const accents: Record<ThemeAccent, string> = {
    forest:  '#1e4a40',
    charcoal: '#2c3430',
    brass:   '#9d602d',
    slate:   '#3a5068',
  }

  const isDark = theme.background === 'dark'

  return {
    bg: backgrounds[theme.background].bg,
    surface: backgrounds[theme.background].surface,
    text: isDark ? '#f1eee6' : '#18221e',
    muted: isDark ? '#94a39d' : '#59625c',
    accent: accents[theme.accent],
    border: isDark ? 'rgba(241,238,230,0.12)' : '#dedbd3',
  }
}

export function getThemeFontFamily(font: ThemeFont): string {
  const map: Record<ThemeFont, string> = {
    'inter': "'Inter', system-ui, sans-serif",
    'dm-sans': "'DM Sans', system-ui, sans-serif",
    'manrope': "'Manrope', system-ui, sans-serif",
    'playfair': "'Playfair Display', Georgia, serif",
  }
  return map[font]
}

export function getThemeHeadingFontFamily(font: ThemeHeadingFont): string {
  const map: Record<ThemeHeadingFont, string> = {
    'inter': "'Inter', system-ui, sans-serif",
    'dm-sans': "'DM Sans', system-ui, sans-serif",
    'manrope': "'Manrope', system-ui, sans-serif",
    'playfair': "'DM Serif Display', 'Playfair Display', Georgia, serif",
  }
  return map[font]
}

export function getThemeBorderRadius(radius: ThemeRadius): string {
  const map: Record<ThemeRadius, string> = {
    none: '0',
    minimal: '0.375rem',
    rounded: '0.75rem',
  }
  return map[radius]
}

// ─── Default values (mirrors backend defaults) ───────────────────────────────

export const DEFAULT_SECTIONS: PortfolioSection[] = [
  { type: 'hero',           visible: true,  order: 1 },
  { type: 'about',          visible: true,  order: 2 },
  { type: 'experience',     visible: true,  order: 3 },
  { type: 'projects',       visible: true,  order: 4 },
  { type: 'skills',         visible: true,  order: 5 },
  { type: 'education',      visible: true,  order: 6 },
  { type: 'certifications', visible: false, order: 7 },
  { type: 'contact',        visible: true,  order: 8 },
]

export const DEFAULT_THEME: PortfolioTheme = {
  font: 'manrope',
  headingFont: 'playfair',
  accent: 'forest',
  background: 'ivory',
  radius: 'minimal',
  animation: 'subtle',
}
