/**
 * MinimalTemplate — Clean, typography-focused portfolio template.
 *
 * Visual direction: restrained, professional, strong whitespace,
 * minimal decoration, sidebar-style labels.
 * Feels substantially different from Editorial while belonging to FOLVIRA.
 *
 * Phase 8: Added section navigation links to top bar with mobile drawer.
 */
import type { TemplateProps } from '../TemplateRegistry'
import type { SectionType } from '../../../types/portfolio'
import { getThemeColors, getThemeFontFamily, getThemeHeadingFontFamily } from '../../../types/portfolio'
import { PortfolioNav } from '../PortfolioNav'
import { HeroSection } from '../sections/HeroSection'
import { AboutSection } from '../sections/AboutSection'
import { ExperienceSection } from '../sections/ExperienceSection'
import { ProjectsSection } from '../sections/ProjectsSection'
import { SkillsSection } from '../sections/SkillsSection'
import { EducationSection } from '../sections/EducationSection'
import { CertificationSection } from '../sections/CertificationSection'
import { ContactSection } from '../sections/ContactSection'

export function MinimalTemplate({ portfolio, profile }: TemplateProps) {
  const { theme, sections } = portfolio
  const colors = getThemeColors(theme)
  const fontFamily = getThemeFontFamily(theme.font)
  const headingFont = getThemeHeadingFontFamily(theme.headingFont)

  const visibleSections = [...sections]
    .filter((s) => s.visible)
    .sort((a, b) => a.order - b.order)

  const sectionMap: Record<SectionType, React.ReactNode> = {
    hero:           <HeroSection           key="hero"           profile={profile} theme={theme} variant="minimal" />,
    about:          <AboutSection          key="about"          profile={profile} theme={theme} variant="minimal" />,
    experience:     <ExperienceSection     key="experience"     profile={profile} theme={theme} variant="minimal" />,
    projects:       <ProjectsSection       key="projects"       profile={profile} theme={theme} variant="minimal" />,
    skills:         <SkillsSection         key="skills"         profile={profile} theme={theme} variant="minimal" />,
    education:      <EducationSection      key="education"      profile={profile} theme={theme} variant="minimal" />,
    certifications: <CertificationSection  key="certifications" profile={profile} theme={theme} variant="minimal" />,
    contact:        <ContactSection        key="contact"        profile={profile} theme={theme} variant="minimal" />,
  }

  return (
    <div
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        fontFamily,
        minHeight: '100%',
      }}
      data-template="minimal"
    >
      {/* Minimal top bar with Phase 8 section navigation */}
      <div
        className="sticky top-0 z-10 py-3 relative"
        style={{ borderBottom: `2px solid ${colors.text}`, backgroundColor: colors.bg }}
      >
        <div className="section-shell flex items-center justify-between gap-4">
          <span
            className="text-xs font-extrabold uppercase tracking-[0.2em] shrink-0"
            style={{ color: colors.text, fontFamily }}
          >
            {profile.fullName}
          </span>
          <PortfolioNav
            sections={sections}
            profile={profile}
            colors={colors}
            variant="minimal"
            fontFamily={fontFamily}
          />
        </div>
      </div>

      {visibleSections.map((section) => sectionMap[section.type])}

      {/* Minimal footer */}
      <footer
        className="py-5"
        style={{ borderTop: `1px solid ${colors.border}` }}
      >
        <div className="section-shell">
          <p className="text-[10px] uppercase tracking-[0.15em]" style={{ color: colors.muted, fontFamily }}>
            {profile.fullName} · FOLVIRA
          </p>
        </div>
      </footer>
    </div>
  )
}
