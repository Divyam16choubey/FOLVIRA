/**
 * profile.service.ts — Profile business logic.
 *
 * Pure functions that operate on the Profile model.
 * No HTTP concerns (Request/Response) — only business logic.
 */
import mongoose from 'mongoose'
import { Profile, IProfile, ISkill } from '../models/Profile'
import { User } from '../models/User'

// ─── Profile CRUD ─────────────────────────────────────────────────────────────

/**
 * Get the profile for a user. Creates an empty profile on first access
 * with the user's name seeded from the User document.
 */
export async function getOrCreateProfile(userId: string): Promise<IProfile> {
  let profile = await Profile.findOne({ userId })

  if (!profile) {
    // Seed fullName from the User document
    const user = await User.findById(userId)
    const fullName = user?.name ?? ''

    profile = await Profile.create({
      userId,
      fullName,
      skills: [],
      experience: [],
      education: [],
      projects: [],
      certifications: [],
      achievements: [],
      publications: [],
      languages: [],
      socialLinks: [],
    })
  }

  return profile
}

/**
 * Update basic profile information (top-level fields only).
 * Does not touch sub-document arrays.
 */
export async function updateBasicInfo(
  userId: string,
  data: {
    fullName?: string
    headline?: string
    profilePhoto?: string
    location?: string
    email?: string
    phone?: string
    website?: string
    linkedinUrl?: string
    githubUrl?: string
    about?: string
  }
): Promise<IProfile> {
  const profile = await getOrCreateProfile(userId)

  // Only update fields that are provided
  const allowedFields = [
    'fullName',
    'headline',
    'profilePhoto',
    'location',
    'email',
    'phone',
    'website',
    'linkedinUrl',
    'githubUrl',
    'about',
  ] as const

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      ;(profile as unknown as Record<string, unknown>)[field] = data[field]
    }
  }

  await profile.save()
  return profile
}

/**
 * Update social links (replaces entire array).
 */
export async function updateSocialLinks(
  userId: string,
  socialLinks: { platform: string; url: string }[]
): Promise<IProfile> {
  const profile = await getOrCreateProfile(userId)
  profile.socialLinks = socialLinks as IProfile['socialLinks']
  await profile.save()
  return profile
}

// ─── Sub-document array CRUD ──────────────────────────────────────────────────

type ArraySection =
  | 'experience'
  | 'education'
  | 'projects'
  | 'certifications'
  | 'achievements'
  | 'publications'
  | 'languages'

/**
 * Add an entry to a sub-document array.
 */
export async function addEntry(
  userId: string,
  section: ArraySection,
  data: Record<string, unknown>
): Promise<IProfile> {
  const profile = await getOrCreateProfile(userId)
  const arr = profile[section] as unknown as mongoose.Types.DocumentArray<Record<string, unknown>>
  arr.push(data)
  await profile.save()
  return profile
}

/**
 * Update an existing entry in a sub-document array.
 */
export async function updateEntry(
  userId: string,
  section: ArraySection,
  entryId: string,
  data: Record<string, unknown>
): Promise<IProfile | null> {
  const profile = await Profile.findOne({ userId })
  if (!profile) return null

  const arr = profile[section] as unknown as mongoose.Types.DocumentArray<Record<string, unknown>>
  const entry = arr.id(entryId)
  if (!entry) return null

  // Update only provided fields, never overwrite _id or source
  for (const [key, value] of Object.entries(data)) {
    if (key !== '_id' && key !== 'source' && key !== 'sourceId') {
      entry.set(key, value)
    }
  }

  await profile.save()
  return profile
}

/**
 * Delete an entry from a sub-document array.
 */
export async function deleteEntry(
  userId: string,
  section: ArraySection,
  entryId: string
): Promise<IProfile | null> {
  const profile = await Profile.findOne({ userId })
  if (!profile) return null

  const arr = profile[section] as unknown as mongoose.Types.DocumentArray<Record<string, unknown>>
  const entry = arr.id(entryId)
  if (!entry) return null

  arr.pull({ _id: entryId })
  await profile.save()
  return profile
}

// ─── Skills (special handling: add multiple, remove by id) ────────────────────

/**
 * Add one or more skills (deduplicated by name, case-insensitive).
 */
export async function addSkills(
  userId: string,
  skills: { name: string; source?: string }[]
): Promise<IProfile> {
  const profile = await getOrCreateProfile(userId)

  for (const skill of skills) {
    const normalizedName = skill.name.trim().toLowerCase()
    const exists = profile.skills.some(
      (s) => s.name.toLowerCase() === normalizedName
    )
    if (!exists) {
      profile.skills.push({
        name: skill.name.trim(),
        source: (skill.source as 'manual') || 'manual',
      } as IProfile['skills'][0])
    }
  }

  await profile.save()
  return profile
}

/**
 * Remove a skill by its _id.
 */
export async function removeSkill(
  userId: string,
  skillId: string
): Promise<IProfile | null> {
  const profile = await Profile.findOne({ userId })
  if (!profile) return null

  const skillArr = profile.skills as unknown as mongoose.Types.DocumentArray<ISkill>
  const skill = skillArr.id(skillId)
  if (!skill) return null

  skillArr.pull({ _id: skillId })
  await profile.save()
  return profile
}

// ─── Profile completeness calculation ─────────────────────────────────────────

/**
 * Calculates a profile completeness percentage based on filled sections.
 */
export function calculateCompleteness(profile: IProfile): number {
  let total = 0
  let filled = 0

  // Basic info fields (each worth 1 point)
  const basicFields: (keyof IProfile)[] = [
    'fullName',
    'headline',
    'location',
    'email',
    'about',
  ]
  for (const field of basicFields) {
    total += 1
    if (profile[field]) filled += 1
  }

  // Array sections (each worth 2 points if has at least one entry)
  const arraySections: (keyof IProfile)[] = [
    'experience',
    'education',
    'projects',
    'skills',
    'certifications',
  ]
  for (const section of arraySections) {
    total += 2
    const arr = profile[section]
    if (Array.isArray(arr) && arr.length > 0) filled += 2
  }

  // Social links (1 point)
  total += 1
  if (profile.socialLinks.length > 0) filled += 1

  return Math.round((filled / total) * 100)
}

/**
 * Returns a safe profile object suitable for API responses.
 * Strips Mongoose internals (__v, etc.) while keeping all data.
 */
export function toSafeProfile(profile: IProfile) {
  const obj = profile.toObject()
  delete (obj as Record<string, unknown>)['__v']
  return obj
}
