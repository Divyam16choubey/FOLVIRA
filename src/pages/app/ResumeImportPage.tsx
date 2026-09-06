/**
 * ResumeImportPage.tsx — Resume PDF/DOCX ingestion and review interface.
 *
 * Implements:
 * 1. Client-side file validation (< 5MB, .pdf or .docx)
 * 2. Upload to /api/profile/resume/upload
 * 3. Interactive section preview & selection (user controls what to import)
 * 4. User-confirmed merge via /api/profile/resume/merge
 */
import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppLayout } from '../../components/layout/AppLayout'
import { Button } from '../../components/common/Button'
import { api } from '../../lib/api'
import type { ResumeExtraction, Profile } from '../../types/profile'

export function ResumeImportPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [extraction, setExtraction] = useState<ResumeExtraction | null>(null)

  // Selective merge state
  const [includeBasic, setIncludeBasic] = useState(true)
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [selectedExps, setSelectedExps] = useState<number[]>([])
  const [selectedEdus, setSelectedEdus] = useState<number[]>([])
  const [isMerging, setIsMerging] = useState(false)
  const [mergeSuccess, setMergeSuccess] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('File is too large. Maximum allowed size is 5MB.')
      return
    }

    // Check extension
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext !== 'pdf' && ext !== 'docx') {
      setError('Invalid file type. Please upload a .pdf or .docx document.')
      return
    }

    setSelectedFile(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    setIsUploading(true)
    setError('')

    const formData = new FormData()
    formData.append('resume', selectedFile)

    try {
      const res = await api.upload<{ extracted: ResumeExtraction }>(
        '/api/profile/resume/upload',
        formData
      )
      setExtraction(res.extracted)
      // By default select all extracted items
      setSelectedSkills(res.extracted.skills || [])
      setSelectedExps(res.extracted.experience.map((_, i) => i))
      setSelectedEdus(res.extracted.education.map((_, i) => i))
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to process resume file. Please ensure it contains readable text.')
      }
    } finally {
      setIsUploading(false)
    }
  }

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill))
    } else {
      setSelectedSkills([...selectedSkills, skill])
    }
  }

  const toggleExp = (index: number) => {
    if (selectedExps.includes(index)) {
      setSelectedExps(selectedExps.filter((i) => i !== index))
    } else {
      setSelectedExps([...selectedExps, index])
    }
  }

  const toggleEdu = (index: number) => {
    if (selectedEdus.includes(index)) {
      setSelectedEdus(selectedEdus.filter((i) => i !== index))
    } else {
      setSelectedEdus([...selectedEdus, index])
    }
  }

  const handleConfirmMerge = async () => {
    if (!extraction) return
    setIsMerging(true)
    setError('')

    try {
      const payload: {
        fullName?: string
        email?: string
        phone?: string
        location?: string
        website?: string
        linkedinUrl?: string
        githubUrl?: string
        about?: string
        skills?: string[]
        experience?: ResumeExtraction['experience']
        education?: ResumeExtraction['education']
      } = {}

      if (includeBasic) {
        if (extraction.fullName) payload.fullName = extraction.fullName
        if (extraction.email) payload.email = extraction.email
        if (extraction.phone) payload.phone = extraction.phone
        if (extraction.location) payload.location = extraction.location
        if (extraction.website) payload.website = extraction.website
        if (extraction.linkedinUrl) payload.linkedinUrl = extraction.linkedinUrl
        if (extraction.githubUrl) payload.githubUrl = extraction.githubUrl
        if (extraction.about) payload.about = extraction.about
      }

      if (selectedSkills.length > 0) {
        payload.skills = selectedSkills
      }

      if (selectedExps.length > 0) {
        payload.experience = extraction.experience.filter((_, idx) =>
          selectedExps.includes(idx)
        )
      }

      if (selectedEdus.length > 0) {
        payload.education = extraction.education.filter((_, idx) =>
          selectedEdus.includes(idx)
        )
      }

      await api.post<{ profile: Profile; completeness: number }>(
        '/api/profile/resume/merge',
        payload
      )

      setMergeSuccess(true)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to merge resume data into profile.')
      }
    } finally {
      setIsMerging(false)
    }
  }

  return (
    <AppLayout>
      <div className="section-shell max-w-4xl py-10 sm:py-14">
        {/* Breadcrumb / Back */}
        <div className="mb-6">
          <Link
            to="/profile"
            className="text-xs font-bold text-muted hover:text-pine transition-colors"
          >
            ← Back to Profile Editor
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <p className="eyebrow mb-2">Data Ingestion</p>
          <h1 className="font-display text-3xl sm:text-4xl tracking-[-0.04em] text-ink">
            Resume Import
          </h1>
          <p className="mt-1 text-sm text-muted">
            Upload your CV (.pdf or .docx). FOLVIRA parses your experience, skills, and background so you can review and selectively merge into your profile.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-card border border-red-300 bg-red-50 p-4 text-sm font-semibold text-red-800"
          >
            {error}
          </div>
        )}

        {mergeSuccess ? (
          <div className="rounded-card border border-pine/30 bg-[#edf4f1] p-8 text-center shadow-soft">
            <span className="inline-block rounded-full bg-pine/10 p-3 text-pine mb-3">
              ✓
            </span>
            <h2 className="font-display text-2xl text-pine">
              Resume Successfully Merged
            </h2>
            <p className="mt-2 text-sm text-ink/80 max-w-md mx-auto">
              Your selected experiences, skills, and background have been synthesized into your professional profile with resume provenance tags.
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <Button onClick={() => navigate('/profile')}>
                View Profile Editor
              </Button>
              <Button variant="secondary" onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </Button>
            </div>
          </div>
        ) : !extraction ? (
          /* File Upload Box */
          <div className="rounded-card border-2 border-dashed border-line bg-paper p-8 sm:p-12 text-center shadow-soft">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
            />

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f1eee6] text-pine text-2xl mb-4">
              📄
            </div>

            <h2 className="font-display text-xl text-ink">
              Choose your resume document
            </h2>
            <p className="mt-1.5 text-xs text-muted">
              PDF or DOCX format, up to 5MB. In-memory processing only.
            </p>

            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {selectedFile ? 'Choose another file' : 'Select File'}
              </Button>

              {selectedFile && (
                <Button onClick={handleUpload} disabled={isUploading}>
                  {isUploading ? 'Extracting text…' : 'Upload & Analyze Resume'}
                </Button>
              )}
            </div>

            {selectedFile && (
              <p className="mt-4 text-xs font-semibold text-pine">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>
        ) : (
          /* Extraction Preview & User Selection */
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <h2 className="font-display text-2xl text-ink">Extracted Information</h2>
                <p className="text-xs text-muted">
                  Review extracted data below. Select the items you want to merge.
                </p>
              </div>
              <Button
                variant="secondary"
                className="text-xs"
                onClick={() => {
                  setExtraction(null)
                  setSelectedFile(null)
                }}
              >
                Upload Different File
              </Button>
            </div>

            {/* Basic Info Preview */}
            <div className="rounded-card border border-line bg-paper p-6 shadow-soft">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeBasic}
                  onChange={(e) => setIncludeBasic(e.target.checked)}
                  className="h-4 w-4 rounded border-line text-pine focus:ring-pine"
                />
                <span className="font-display text-lg text-ink">
                  Contact & Basic Information
                </span>
              </label>

              {includeBasic && (
                <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
                  {extraction.fullName && (
                    <div>
                      <dt className="font-bold text-muted">Name</dt>
                      <dd className="font-semibold text-ink">{extraction.fullName}</dd>
                    </div>
                  )}
                  {extraction.email && (
                    <div>
                      <dt className="font-bold text-muted">Email</dt>
                      <dd className="font-semibold text-ink">{extraction.email}</dd>
                    </div>
                  )}
                  {extraction.phone && (
                    <div>
                      <dt className="font-bold text-muted">Phone</dt>
                      <dd className="font-semibold text-ink">{extraction.phone}</dd>
                    </div>
                  )}
                  {extraction.location && (
                    <div>
                      <dt className="font-bold text-muted">Location</dt>
                      <dd className="font-semibold text-ink">{extraction.location}</dd>
                    </div>
                  )}
                  {extraction.linkedinUrl && (
                    <div>
                      <dt className="font-bold text-muted">LinkedIn</dt>
                      <dd className="font-semibold text-ink truncate">{extraction.linkedinUrl}</dd>
                    </div>
                  )}
                  {extraction.githubUrl && (
                    <div>
                      <dt className="font-bold text-muted">GitHub</dt>
                      <dd className="font-semibold text-ink truncate">{extraction.githubUrl}</dd>
                    </div>
                  )}
                  {extraction.about && (
                    <div className="sm:col-span-2">
                      <dt className="font-bold text-muted">Summary</dt>
                      <dd className="font-semibold text-ink line-clamp-3">{extraction.about}</dd>
                    </div>
                  )}
                </dl>
              )}
            </div>

            {/* Skills Preview */}
            {extraction.skills && extraction.skills.length > 0 && (
              <div className="rounded-card border border-line bg-paper p-6 shadow-soft">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display text-lg text-ink">
                    Detected Skills ({selectedSkills.length}/{extraction.skills.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedSkills(
                        selectedSkills.length === extraction.skills.length
                          ? []
                          : [...extraction.skills]
                      )
                    }
                    className="text-xs font-bold text-pine hover:underline"
                  >
                    {selectedSkills.length === extraction.skills.length
                      ? 'Deselect All'
                      : 'Select All'}
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {extraction.skills.map((skill, idx) => {
                    const isSelected = selectedSkills.includes(skill)
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                          isSelected
                            ? 'bg-pine text-white'
                            : 'bg-surface-muted text-muted hover:text-ink'
                        }`}
                      >
                        {skill} {isSelected ? '✓' : '+'}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Experience Preview */}
            {extraction.experience && extraction.experience.length > 0 && (
              <div className="rounded-card border border-line bg-paper p-6 shadow-soft">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-lg text-ink">
                    Work Experience ({selectedExps.length}/{extraction.experience.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedExps(
                        selectedExps.length === extraction.experience.length
                          ? []
                          : extraction.experience.map((_, i) => i)
                      )
                    }
                    className="text-xs font-bold text-pine hover:underline"
                  >
                    {selectedExps.length === extraction.experience.length
                      ? 'Deselect All'
                      : 'Select All'}
                  </button>
                </div>

                <div className="space-y-3">
                  {extraction.experience.map((exp, idx) => {
                    const isSelected = selectedExps.includes(idx)
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleExp(idx)}
                        className={`cursor-pointer rounded-[var(--radius-card)] border p-4 transition-all ${
                          isSelected
                            ? 'border-pine bg-[#f8fbf9]'
                            : 'border-line bg-paper opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleExp(idx)}
                            className="h-4 w-4 rounded border-line text-pine focus:ring-pine"
                          />
                          <div className="flex-1">
                            <h4 className="text-sm font-bold text-ink">
                              {exp.title}{' '}
                              <span className="text-pine">@ {exp.company}</span>
                            </h4>
                            <p className="text-xs text-muted">
                              {[exp.location, exp.startDate ? `${exp.startDate} – ${exp.endDate || 'Present'}` : null]
                                .filter(Boolean)
                                .join(' · ')}
                            </p>
                            {exp.description && (
                              <p className="mt-1 text-xs text-ink/80 line-clamp-2">
                                {exp.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Education Preview */}
            {extraction.education && extraction.education.length > 0 && (
              <div className="rounded-card border border-line bg-paper p-6 shadow-soft">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-lg text-ink">
                    Education ({selectedEdus.length}/{extraction.education.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedEdus(
                        selectedEdus.length === extraction.education.length
                          ? []
                          : extraction.education.map((_, i) => i)
                      )
                    }
                    className="text-xs font-bold text-pine hover:underline"
                  >
                    {selectedEdus.length === extraction.education.length
                      ? 'Deselect All'
                      : 'Select All'}
                  </button>
                </div>

                <div className="space-y-3">
                  {extraction.education.map((edu, idx) => {
                    const isSelected = selectedEdus.includes(idx)
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleEdu(idx)}
                        className={`cursor-pointer rounded-[var(--radius-card)] border p-4 transition-all ${
                          isSelected
                            ? 'border-pine bg-[#f8fbf9]'
                            : 'border-line bg-paper opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleEdu(idx)}
                            className="h-4 w-4 rounded border-line text-pine focus:ring-pine"
                          />
                          <div>
                            <h4 className="text-sm font-bold text-ink">
                              {edu.institution}
                            </h4>
                            <p className="text-xs text-pine font-medium">
                              {[edu.degree, edu.field].filter(Boolean).join(' in ')}
                            </p>
                            <p className="text-xs text-muted">
                              {[edu.startDate, edu.endDate].filter(Boolean).join(' – ')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Confirm Merge Action Bar */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setExtraction(null)
                  setSelectedFile(null)
                }}
                disabled={isMerging}
              >
                Cancel
              </Button>
              <Button onClick={handleConfirmMerge} disabled={isMerging}>
                {isMerging ? 'Merging into profile…' : 'Confirm & Merge Selected'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
