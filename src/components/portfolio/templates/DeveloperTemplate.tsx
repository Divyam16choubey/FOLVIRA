/**
 * DeveloperTemplate — Technical, project-forward portfolio template.
 *
 * Visual direction: clean technical aesthetic, dark or dark-tinted,
 * project-focused, GitHub-friendly, professional.
 * No neon colors, no fake terminal effects, no gimmicks.
 */
import type { TemplateProps } from '../TemplateRegistry'
import type { SectionType } from '../../../types/portfolio'
import { getThemeColors, getThemeFontFamily } from '../../../types/portfolio'
import { HeroSection } from '../sections/HeroSection'
import { AboutSection } from '../sections/AboutSection'
import { ExperienceSection } from '../sections/ExperienceSection'
import { ProjectsSection } from '../sections/ProjectsSection'
import { SkillsSection } from '../sections/SkillsSection'
import { EducationSection } from '../sections/EducationSection'
import { CertificationSection } from '../sections/CertificationSection'
import { ContactSection } from '../sections/ContactSection'

export function DeveloperTemplate({ portfolio, profile }: TemplateProps) {
  const { theme, sections } = portfolio
  const colors = getThemeColors(theme)
  const fontFamily = getThemeFontFamily(theme.font)

  const visibleSections = [...sections]
    .filter((s) => s.visible)
    .sort((a, b) => a.order - b.order)

  const sectionMap: Record<SectionType, React.ReactNode> = {
    hero:           <HeroSection           key="hero"           profile={profile} theme={theme} variant="developer" />,
    about:          <AboutSection          key="about"          profile={profile} theme={theme} variant="developer" />,
    experience:     <ExperienceSection     key="experience"     profile={profile} theme={theme} variant="developer" />,
    projects:       <ProjectsSection       key="projects"       profile={profile} theme={theme} variant="developer" />,
    skills:         <SkillsSection         key="skills"         profile={profile} theme={theme} variant="developer" />,
    education:      <EducationSection      key="education"      profile={profile} theme={theme} variant="developer" />,
    certifications: <CertificationSection  key="certifications" profile={profile} theme={theme} variant="developer" />,
    contact:        <ContactSection        key="contact"        profile={profile} theme={theme} variant="developer" />,
  }

  const isDark = theme.background === 'dark'

  return (
    <div
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        fontFamily,
        minHeight: '100%',
      }}
      data-template="developer"
    >
      {/* Developer nav bar */}
      <div
        className="sticky top-0 z-10 py-3"
        style={{
          backgroundColor: colors.bg,
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <div className="section-shell flex items-center justify-between gap-4">
          <span
            className="font-mono text-sm font-bold"
            style={{ color: colors.accent }}
          >
            {profile.fullName ? `~/${profile.fullName.toLowerCase().replace(/\s+/g, '-')}` : '~/portfolio'}
          </span>
          <div className="hidden sm:flex items-center gap-4">
            {profile.githubUrl && (
              <a
                href={profile.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium hover:underline"
                style={{ color: isDark ? colors.muted : colors.accent }}
              >
                GitHub ↗
              </a>
            )}
            {profile.email && (
              <a
                href={`mailto:${profile.email}`}
                className="text-xs font-medium hover:underline"
                style={{ color: isDark ? colors.muted : colors.accent }}
              >
                {profile.email}
              </a>
            )}
          </div>
        </div>
      </div>

      {visibleSections.map((section) => sectionMap[section.type])}

      {/* Developer footer */}
      <footer
        className="py-5"
        style={{ borderTop: `1px solid ${colors.border}`, backgroundColor: colors.surface }}
      >
        <div className="section-shell">
          <p className="font-mono text-xs" style={{ color: colors.muted }}>
            {/* Plain text — no dangerouslySetInnerHTML */}
            {'// '}
            {profile.fullName}
            {' · Built with FOLVIRA'}
          </p>
        </div>
      </footer>
    </div>
  )
}
