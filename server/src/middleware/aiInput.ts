/**
 * aiInput.ts — AI input sanitizer.
 *
 * Converts a full Mongoose Profile document into a safe AIProfileInput
 * that contains ONLY professional information needed for AI operations.
 *
 * NEVER included in AI input:
 * - passwordHash (from User model)
 * - emailVerificationTokenHash / passwordResetTokenHash (from User model)
 * - userId (internal ObjectId)
 * - profileId (internal ObjectId)
 * - __v (Mongoose version key)
 * - sourceId (internal import tracking)
 * - profilePhoto (binary/URL not useful for text AI)
 * - phone / email (PII not needed for content analysis)
 * - socialLinks (not relevant for content AI)
 * - languages (not typically analysed for text quality)
 *
 * This is a hard whitelist approach — only explicitly allowed fields pass through.
 */

import type { IProfile } from '../models/Profile'
import type { AIProfileInput } from '../services/ai.provider'

/**
 * Converts a full Profile document to a minimal, safe AIProfileInput.
 * Call this before passing any profile data to an AI provider.
 */
export function toAIInput(profile: IProfile): AIProfileInput {
  return {
    // Basic info — no PII, no URLs, no internal IDs
    fullName: profile.fullName,
    headline: profile.headline,
    location: profile.location,
    about: profile.about,

    // Skills — only the name, not the source/sourceId
    skills: profile.skills.map((s) => ({
      name: s.name,
    })),

    // Experience — professional content only
    experience: profile.experience.map((e) => ({
      title: e.title,
      company: e.company,
      location: e.location,
      startDate: e.startDate,
      endDate: e.endDate,
      current: e.current,
      description: e.description,
    })),

    // Education — academic content only
    education: profile.education.map((edu) => ({
      institution: edu.institution,
      degree: edu.degree,
      field: edu.field,
      startDate: edu.startDate,
      endDate: edu.endDate,
      description: edu.description,
    })),

    // Projects — professional content only
    projects: profile.projects.map((p) => ({
      name: p.name,
      description: p.description,
      url: p.url,      // public URL is fine
      technologies: p.technologies,
    })),

    // Certifications — professional content only
    certifications: profile.certifications.map((c) => ({
      name: c.name,
      issuer: c.issuer,
      date: c.date,
    })),

    // Achievements — professional content only
    achievements: profile.achievements.map((a) => ({
      title: a.title,
      description: a.description,
    })),
  }
}

/**
 * Guard: Verifies the AI input contains no secrets.
 * Throws if any suspicious key is found.
 * Used in tests to confirm sanitization is correct.
 */
export function assertNoSecrets(input: unknown): void {
  const forbidden = [
    'passwordHash',
    'emailVerificationTokenHash',
    'passwordResetTokenHash',
    'password',
    'token',
    'secret',
    'apiKey',
    'api_key',
  ]

  const serialized = JSON.stringify(input).toLowerCase()
  for (const key of forbidden) {
    if (serialized.includes(`"${key.toLowerCase()}"`)) {
      throw new Error(`AI input contains forbidden field: ${key}`)
    }
  }
}
