/**
 * profile.controller.ts — HTTP handlers for /api/profile/* routes.
 *
 * Thin HTTP translation layer:
 *   1. Reads validated inputs from req.body / req.params
 *   2. Calls the appropriate service function
 *   3. Sends safe JSON responses
 *   4. Calls next(err) on failure
 *
 * All handlers use req.userId (set by authenticate middleware).
 * Client-provided user IDs are NEVER trusted.
 */
import { Request, Response, NextFunction } from 'express'
import { validationResult } from 'express-validator'
import {
  getOrCreateProfile,
  updateBasicInfo,
  updateSocialLinks,
  addEntry,
  updateEntry,
  deleteEntry,
  addSkills,
  removeSkill,
  calculateCompleteness,
  toSafeProfile,
} from '../services/profile.service'
import { extractText, parseResume } from '../services/resume.service'
import {
  fetchGitHubData,
  repoToProject,
  GitHubError,
} from '../services/github.service'
import { DataSource } from '../models/DataSource'
import { Profile } from '../models/Profile'
import { createError } from '../middleware/errorHandler'

/** Reads express-validator results and throws a 400 if invalid. */
function assertValidation(req: Request): void {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const message = errors.array()[0]?.msg ?? 'Validation failed'
    throw createError(message, 400)
  }
}

/** Safely extract route param 'id' as a string (Express 5 types params as string | string[]). */
function paramId(req: Request): string {
  const id = req.params['id']
  if (Array.isArray(id)) return id[0]
  return id
}

// ─── GET /api/profile ─────────────────────────────────────────────────────────

export async function getProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const profile = await getOrCreateProfile(req.userId!)
    const completeness = calculateCompleteness(profile)

    res.json({
      success: true,
      data: {
        profile: toSafeProfile(profile),
        completeness,
      },
    })
  } catch (err) {
    next(err)
  }
}

// ─── PUT /api/profile ─────────────────────────────────────────────────────────

export async function updateProfileHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    assertValidation(req)

    const profile = await updateBasicInfo(req.userId!, req.body as Record<string, string>)
    const completeness = calculateCompleteness(profile)

    res.json({
      success: true,
      data: {
        profile: toSafeProfile(profile),
        completeness,
      },
    })
  } catch (err) {
    next(err)
  }
}

// ─── Experience CRUD ──────────────────────────────────────────────────────────

export async function addExperienceHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    assertValidation(req)
    const data = { ...req.body as Record<string, unknown>, source: 'manual' }
    const profile = await addEntry(req.userId!, 'experience', data)

    res.status(201).json({
      success: true,
      data: { profile: toSafeProfile(profile) },
    })
  } catch (err) {
    next(err)
  }
}

export async function updateExperienceHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    assertValidation(req)
    const profile = await updateEntry(
      req.userId!,
      'experience',
      paramId(req),
      req.body as Record<string, unknown>
    )

    if (!profile) {
      throw createError('Experience entry not found', 404)
    }

    res.json({
      success: true,
      data: { profile: toSafeProfile(profile) },
    })
  } catch (err) {
    next(err)
  }
}

export async function deleteExperienceHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const profile = await deleteEntry(req.userId!, 'experience', paramId(req))

    if (!profile) {
      throw createError('Experience entry not found', 404)
    }

    res.json({
      success: true,
      data: { profile: toSafeProfile(profile) },
    })
  } catch (err) {
    next(err)
  }
}

// ─── Education CRUD ───────────────────────────────────────────────────────────

export async function addEducationHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    assertValidation(req)
    const data = { ...req.body as Record<string, unknown>, source: 'manual' }
    const profile = await addEntry(req.userId!, 'education', data)

    res.status(201).json({
      success: true,
      data: { profile: toSafeProfile(profile) },
    })
  } catch (err) {
    next(err)
  }
}

export async function updateEducationHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    assertValidation(req)
    const profile = await updateEntry(
      req.userId!,
      'education',
      paramId(req),
      req.body as Record<string, unknown>
    )

    if (!profile) {
      throw createError('Education entry not found', 404)
    }

    res.json({
      success: true,
      data: { profile: toSafeProfile(profile) },
    })
  } catch (err) {
    next(err)
  }
}

export async function deleteEducationHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const profile = await deleteEntry(req.userId!, 'education', paramId(req))

    if (!profile) {
      throw createError('Education entry not found', 404)
    }

    res.json({
      success: true,
      data: { profile: toSafeProfile(profile) },
    })
  } catch (err) {
    next(err)
  }
}

// ─── Projects CRUD ────────────────────────────────────────────────────────────

export async function addProjectHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    assertValidation(req)
    const data = { ...req.body as Record<string, unknown>, source: 'manual' }
    const profile = await addEntry(req.userId!, 'projects', data)

    res.status(201).json({
      success: true,
      data: { profile: toSafeProfile(profile) },
    })
  } catch (err) {
    next(err)
  }
}

export async function updateProjectHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    assertValidation(req)
    const profile = await updateEntry(
      req.userId!,
      'projects',
      paramId(req),
      req.body as Record<string, unknown>
    )

    if (!profile) {
      throw createError('Project entry not found', 404)
    }

    res.json({
      success: true,
      data: { profile: toSafeProfile(profile) },
    })
  } catch (err) {
    next(err)
  }
}

export async function deleteProjectHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const profile = await deleteEntry(req.userId!, 'projects', paramId(req))

    if (!profile) {
      throw createError('Project entry not found', 404)
    }

    res.json({
      success: true,
      data: { profile: toSafeProfile(profile) },
    })
  } catch (err) {
    next(err)
  }
}

// ─── Skills ───────────────────────────────────────────────────────────────────

export async function addSkillsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    assertValidation(req)
    const { skills } = req.body as { skills: { name: string; source?: string }[] }
    const profile = await addSkills(req.userId!, skills)

    res.status(201).json({
      success: true,
      data: { profile: toSafeProfile(profile) },
    })
  } catch (err) {
    next(err)
  }
}

export async function deleteSkillHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const profile = await removeSkill(req.userId!, paramId(req))

    if (!profile) {
      throw createError('Skill not found', 404)
    }

    res.json({
      success: true,
      data: { profile: toSafeProfile(profile) },
    })
  } catch (err) {
    next(err)
  }
}

// ─── Certifications CRUD ─────────────────────────────────────────────────────

export async function addCertificationHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    assertValidation(req)
    const data = { ...req.body as Record<string, unknown>, source: 'manual' }
    const profile = await addEntry(req.userId!, 'certifications', data)

    res.status(201).json({
      success: true,
      data: { profile: toSafeProfile(profile) },
    })
  } catch (err) {
    next(err)
  }
}

export async function updateCertificationHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    assertValidation(req)
    const profile = await updateEntry(
      req.userId!,
      'certifications',
      paramId(req),
      req.body as Record<string, unknown>
    )

    if (!profile) {
      throw createError('Certification not found', 404)
    }

    res.json({
      success: true,
      data: { profile: toSafeProfile(profile) },
    })
  } catch (err) {
    next(err)
  }
}

export async function deleteCertificationHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const profile = await deleteEntry(req.userId!, 'certifications', paramId(req))

    if (!profile) {
      throw createError('Certification not found', 404)
    }

    res.json({
      success: true,
      data: { profile: toSafeProfile(profile) },
    })
  } catch (err) {
    next(err)
  }
}

// ─── Social Links ────────────────────────────────────────────────────────────

export async function updateSocialLinksHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    assertValidation(req)
    const { socialLinks } = req.body as {
      socialLinks: { platform: string; url: string }[]
    }
    const profile = await updateSocialLinks(req.userId!, socialLinks)

    res.json({
      success: true,
      data: { profile: toSafeProfile(profile) },
    })
  } catch (err) {
    next(err)
  }
}

// ─── Resume Upload & Parse ────────────────────────────────────────────────────

export async function uploadResumeHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.file) {
      throw createError('No resume file uploaded', 400)
    }

    // Extract text from the uploaded file
    const text = await extractText(req.file.buffer, req.file.mimetype)

    if (!text || text.trim().length < 10) {
      throw createError(
        'Could not extract meaningful text from the uploaded file. Please check the file format.',
        400
      )
    }

    // Parse the extracted text into structured sections
    const extracted = parseResume(text)

    // Record the data source
    await DataSource.findOneAndUpdate(
      { userId: req.userId!, type: 'resume' },
      {
        userId: req.userId!,
        type: 'resume',
        status: 'pending',
        metadata: {
          filename: req.file.originalname,
          size: req.file.size,
          mimeType: req.file.mimetype,
        },
        lastImportedAt: new Date(),
      },
      { upsert: true, new: true }
    )

    // Return extracted data for user review — NOT auto-saved
    res.json({
      success: true,
      data: { extracted },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/profile/resume/merge
 * User-confirmed merge of resume-extracted data into profile.
 * Does NOT overwrite existing data — merges/appends.
 */
export async function mergeResumeDataHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    assertValidation(req)

    const {
      fullName,
      email,
      phone,
      location,
      website,
      linkedinUrl,
      githubUrl,
      about,
      skills,
      experience,
      education,
    } = req.body as {
      fullName?: string
      email?: string
      phone?: string
      location?: string
      website?: string
      linkedinUrl?: string
      githubUrl?: string
      about?: string
      skills?: string[]
      experience?: {
        title: string
        company: string
        location?: string
        startDate?: string
        endDate?: string
        current?: boolean
        description?: string
      }[]
      education?: {
        institution: string
        degree?: string
        field?: string
        startDate?: string
        endDate?: string
      }[]
    }

    const profile = await getOrCreateProfile(req.userId!)

    // Merge basic info — only update if current value is empty
    if (fullName && !profile.fullName) profile.fullName = fullName
    if (email && !profile.email) profile.email = email
    if (phone && !profile.phone) profile.phone = phone
    if (location && !profile.location) profile.location = location
    if (website && !profile.website) profile.website = website
    if (linkedinUrl && !profile.linkedinUrl) profile.linkedinUrl = linkedinUrl
    if (githubUrl && !profile.githubUrl) profile.githubUrl = githubUrl
    if (about && !profile.about) profile.about = about

    // Append skills (deduplicated)
    if (skills && skills.length > 0) {
      for (const skillName of skills) {
        const normalizedName = skillName.trim().toLowerCase()
        const exists = profile.skills.some(
          (s) => s.name.toLowerCase() === normalizedName
        )
        if (!exists) {
          profile.skills.push({
            name: skillName.trim(),
            source: 'resume',
          } as typeof profile.skills[0])
        }
      }
    }

    // Append experience entries
    if (experience && experience.length > 0) {
      for (const exp of experience) {
        profile.experience.push({
          ...exp,
          current: exp.current ?? false,
          source: 'resume',
        } as typeof profile.experience[0])
      }
    }

    // Append education entries
    if (education && education.length > 0) {
      for (const edu of education) {
        profile.education.push({
          ...edu,
          source: 'resume',
        } as typeof profile.education[0])
      }
    }

    await profile.save()

    // Update data source status
    await DataSource.findOneAndUpdate(
      { userId: req.userId!, type: 'resume' },
      { status: 'imported' }
    )

    const completeness = calculateCompleteness(profile)

    res.json({
      success: true,
      data: {
        profile: toSafeProfile(profile),
        completeness,
      },
    })
  } catch (err) {
    next(err)
  }
}

// ─── GitHub Fetch & Import ────────────────────────────────────────────────────

export async function fetchGitHubHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    assertValidation(req)

    const { username } = req.body as { username: string }
    const result = await fetchGitHubData(username)

    // Record the data source
    await DataSource.findOneAndUpdate(
      { userId: req.userId!, type: 'github' },
      {
        userId: req.userId!,
        type: 'github',
        status: 'connected',
        metadata: {
          username: result.profile.username,
          name: result.profile.name,
          publicRepos: result.profile.publicRepos,
        },
        sourceIdentifier: result.profile.username,
        lastImportedAt: new Date(),
      },
      { upsert: true, new: true }
    )

    res.json({
      success: true,
      data: result,
    })
  } catch (err) {
    if (err instanceof GitHubError) {
      const statusMap: Record<string, number> = {
        NOT_FOUND: 404,
        RATE_LIMITED: 429,
        FORBIDDEN: 403,
        INVALID_USERNAME: 400,
        TIMEOUT: 504,
        API_ERROR: 502,
      }
      throw createError(err.message, statusMap[err.code] || 500)
    }
    next(err)
  }
}

/**
 * POST /api/profile/github/import
 * Import user-selected GitHub repos as projects.
 */
export async function importGitHubProjectsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    assertValidation(req)

    const { repos, updateProfile: profileUpdates } = req.body as {
      repos: {
        id: number
        name: string
        description?: string
        url: string
        homepage?: string
        language?: string
        topics?: string[]
      }[]
      updateProfile?: {
        githubUrl?: string
        location?: string
        about?: string
      }
    }

    const profile = await getOrCreateProfile(req.userId!)

    // Import selected repos as projects
    for (const repo of repos) {
      // Prevent duplicate imports (check by sourceId)
      const alreadyImported = profile.projects.some(
        (p) => p.source === 'github' && p.sourceId === String(repo.id)
      )
      if (alreadyImported) continue

      const project = repoToProject({
        id: repo.id,
        name: repo.name,
        fullName: '',
        description: repo.description || null,
        url: repo.url,
        homepage: repo.homepage || null,
        language: repo.language || null,
        languages: repo.language ? [repo.language] : [],
        stars: 0,
        forks: 0,
        topics: repo.topics || [],
        isArchived: false,
        isFork: false,
        createdAt: '',
        updatedAt: '',
      })

      profile.projects.push(project as typeof profile.projects[0])
    }

    // Optionally update profile fields from GitHub profile
    if (profileUpdates) {
      if (profileUpdates.githubUrl && !profile.githubUrl) {
        profile.githubUrl = profileUpdates.githubUrl
      }
      if (profileUpdates.location && !profile.location) {
        profile.location = profileUpdates.location
      }
      if (profileUpdates.about && !profile.about) {
        profile.about = profileUpdates.about
      }
    }

    await profile.save()

    // Update data source status
    await DataSource.findOneAndUpdate(
      { userId: req.userId!, type: 'github' },
      { status: 'imported' }
    )

    const completeness = calculateCompleteness(profile)

    res.json({
      success: true,
      data: {
        profile: toSafeProfile(profile),
        completeness,
        importedCount: repos.length,
      },
    })
  } catch (err) {
    next(err)
  }
}

// ─── Data Sources ────────────────────────────────────────────────────────────

export async function getDataSourcesHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sources = await DataSource.find({ userId: req.userId! })
      .select('-__v')
      .lean()

    res.json({
      success: true,
      data: { sources },
    })
  } catch (err) {
    next(err)
  }
}
