/**
 * ProjectForm.tsx — Form for adding or editing projects.
 */
import { useState } from 'react'
import { Button } from '../common/Button'
import type { Project } from '../../types/profile'

interface ProjectFormProps {
  initialData?: Partial<Project>
  onSubmit: (data: Omit<Project, '_id' | 'source' | 'sourceId'>) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function ProjectForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ProjectFormProps) {
  const [name, setName] = useState(initialData?.name || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [url, setUrl] = useState(initialData?.url || '')
  const [repoUrl, setRepoUrl] = useState(initialData?.repoUrl || '')
  const [techInput, setTechInput] = useState(initialData?.technologies ? initialData.technologies.join(', ') : '')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Project name is required.')
      return
    }

    const technologies = techInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)

    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        url: url.trim() || undefined,
        repoUrl: repoUrl.trim() || undefined,
        technologies,
      })
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to save project. Please try again.')
      }
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-card border border-pine/30 bg-[#f8fbf9] p-5 sm:p-6"
    >
      <h3 className="text-sm font-extrabold uppercase tracking-[0.08em] text-pine">
        {initialData?._id ? 'Edit Project' : 'New Project'}
      </h3>

      {error && (
        <div role="alert" className="rounded-[var(--radius-control)] bg-red-50 p-3 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-bold uppercase tracking-[0.06em] text-muted">
          Project Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. FOLVIRA AI Portfolio Builder"
          className="mt-1 w-full rounded-[var(--radius-control)] border border-line bg-paper px-3 py-2 text-sm text-ink outline-none transition focus:border-pine"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-bold uppercase tracking-[0.06em] text-muted">
            Live URL / Demo Link
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="mt-1 w-full rounded-[var(--radius-control)] border border-line bg-paper px-3 py-2 text-sm text-ink outline-none transition focus:border-pine"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-[0.06em] text-muted">
            Repository URL
          </label>
          <input
            type="url"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/username/project"
            className="mt-1 w-full rounded-[var(--radius-control)] border border-line bg-paper px-3 py-2 text-sm text-ink outline-none transition focus:border-pine"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-[0.06em] text-muted">
          Technologies & Tools (comma separated)
        </label>
        <input
          type="text"
          value={techInput}
          onChange={(e) => setTechInput(e.target.value)}
          placeholder="React, TypeScript, Node.js, MongoDB, TailwindCSS"
          className="mt-1 w-full rounded-[var(--radius-control)] border border-line bg-paper px-3 py-2 text-sm text-ink outline-none transition focus:border-pine"
        />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-[0.06em] text-muted">
          Project Narrative & Impact
        </label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What problem did it solve? What architecture did you use? What were the quantifiable results?"
          className="mt-1 w-full rounded-[var(--radius-control)] border border-line bg-paper px-3 py-2 text-sm text-ink outline-none transition focus:border-pine"
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          variant="secondary"
          className="px-4 py-2 text-xs"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="px-4 py-2 text-xs"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : initialData?._id ? 'Update Project' : 'Add Project'}
        </Button>
      </div>
    </form>
  )
}
