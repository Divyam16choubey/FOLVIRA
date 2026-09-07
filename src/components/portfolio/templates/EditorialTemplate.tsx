/**
 * EditorialTemplate — FOLVIRA's flagship portfolio template.
 *
 * Visual direction: premium, editorial, generous whitespace, warm palette,
 * strong typography, asymmetric layout where appropriate.
 *
 * The template controls layout, spacing, typography hierarchy, and visual treatment.
 * Section components control rendering of structured profile content.
 */
import type { TemplateProps } from '../TemplateRegistry'
import type { SectionType } from '../../../types/portfolio'
import { getThemeColors } from '../../../types/portfolio'
import { HeroSection } from '../sections/HeroSection'
import { AboutSection } from '../sections/AboutSection'
import { ExperienceSection } from '../sections/ExperienceSection'
import { ProjectsSection } from '../sections/ProjectsSection'
import { SkillsSection } from '../sections/SkillsSection'
import { EducationSection } from '../sections/EducationSection'
import { CertificationSection } from '../sections/CertificationSection'
import { ContactSection } from '../sections/ContactSection'

export function EditorialTemplate({ portfolio, profile }: TemplateProps) {
  const { theme, sections } = portfolio
  const colors = getThemeColors(theme)

  // Sort visible sections by order, filter out hidden ones
  const visibleSections = [...sections]
    .filter((s) => s.visible)
    .sort((a, b) => a.order - b.order)

  const sectionMap: Record<SectionType, React.ReactNode> = {
    hero:           <HeroSection           key="hero"           profile={profile} theme={theme} variant="editorial" />,
    about:          <AboutSection          key="about"          profile={profile} theme={theme} variant="editorial" />,
    experience:     <ExperienceSection     key="experience"     profile={profile} theme={theme} variant="editorial" />,
    projects:       <ProjectsSection       key="projects"       profile={profile} theme={theme} variant="editorial" />,
    skills:         <SkillsSection         key="skills"         profile={profile} theme={theme} variant="editorial" />,
    education:      <EducationSection      key="education"      profile={profile} theme={theme} variant="editorial" />,
    certifications: <CertificationSection  key="certifications" profile={profile} theme={theme} variant="editorial" />,
    contact:        <ContactSection        key="contact"        profile={profile} theme={theme} variant="editorial" />,
  }

  return (
    <div
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        minHeight: '100%',
      }}
      data-template="editorial"
    >
      {visibleSections.map((section) => sectionMap[section.type])}

      {/* Footer line */}
      <footer
        className="py-6"
        style={{ borderTop: `1px solid ${colors.border}`, backgroundColor: colors.surface }}
      >
        <div className="section-shell">
          <p className="text-xs" style={{ color: colors.muted }}>
            {profile.fullName} — Built with FOLVIRA
          </p>
        </div>
      </footer>
    </div>
  )
}
