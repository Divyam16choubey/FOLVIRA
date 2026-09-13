/**
 * CertificationForm.tsx — Form for adding or editing certifications.
 */
import { useState } from 'react'
import { Button } from '../common/Button'
import type { Certification } from '../../types/profile'

interface CertificationFormProps {
  initialData?: Partial<Certification>
  onSubmit: (data: Omit<Certification, '_id' | 'source'>) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function CertificationForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: CertificationFormProps) {
  const [name, setName] = useState(initialData?.name || '')
  const [issuer, setIssuer] = useState(initialData?.issuer || '')
  const [date, setDate] = useState(initialData?.date || '')
  const [url, setUrl] = useState(initialData?.url || '')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Certification name is required.')
      return
    }

    try {
      await onSubmit({
        name: name.trim(),
        issuer: issuer.trim() || undefined,
        date: date.trim() || undefined,
        url: url.trim() || undefined,
      })
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to save certification. Please try again.')
      }
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-card border border-pine/30 bg-[#f8fbf9] p-5 sm:p-6"
    >
      <h3 className="text-sm font-extrabold uppercase tracking-[0.08em] text-pine">
        {initialData?._id ? 'Edit Certification' : 'New Certification'}
      </h3>

      {error && (
        <div role="alert" className="rounded-[var(--radius-control)] bg-red-50 p-3 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-bold uppercase tracking-[0.06em] text-muted">
            Certification Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. AWS Certified Solutions Architect"
            className="mt-1 w-full rounded-[var(--radius-control)] border border-line bg-paper px-3 py-2 text-sm text-ink outline-none transition focus:border-pine"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-[0.06em] text-muted">
            Issuing Organization
          </label>
          <input
            type="text"
            value={issuer}
            onChange={(e) => setIssuer(e.target.value)}
            placeholder="e.g. Amazon Web Services"
            className="mt-1 w-full rounded-[var(--radius-control)] border border-line bg-paper px-3 py-2 text-sm text-ink outline-none transition focus:border-pine"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-bold uppercase tracking-[0.06em] text-muted">
            Date Issued
          </label>
          <input
            type="text"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            placeholder="e.g. March 2023"
            className="mt-1 w-full rounded-[var(--radius-control)] border border-line bg-paper px-3 py-2 text-sm text-ink outline-none transition focus:border-pine"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-[0.06em] text-muted">
            Credential URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://credential.net/..."
            className="mt-1 w-full rounded-[var(--radius-control)] border border-line bg-paper px-3 py-2 text-sm text-ink outline-none transition focus:border-pine"
          />
        </div>
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
          {isSubmitting ? 'Saving...' : initialData?._id ? 'Update Certification' : 'Add Certification'}
        </Button>
      </div>
    </form>
  )
}
