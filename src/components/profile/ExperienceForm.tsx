/**
 * ExperienceForm.tsx — Form for adding or editing work experience entries.
 */
import { useState } from 'react'
import { Button } from '../common/Button'
import type { Experience } from '../../types/profile'

interface ExperienceFormProps {
  initialData?: Partial<Experience>
  onSubmit: (data: Omit<Experience, '_id' | 'source' | 'sourceId'>) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function ExperienceForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ExperienceFormProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [company, setCompany] = useState(initialData?.company || '')
  const [location, setLocation] = useState(initialData?.location || '')
  const [startDate, setStartDate] = useState(initialData?.startDate || '')
  const [endDate, setEndDate] = useState(initialData?.endDate || '')
  const [current, setCurrent] = useState(initialData?.current || false)
  const [description, setDescription] = useState(initialData?.description || '')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Job title is required.')
      return
    }
    if (!company.trim()) {
      setError('Company name is required.')
      return
    }

    try {
      await onSubmit({
        title: title.trim(),
        company: company.trim(),
        location: location.trim() || undefined,
        startDate: startDate.trim() || undefined,
        endDate: current ? undefined : (endDate.trim() || undefined),
        current,
        description: description.trim() || undefined,
      })
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to save experience. Please try again.')
      }
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-card border border-pine/30 bg-[#f8fbf9] p-5 sm:p-6"
    >
      <h3 className="text-sm font-extrabold uppercase tracking-[0.08em] text-pine">
        {initialData?._id ? 'Edit Experience' : 'New Experience'}
      </h3>

      {error && (
        <div role="alert" className="rounded-[var(--radius-control)] bg-red-50 p-3 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-bold uppercase tracking-[0.06em] text-muted">
            Job Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Senior Software Engineer"
            className="mt-1 w-full rounded-[var(--radius-control)] border border-line bg-paper px-3 py-2 text-sm text-ink outline-none transition focus:border-pine"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-[0.06em] text-muted">
            Company <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g. Acme Inc."
            className="mt-1 w-full rounded-[var(--radius-control)] border border-line bg-paper px-3 py-2 text-sm text-ink outline-none transition focus:border-pine"
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
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. San Francisco, CA / Remote"
            className="mt-1 w-full rounded-[var(--radius-control)] border border-line bg-paper px-3 py-2 text-sm text-ink outline-none transition focus:border-pine"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-[0.06em] text-muted">
            Start Date
          </label>
          <input
            type="text"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="e.g. Jan 2022"
            className="mt-1 w-full rounded-[var(--radius-control)] border border-line bg-paper px-3 py-2 text-sm text-ink outline-none transition focus:border-pine"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-[0.06em] text-muted">
            End Date
          </label>
          <input
            type="text"
            value={endDate}
            disabled={current}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder={current ? 'Present' : 'e.g. Dec 2023'}
            className="mt-1 w-full rounded-[var(--radius-control)] border border-line bg-paper px-3 py-2 text-sm text-ink outline-none transition disabled:opacity-50 focus:border-pine"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <input
          id="currentJobCheckbox"
          type="checkbox"
          checked={current}
          onChange={(e) => setCurrent(e.target.checked)}
          className="h-4 w-4 rounded border-line text-pine focus:ring-pine"
        />
        <label htmlFor="currentJobCheckbox" className="text-xs font-medium text-ink cursor-pointer select-none">
          I currently work here
        </label>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-[0.06em] text-muted">
          Description & Key Highlights
        </label>
        <textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your responsibilities, leadership, and accomplishments..."
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
          {isSubmitting ? 'Saving...' : initialData?._id ? 'Update Experience' : 'Add Experience'}
        </Button>
      </div>
    </form>
  )
}
