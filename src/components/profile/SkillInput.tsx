/**
 * SkillInput.tsx — Interactive skill chip manager with provenance tags.
 */
import { useState } from 'react'
import { Button } from '../common/Button'
import type { Skill } from '../../types/profile'

interface SkillInputProps {
  skills: Skill[]
  onAddSkills: (newSkills: { name: string }[]) => Promise<void>
  onDeleteSkill: (skillId: string) => Promise<void>
  disabled?: boolean
}

export function SkillInput({
  skills,
  onAddSkills,
  onDeleteSkill,
  disabled = false,
}: SkillInputProps) {
  const [inputVal, setInputVal] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleAdd = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError('')

    const names = inputVal
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    if (names.length === 0) return

    // Filter out duplicates against current skills
    const existing = new Set(skills.map((s) => s.name.toLowerCase()))
    const unique = names.filter((n) => !existing.has(n.toLowerCase()))

    if (unique.length === 0) {
      setError('Skills are already present.')
      return
    }

    setIsAdding(true)
    try {
      await onAddSkills(unique.map((name) => ({ name })))
      setInputVal('')
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to add skills.')
      }
    } finally {
      setIsAdding(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await onDeleteSkill(id)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Input box */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Add skills (e.g. React, System Design, Python)..."
          disabled={disabled || isAdding}
          className="flex-1 rounded-[var(--radius-control)] border border-line bg-paper px-3.5 py-2 text-sm text-ink outline-none transition focus:border-pine disabled:opacity-50"
        />
        <Button
          type="submit"
          className="px-4 py-2 text-xs"
          disabled={disabled || isAdding || !inputVal.trim()}
        >
          {isAdding ? 'Adding...' : 'Add Skill'}
        </Button>
      </form>

      {error && (
        <p role="alert" className="text-xs text-red-600 font-medium">
          {error}
        </p>
      )}

      {/* Chip list */}
      <div className="flex flex-wrap gap-2 pt-2">
        {skills.map((skill) => (
          <span
            key={skill._id}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-[#f8f5ef] py-1 pl-3 pr-2 text-xs font-semibold text-ink transition-colors hover:border-pine/40"
          >
            <span>{skill.name}</span>

            {/* Provenance badge */}
            {skill.source !== 'manual' && (
              <span className="rounded bg-line/60 px-1 py-0.2 text-[9px] font-bold uppercase tracking-wider text-muted">
                {skill.source}
              </span>
            )}

            {/* Remove button */}
            <button
              type="button"
              onClick={() => handleDelete(skill._id)}
              disabled={disabled || deletingId === skill._id}
              aria-label={`Remove skill ${skill.name}`}
              className="ml-1 flex h-4 w-4 items-center justify-center rounded-full text-muted hover:bg-line hover:text-ink disabled:opacity-40"
            >
              ×
            </button>
          </span>
        ))}

        {skills.length === 0 && (
          <p className="text-xs italic text-muted">
            No skills added yet. Type above to add keywords or import them via resume.
          </p>
        )}
      </div>
    </div>
  )
}
