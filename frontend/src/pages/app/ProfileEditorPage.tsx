/**
 * ProfileEditorPage.tsx — Complete editorial profile editor for FOLVIRA.
 *
 * Implements the manual entry and editing layer with data provenance visibility.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppLayout } from '../../components/layout/AppLayout'
import { ProfileCompleteness } from '../../components/profile/ProfileCompleteness'
import { SectionCard } from '../../components/profile/SectionCard'
import { ExperienceForm } from '../../components/profile/ExperienceForm'
import { EducationForm } from '../../components/profile/EducationForm'
import { ProjectForm } from '../../components/profile/ProjectForm'
import { SkillInput } from '../../components/profile/SkillInput'
import { CertificationForm } from '../../components/profile/CertificationForm'
import { Button } from '../../components/common/Button'
import { api } from '../../lib/api'
import type {
  Profile,
  Experience,
  Education,
  Project,
  Certification,
  SocialLink,
} from '../../types/profile'

export function ProfileEditorPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [completeness, setCompleteness] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successToast, setSuccessToast] = useState('')

  // Basic info form state
  const [basicInfo, setBasicInfo] = useState({
    fullName: '',
    headline: '',
    location: '',
    email: '',
    phone: '',
    website: '',
    linkedinUrl: '',
    githubUrl: '',
    about: '',
  })
  const [isSavingBasic, setIsSavingBasic] = useState(false)

  // Sub-document forms state
  const [showExpForm, setShowExpForm] = useState(false)
  const [editingExp, setEditingExp] = useState<Experience | null>(null)

  const [showEduForm, setShowEduForm] = useState(false)
  const [editingEdu, setEditingEdu] = useState<Education | null>(null)

  const [showProjForm, setShowProjForm] = useState(false)
  const [editingProj, setEditingProj] = useState<Project | null>(null)

  const [showCertForm, setShowCertForm] = useState(false)
  const [editingCert, setEditingCert] = useState<Certification | null>(null)

  // Social links state
  const [socialLinks, setSocialLinks] = useState<{ platform: string; url: string }[]>([])
  const [isSavingSocial, setIsSavingSocial] = useState(false)

  const showToast = (msg: string) => {
    setSuccessToast(msg)
    setTimeout(() => setSuccessToast(''), 4000)
  }

  // Load profile data
  const loadProfile = async () => {
    try {
      setLoading(true)
      const res = await api.get<{ profile: Profile; completeness: number }>('/api/profile')
      setProfile(res.profile)
      setCompleteness(res.completeness)
      setBasicInfo({
        fullName: res.profile.fullName || '',
        headline: res.profile.headline || '',
        location: res.profile.location || '',
        email: res.profile.email || '',
        phone: res.profile.phone || '',
        website: res.profile.website || '',
        linkedinUrl: res.profile.linkedinUrl || '',
        githubUrl: res.profile.githubUrl || '',
        about: res.profile.about || '',
      })
      setSocialLinks(res.profile.socialLinks || [])
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to load profile.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadProfile()
  }, [])

  // ── Basic Info Save ────────────────────────────────────────────────────────
  const handleSaveBasicInfo = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingBasic(true)
    setError('')
    try {
      const res = await api.put<{ profile: Profile; completeness: number }>(
        '/api/profile',
        basicInfo
      )
      setProfile(res.profile)
      setCompleteness(res.completeness)
      showToast('Basic information saved successfully.')
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to update basic information.')
      }
    } finally {
      setIsSavingBasic(false)
    }
  }

  // ── Experience Handlers ───────────────────────────────────────────────────
  const handleSaveExperience = async (data: Omit<Experience, '_id' | 'source' | 'sourceId'>) => {
    if (editingExp) {
      const res = await api.put<{ profile: Profile }>(`/api/profile/experience/${editingExp._id}`, data)
      setProfile(res.profile)
      showToast('Experience updated.')
    } else {
      const res = await api.post<{ profile: Profile }>('/api/profile/experience', data)
      setProfile(res.profile)
      showToast('Experience added.')
    }
    setShowExpForm(false)
    setEditingExp(null)
  }

  const handleDeleteExperience = async (id: string) => {
    if (!confirm('Are you sure you want to delete this experience entry?')) return
    try {
      const res = await api.delete<{ profile: Profile }>(`/api/profile/experience/${id}`)
      setProfile(res.profile)
      showToast('Experience deleted.')
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message)
    }
  }

  // ── Education Handlers ────────────────────────────────────────────────────
  const handleSaveEducation = async (data: Omit<Education, '_id' | 'source' | 'sourceId'>) => {
    if (editingEdu) {
      const res = await api.put<{ profile: Profile }>(`/api/profile/education/${editingEdu._id}`, data)
      setProfile(res.profile)
      showToast('Education updated.')
    } else {
      const res = await api.post<{ profile: Profile }>('/api/profile/education', data)
      setProfile(res.profile)
      showToast('Education added.')
    }
    setShowEduForm(false)
    setEditingEdu(null)
  }

  const handleDeleteEducation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this education entry?')) return
    try {
      const res = await api.delete<{ profile: Profile }>(`/api/profile/education/${id}`)
      setProfile(res.profile)
      showToast('Education deleted.')
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message)
    }
  }

  // ── Project Handlers ──────────────────────────────────────────────────────
  const handleSaveProject = async (data: Omit<Project, '_id' | 'source' | 'sourceId'>) => {
    if (editingProj) {
      const res = await api.put<{ profile: Profile }>(`/api/profile/projects/${editingProj._id}`, data)
      setProfile(res.profile)
      showToast('Project updated.')
    } else {
      const res = await api.post<{ profile: Profile }>('/api/profile/projects', data)
      setProfile(res.profile)
      showToast('Project added.')
    }
    setShowProjForm(false)
    setEditingProj(null)
  }

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return
    try {
      const res = await api.delete<{ profile: Profile }>(`/api/profile/projects/${id}`)
      setProfile(res.profile)
      showToast('Project deleted.')
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message)
    }
  }

  // ── Skills Handlers ───────────────────────────────────────────────────────
  const handleAddSkills = async (newSkills: { name: string }[]) => {
    const res = await api.post<{ profile: Profile }>('/api/profile/skills', {
      skills: newSkills,
    })
    setProfile(res.profile)
    showToast('Skills updated.')
  }

  const handleDeleteSkill = async (skillId: string) => {
    const res = await api.delete<{ profile: Profile }>(`/api/profile/skills/${skillId}`)
    setProfile(res.profile)
    showToast('Skill removed.')
  }

  // ── Certification Handlers ────────────────────────────────────────────────
  const handleSaveCertification = async (data: Omit<Certification, '_id' | 'source'>) => {
    if (editingCert) {
      const res = await api.put<{ profile: Profile }>(`/api/profile/certifications/${editingCert._id}`, data)
      setProfile(res.profile)
      showToast('Certification updated.')
    } else {
      const res = await api.post<{ profile: Profile }>('/api/profile/certifications', data)
      setProfile(res.profile)
      showToast('Certification added.')
    }
    setShowCertForm(false)
    setEditingCert(null)
  }

  const handleDeleteCertification = async (id: string) => {
    if (!confirm('Are you sure you want to delete this certification?')) return
    try {
      const res = await api.delete<{ profile: Profile }>(`/api/profile/certifications/${id}`)
      setProfile(res.profile)
      showToast('Certification deleted.')
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message)
    }
  }

  // ── Social Links Save ─────────────────────────────────────────────────────
  const handleSaveSocialLinks = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingSocial(true)
    try {
      const validLinks = socialLinks.filter((l) => l.platform.trim() && l.url.trim())
      const res = await api.put<{ profile: Profile }>('/api/profile/social-links', {
        socialLinks: validLinks,
      })
      setProfile(res.profile)
      showToast('Social links saved.')
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message)
    } finally {
      setIsSavingSocial(false)
    }
  }

  const addSocialLinkRow = () => {
    setSocialLinks([...socialLinks, { platform: '', url: '' }])
  }

  const updateSocialLinkRow = (idx: number, field: 'platform' | 'url', val: string) => {
    const next = [...socialLinks]
    next[idx] = { ...next[idx], [field]: val }
    setSocialLinks(next)
  }

  const removeSocialLinkRow = (idx: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== idx))
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="section-shell py-24 text-center">
          <p className="font-display text-xl text-pine animate-pulse">
            Loading your professional profile…
          </p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="section-shell py-10 sm:py-14">
        {/* Toast alert */}
        {successToast && (
          <div
            role="status"
            className="fixed bottom-6 right-6 z-50 rounded-card border border-pine/30 bg-paper px-5 py-3 shadow-lift text-sm font-bold text-pine flex items-center gap-2"
          >
            <span className="h-2 w-2 rounded-full bg-pine animate-ping" />
            {successToast}
          </div>
        )}

        {/* Global error banner */}
        {error && (
          <div role="alert" className="mb-8 rounded-card border border-red-300 bg-red-50 p-4 text-sm font-semibold text-red-800">
            {error}
          </div>
        )}

        {/* Header with ingestion shortcuts */}
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow mb-2">Professional Identity</p>
            <h1 className="font-display text-3xl sm:text-4xl tracking-[-0.04em] text-ink">
              Profile Editor
            </h1>
            <p className="mt-1 text-sm text-muted">
              Manage your career narrative, portfolio projects, and verified credentials.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link to="/import/resume">
              <Button variant="secondary" className="px-3.5 py-2 text-xs">
                📄 Import Resume
              </Button>
            </Link>
            <Link to="/import/github">
              <Button variant="secondary" className="px-3.5 py-2 text-xs">
                🐙 Import GitHub
              </Button>
            </Link>
          </div>
        </div>

        {/* Completeness Bar */}
        <div className="mb-10">
          <ProfileCompleteness
            completeness={completeness}
            profile={profile || undefined}
          />
        </div>

        <div className="space-y-10">
          {/* ── 1. Basic Information & Bio ── */}
          <SectionCard
            id="basic"
            title="Basic Information & Bio"
            description="Your public headline, location, contact details, and career overview."
          >
            <form onSubmit={handleSaveBasicInfo} className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.06em] text-muted">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={basicInfo.fullName}
                    onChange={(e) => setBasicInfo({ ...basicInfo, fullName: e.target.value })}
                    className="mt-1 w-full rounded-[var(--radius-control)] border border-line bg-paper px-3.5 py-2 text-sm text-ink outline-none transition focus:border-pine"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.06em] text-muted">
                    Headline
                  </label>
                  <input
                    type="text"
                    value={basicInfo.headline}
                    onChange={(e) => setBasicInfo({ ...basicInfo, headline: e.target.value })}
                    placeholder="e.g. Staff Architect & Open Source Contributor"
                    className="mt-1 w-full rounded-[var(--radius-control)] border border-line bg-paper px-3.5 py-2 text-sm text-ink outline-none transition focus:border-pine"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.06em] text-muted">
                    Location
                  </label>
                  <input
                    type="text"
                    value={basicInfo.location}
                    onChange={(e) => setBasicInfo({ ...basicInfo, location: e.target.value })}
                    placeholder="e.g. New York, NY"
                    className="mt-1 w-full rounded-[var(--radius-control)] border border-line bg-paper px-3.5 py-2 text-sm text-ink outline-none transition focus:border-pine"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.06em] text-muted">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={basicInfo.email}
                    onChange={(e) => setBasicInfo({ ...basicInfo, email: e.target.value })}
                    placeholder="hello@example.com"
                    className="mt-1 w-full rounded-[var(--radius-control)] border border-line bg-paper px-3.5 py-2 text-sm text-ink outline-none transition focus:border-pine"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.06em] text-muted">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={basicInfo.phone}
                    onChange={(e) => setBasicInfo({ ...basicInfo, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="mt-1 w-full rounded-[var(--radius-control)] border border-line bg-paper px-3.5 py-2 text-sm text-ink outline-none transition focus:border-pine"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.06em] text-muted">
                    Personal Website
                  </label>
                  <input
                    type="url"
                    value={basicInfo.website}
                    onChange={(e) => setBasicInfo({ ...basicInfo, website: e.target.value })}
                    placeholder="https://yoursite.me"
                    className="mt-1 w-full rounded-[var(--radius-control)] border border-line bg-paper px-3.5 py-2 text-sm text-ink outline-none transition focus:border-pine"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.06em] text-muted">
                    LinkedIn Profile URL
                  </label>
                  <input
                    type="url"
                    value={basicInfo.linkedinUrl}
                    onChange={(e) => setBasicInfo({ ...basicInfo, linkedinUrl: e.target.value })}
                    placeholder="https://linkedin.com/in/username"
                    className="mt-1 w-full rounded-[var(--radius-control)] border border-line bg-paper px-3.5 py-2 text-sm text-ink outline-none transition focus:border-pine"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.06em] text-muted">
                    GitHub Profile URL
                  </label>
                  <input
                    type="url"
                    value={basicInfo.githubUrl}
                    onChange={(e) => setBasicInfo({ ...basicInfo, githubUrl: e.target.value })}
                    placeholder="https://github.com/username"
                    className="mt-1 w-full rounded-[var(--radius-control)] border border-line bg-paper px-3.5 py-2 text-sm text-ink outline-none transition focus:border-pine"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.06em] text-muted">
                  About & Career Summary
                </label>
                <textarea
                  rows={4}
                  value={basicInfo.about}
                  onChange={(e) => setBasicInfo({ ...basicInfo, about: e.target.value })}
                  placeholder="Share your journey, philosophical approach to your craft, and what drives you..."
                  className="mt-1 w-full rounded-[var(--radius-control)] border border-line bg-paper px-3.5 py-2 text-sm text-ink outline-none transition focus:border-pine"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isSavingBasic} className="px-5 py-2 text-xs">
                  {isSavingBasic ? 'Saving...' : 'Save Basic Info'}
                </Button>
              </div>
            </form>
          </SectionCard>

          {/* ── 2. Work Experience ── */}
          <SectionCard
            id="experience"
            title="Work Experience"
            description="Your professional career history and positions held."
            count={profile?.experience.length || 0}
            onAdd={() => {
              setEditingExp(null)
              setShowExpForm(true)
            }}
            addLabel="Add Position"
          >
            {showExpForm && (
              <div className="mb-6">
                <ExperienceForm
                  initialData={editingExp || undefined}
                  onSubmit={handleSaveExperience}
                  onCancel={() => {
                    setShowExpForm(false)
                    setEditingExp(null)
                  }}
                />
              </div>
            )}

            <div className="space-y-4">
              {profile?.experience.map((exp) => (
                <div
                  key={exp._id}
                  className="flex flex-col justify-between gap-3 rounded-[var(--radius-card)] border border-line bg-[#fffdfa] p-5 transition-all hover:border-pine/40 sm:flex-row sm:items-start"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-ink">{exp.title}</h3>
                      <span className="text-sm font-semibold text-pine">@ {exp.company}</span>
                      {exp.source !== 'manual' && (
                        <span className="rounded bg-line/60 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted">
                          {exp.source}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted">
                      {[
                        exp.location,
                        exp.startDate ? `${exp.startDate} – ${exp.current ? 'Present' : exp.endDate || 'Present'}` : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                    {exp.description && (
                      <p className="mt-2 text-sm leading-relaxed text-ink/85 whitespace-pre-line">
                        {exp.description}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-2 self-end sm:self-start">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingExp(exp)
                        setShowExpForm(true)
                      }}
                      className="text-xs font-bold text-pine hover:underline"
                    >
                      Edit
                    </button>
                    <span className="text-line">|</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteExperience(exp._id)}
                      className="text-xs font-bold text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}

              {!showExpForm && (!profile?.experience || profile.experience.length === 0) && (
                <p className="text-sm italic text-muted">
                  No work experience entries yet. Click &ldquo;+ Add Position&rdquo; above or import from your resume.
                </p>
              )}
            </div>
          </SectionCard>

          {/* ── 3. Projects & Creations ── */}
          <SectionCard
            id="projects"
            title="Projects & Showcase"
            description="Key projects, open-source repositories, and technical accomplishments."
            count={profile?.projects.length || 0}
            onAdd={() => {
              setEditingProj(null)
              setShowProjForm(true)
            }}
            addLabel="Add Project"
          >
            {showProjForm && (
              <div className="mb-6">
                <ProjectForm
                  initialData={editingProj || undefined}
                  onSubmit={handleSaveProject}
                  onCancel={() => {
                    setShowProjForm(false)
                    setEditingProj(null)
                  }}
                />
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {profile?.projects.map((proj) => (
                <div
                  key={proj._id}
                  className="flex flex-col justify-between rounded-[var(--radius-card)] border border-line bg-[#fffdfa] p-5 transition-all hover:border-pine/40"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-bold text-ink">{proj.name}</h3>
                      {proj.source !== 'manual' && (
                        <span className="rounded bg-line/60 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted">
                          {proj.source}
                        </span>
                      )}
                    </div>

                    {proj.description && (
                      <p className="text-xs leading-relaxed text-muted line-clamp-3">
                        {proj.description}
                      </p>
                    )}

                    {proj.technologies && proj.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {proj.technologies.map((t, idx) => (
                          <span
                            key={idx}
                            className="rounded bg-[#f1eee6] px-2 py-0.5 text-[10px] font-semibold text-ink"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-line/60 pt-3">
                    <div className="flex items-center gap-3">
                      {proj.url && (
                        <a
                          href={proj.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-pine hover:underline"
                        >
                          Live Demo ↗
                        </a>
                      )}
                      {proj.repoUrl && (
                        <a
                          href={proj.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-pine hover:underline"
                        >
                          GitHub ↗
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProj(proj)
                          setShowProjForm(true)
                        }}
                        className="text-xs font-bold text-pine hover:underline"
                      >
                        Edit
                      </button>
                      <span className="text-line">|</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteProject(proj._id)}
                        className="text-xs font-bold text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {!showProjForm && (!profile?.projects || profile.projects.length === 0) && (
              <p className="text-sm italic text-muted">
                No projects added yet. Click &ldquo;+ Add Project&rdquo; or sync with GitHub.
              </p>
            )}
          </SectionCard>

          {/* ── 4. Skills & Competencies ── */}
          <SectionCard
            id="skills"
            title="Skills & Expertise"
            description="Keywords, technologies, and methodologies defining your competence."
            count={profile?.skills.length || 0}
          >
            <SkillInput
              skills={profile?.skills || []}
              onAddSkills={handleAddSkills}
              onDeleteSkill={handleDeleteSkill}
            />
          </SectionCard>

          {/* ── 5. Education History ── */}
          <SectionCard
            id="education"
            title="Education"
            description="Degrees, academic credentials, and training."
            count={profile?.education.length || 0}
            onAdd={() => {
              setEditingEdu(null)
              setShowEduForm(true)
            }}
            addLabel="Add Education"
          >
            {showEduForm && (
              <div className="mb-6">
                <EducationForm
                  initialData={editingEdu || undefined}
                  onSubmit={handleSaveEducation}
                  onCancel={() => {
                    setShowEduForm(false)
                    setEditingEdu(null)
                  }}
                />
              </div>
            )}

            <div className="space-y-4">
              {profile?.education.map((edu) => (
                <div
                  key={edu._id}
                  className="flex flex-col justify-between gap-3 rounded-[var(--radius-card)] border border-line bg-[#fffdfa] p-5 transition-all hover:border-pine/40 sm:flex-row sm:items-start"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-ink">{edu.institution}</h3>
                      {edu.source !== 'manual' && (
                        <span className="rounded bg-line/60 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted">
                          {edu.source}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-pine">
                      {[edu.degree, edu.field].filter(Boolean).join(' in ')}
                    </p>
                    <p className="text-xs text-muted">
                      {[edu.startDate, edu.endDate].filter(Boolean).join(' – ')}
                    </p>
                    {edu.description && (
                      <p className="mt-2 text-sm text-ink/85">{edu.description}</p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-2 self-end sm:self-start">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingEdu(edu)
                        setShowEduForm(true)
                      }}
                      className="text-xs font-bold text-pine hover:underline"
                    >
                      Edit
                    </button>
                    <span className="text-line">|</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteEducation(edu._id)}
                      className="text-xs font-bold text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}

              {!showEduForm && (!profile?.education || profile.education.length === 0) && (
                <p className="text-sm italic text-muted">
                  No education entries yet. Click &ldquo;+ Add Education&rdquo; above.
                </p>
              )}
            </div>
          </SectionCard>

          {/* ── 6. Certifications ── */}
          <SectionCard
            id="certifications"
            title="Certifications & Licenses"
            description="Verified professional certifications, awards, and accreditations."
            count={profile?.certifications.length || 0}
            onAdd={() => {
              setEditingCert(null)
              setShowCertForm(true)
            }}
            addLabel="Add Certification"
          >
            {showCertForm && (
              <div className="mb-6">
                <CertificationForm
                  initialData={editingCert || undefined}
                  onSubmit={handleSaveCertification}
                  onCancel={() => {
                    setShowCertForm(false)
                    setEditingCert(null)
                  }}
                />
              </div>
            )}

            <div className="space-y-4">
              {profile?.certifications.map((cert) => (
                <div
                  key={cert._id}
                  className="flex items-center justify-between rounded-[var(--radius-card)] border border-line bg-[#fffdfa] p-4 transition-all hover:border-pine/40"
                >
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-ink">{cert.name}</h3>
                    <p className="text-xs text-muted">
                      {[cert.issuer, cert.date].filter(Boolean).join(' · ')}
                    </p>
                    {cert.url && (
                      <a
                        href={cert.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-pine hover:underline block"
                      >
                        View Credential ↗
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCert(cert)
                        setShowCertForm(true)
                      }}
                      className="text-xs font-bold text-pine hover:underline"
                    >
                      Edit
                    </button>
                    <span className="text-line">|</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteCertification(cert._id)}
                      className="text-xs font-bold text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}

              {!showCertForm && (!profile?.certifications || profile.certifications.length === 0) && (
                <p className="text-sm italic text-muted">
                  No certifications listed yet.
                </p>
              )}
            </div>
          </SectionCard>

          {/* ── 7. Social Links ── */}
          <SectionCard
            id="social"
            title="Social & Professional Links"
            description="External profiles such as Substack, X / Twitter, Dribbble, or Medium."
          >
            <form onSubmit={handleSaveSocialLinks} className="space-y-4">
              {socialLinks.map((link, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Platform (e.g. Substack)"
                    value={link.platform}
                    onChange={(e) => updateSocialLinkRow(idx, 'platform', e.target.value)}
                    className="w-1/3 rounded-[var(--radius-control)] border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
                  />
                  <input
                    type="url"
                    placeholder="https://..."
                    value={link.url}
                    onChange={(e) => updateSocialLinkRow(idx, 'url', e.target.value)}
                    className="flex-1 rounded-[var(--radius-control)] border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
                  />
                  <button
                    type="button"
                    onClick={() => removeSocialLinkRow(idx)}
                    className="text-sm font-bold text-red-600 hover:underline"
                    aria-label="Remove link row"
                  >
                    ×
                  </button>
                </div>
              ))}

              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="secondary"
                  className="px-3.5 py-1.5 text-xs"
                  onClick={addSocialLinkRow}
                >
                  + Add Link Row
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingSocial}
                  className="px-5 py-2 text-xs"
                >
                  {isSavingSocial ? 'Saving...' : 'Save Links'}
                </Button>
              </div>
            </form>
          </SectionCard>
        </div>
      </div>
    </AppLayout>
  )
}
