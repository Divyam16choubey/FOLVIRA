/**
 * EducationForm.tsx — Form for adding or editing education entries.
 */
import { useState } from 'react'
import { Button } from '../common/Button'
import type { Education } from '../../types/profile'

interface EducationFormProps {
  initialData?: Partial<Education>
  onSubmit: (data: Omit<Education, '_id' | 'source' | 'sourceId'>) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function EducationForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: EducationFormProps) {
  const [institution, setInstitution] = useState(initialData?.institution || '')
  const [degree, setDegree] = useState(initialData?.degree || '')
  const [field, setField] = useState(initialData?.field || '')
  const [startDate, setStartDate] = useState(initialData?.startDate || '')
  const [endDate, setEndDate] = useState(initialData?.endDate || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!institution.trim()) {
      setError('Institution / School name is required.')
      return
    }

    try {
      await onSubmit({
        institution: institution.trim(),
        degree: degree.trim() || undefined,
        field: field.trim() || undefined,
        startDate: startDate.trim() || undefined,
        endDate: endDate.trim() || undefined,
        description: description.trim() || undefined,
      })
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to save education. Please try again.')
      }
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-card border border-pine/30 bg-[#f8fbf9] p-5 sm:p-6"
    >
      <h3 className="text-sm font-extrabold uppercase tracking-[0.08em] text-pine">
        {initialData?._id ? 'Edit Education' : 'New Education'}
      </h3>

      {error && (
        <div role="alert" className="rounded-[var(--radius-control)] bg-red-50 p-3 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-bold uppercase tracking-[0.06em] text-muted">
          Institution / University <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={institution}
          onChange={(e) => setInstitution(e.target.value)}
          placeholder="e.g. Stanford University"
          className="mt-1 w-full rounded-[var(--radius-control)] border border-line bg-paper px-3 py-2 text-sm text-ink outline-none transition focus:border-pine"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-bold uppercase tracking-[0.06em] text-muted">
            Degree
          </label>
          <input
            type="text"
            value={degree}
            onChange={(e) => setDegree(e.target.value)}
            placeholder="e.g. Bachelor of Science"
            className="mt-1 w-full rounded-[var(--radius-control)] border border-line bg-paper px-3 py-2 text-sm text-ink outline-none transition focus:border-pine"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-[0.06em] text-muted">
            Field of Study
          </label>
          <input
            type="text"
            value={field}
            onChange={(e) => setField(e.target.value)}
            placeholder="e.g. Computer Science & Design"
            className="mt-1 w-full rounded-[var(--radius-control)] border border-line bg-paper px-3 py-2 text-sm text-ink outline-none transition focus:border-pine"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-bold uppercase tracking-[0.06em] text-muted">
            Start Year / Date
          </label>
          <input
            type="text"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="e.g. 2018"
            className="mt-1 w-full rounded-[var(--radius-control)] border border-line bg-paper px-3 py-2 text-sm text-ink outline-none transition focus:border-pine"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-[0.06em] text-muted">
            End Year / Date
          </label>
          <input
            type="text"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="e.g. 2022"
            className="mt-1 w-full rounded-[var(--radius-control)] border border-line bg-paper px-3 py-2 text-sm text-ink outline-none transition focus:border-pine"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-[0.06em] text-muted">
          Honors & Activities
        </label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Notable coursework, activities, honors, thesis..."
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
          {isSubmitting ? 'Saving...' : initialData?._id ? 'Update Education' : 'Add Education'}
        </Button>
      </div>
    </form>
  )
}
