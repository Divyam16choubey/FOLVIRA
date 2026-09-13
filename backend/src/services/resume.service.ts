/**
 * resume.service.ts — Resume text extraction and section parsing.
 *
 * Supports PDF and DOCX formats.
 * Extracts text, then uses heuristic section detection to parse
 * experience, education, skills, and projects.
 *
 * Security:
 * - Files are processed in-memory via multer (no disk persistence).
 * - Extracted text is sanitized before returning.
 * - Resume contents are never logged.
 * - Temporary buffers are discarded after processing.
 */
import mammoth from 'mammoth'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ExtractedExperience {
  title: string
  company: string
  location?: string
  startDate?: string
  endDate?: string
  current: boolean
  description?: string
}

export interface ExtractedEducation {
  institution: string
  degree?: string
  field?: string
  startDate?: string
  endDate?: string
}

export interface ExtractedProfile {
  fullName?: string
  email?: string
  phone?: string
  location?: string
  website?: string
  linkedinUrl?: string
  githubUrl?: string
  about?: string
  skills: string[]
  experience: ExtractedExperience[]
  education: ExtractedEducation[]
}

// ─── Text extraction ────────────────────────────────────────────────────────

/**
 * Extract text from a PDF buffer.
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  // pdf-parse v2 class-based API — types are slightly off from runtime,
  // so we use type assertion for the instance methods.
  const { PDFParse } = await import('pdf-parse')
  const parser = new PDFParse({ data: buffer }) as unknown as {
    load(): Promise<void>
    getText(): Promise<string>
  }
  await parser.load()
  const text = await parser.getText()
  return sanitizeText(typeof text === 'string' ? text : String(text))
}

/**
 * Extract text from a DOCX buffer.
 */
export async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer })
  return sanitizeText(result.value)
}

/**
 * Extract text from a resume buffer, auto-detecting format by MIME type.
 */
export async function extractText(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  if (
    mimeType === 'application/pdf'
  ) {
    return extractTextFromPDF(buffer)
  }

  if (
    mimeType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    return extractTextFromDOCX(buffer)
  }

  throw new Error('Unsupported file type')
}

// ─── Section parsing ────────────────────────────────────────────────────────

/**
 * Parse extracted text into structured profile sections.
 * Uses heuristic pattern matching for common resume formats.
 * Phase 4 AI will improve this — for now, reasonable extraction.
 */
export function parseResume(rawText: string): ExtractedProfile {
  const text = rawText.trim()
  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean)

  const result: ExtractedProfile = {
    skills: [],
    experience: [],
    education: [],
  }

  // ── Extract contact info from the first few lines ──
  const headerLines = lines.slice(0, 15)
  const headerText = headerLines.join(' ')

  // Name: usually the first non-empty line
  if (lines.length > 0 && lines[0].length < 100 && !lines[0].includes('@')) {
    result.fullName = lines[0]
  }

  // Email
  const emailMatch = headerText.match(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
  )
  if (emailMatch) {
    result.email = emailMatch[0]
  }

  // Phone
  const phoneMatch = headerText.match(
    /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/
  )
  if (phoneMatch) {
    result.phone = phoneMatch[0].trim()
  }

  // LinkedIn URL
  const linkedinMatch = text.match(
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?/i
  )
  if (linkedinMatch) {
    result.linkedinUrl = linkedinMatch[0]
  }

  // GitHub URL
  const githubMatch = text.match(
    /(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+\/?/i
  )
  if (githubMatch) {
    result.githubUrl = githubMatch[0]
  }

  // Website (generic URL, excluding linkedin/github)
  const urlMatch = headerText.match(
    /https?:\/\/(?!.*(?:linkedin|github))[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s,]*/i
  )
  if (urlMatch) {
    result.website = urlMatch[0]
  }

  // ── Detect sections ──
  const sectionPatterns: Record<string, RegExp> = {
    experience:
      /^(?:(?:work\s+)?experience|employment|work\s+history|professional\s+experience)/i,
    education:
      /^(?:education|academic|qualifications|degrees)/i,
    skills:
      /^(?:skills|technical\s+skills|core\s+competencies|technologies|expertise|proficiencies)/i,
    about:
      /^(?:summary|about|profile|objective|professional\s+summary|career\s+objective)/i,
  }

  // Find section boundaries
  const sections: { type: string; startIdx: number }[] = []
  for (let i = 0; i < lines.length; i++) {
    for (const [type, pattern] of Object.entries(sectionPatterns)) {
      if (pattern.test(lines[i]) && lines[i].length < 60) {
        sections.push({ type, startIdx: i })
      }
    }
  }

  // Sort by position
  sections.sort((a, b) => a.startIdx - b.startIdx)

  // Extract each section's content
  for (let s = 0; s < sections.length; s++) {
    const startIdx = sections[s].startIdx + 1
    const endIdx = s + 1 < sections.length ? sections[s + 1].startIdx : lines.length
    const sectionLines = lines.slice(startIdx, endIdx)
    const sectionText = sectionLines.join('\n')

    switch (sections[s].type) {
      case 'about':
        result.about = sectionText.trim().substring(0, 5000)
        break

      case 'skills':
        result.skills = parseSkills(sectionText)
        break

      case 'experience':
        result.experience = parseExperience(sectionLines)
        break

      case 'education':
        result.education = parseEducation(sectionLines)
        break
    }
  }

  return result
}

// ─── Section-specific parsers ───────────────────────────────────────────────

/**
 * Parse skills from a text block.
 * Skills are often comma, pipe, or bullet separated.
 */
function parseSkills(text: string): string[] {
  // Try splitting by common delimiters
  let skills = text
    .replace(/[•·▪■□►→–—|]/g, ',')
    .split(/[,\n;]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.length < 60)

  // Deduplicate (case-insensitive)
  const seen = new Set<string>()
  skills = skills.filter((s) => {
    const lower = s.toLowerCase()
    if (seen.has(lower)) return false
    seen.add(lower)
    return true
  })

  return skills.slice(0, 50) // Cap at 50 skills
}

/**
 * Parse experience entries from lines.
 * Heuristic: lines with dates or common title patterns start new entries.
 */
function parseExperience(lines: string[]): ExtractedExperience[] {
  const entries: ExtractedExperience[] = []
  const datePattern =
    /(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4}|(?:19|20)\d{2})\s*[-–—to]+\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4}|(?:19|20)\d{2}|present|current)/i

  let currentEntry: Partial<ExtractedExperience> | null = null
  const descriptionLines: string[] = []

  const flushEntry = () => {
    if (currentEntry?.title || currentEntry?.company) {
      entries.push({
        title: currentEntry.title || 'Untitled',
        company: currentEntry.company || 'Unknown',
        location: currentEntry.location,
        startDate: currentEntry.startDate,
        endDate: currentEntry.endDate,
        current: currentEntry.current ?? false,
        description: descriptionLines.join('\n').trim() || undefined,
      })
      descriptionLines.length = 0
    }
  }

  for (const line of lines) {
    const dateMatch = line.match(datePattern)

    if (dateMatch) {
      flushEntry()

      // Extract dates
      const dateParts = dateMatch[0].split(/[-–—]|to/i).map((d) => d.trim())
      const isCurrent = /present|current/i.test(dateMatch[0])

      // Title/company is typically the part before the date
      const beforeDate = line.substring(0, line.indexOf(dateMatch[0])).trim()
      const parts = beforeDate.split(/[,|–—]/).map((p) => p.trim()).filter(Boolean)

      currentEntry = {
        title: parts[0] || '',
        company: parts[1] || parts[0] || '',
        location: parts[2],
        startDate: dateParts[0],
        endDate: isCurrent ? undefined : dateParts[1],
        current: isCurrent,
      }
    } else if (currentEntry) {
      descriptionLines.push(line)
    }
  }

  flushEntry()
  return entries.slice(0, 20) // Cap at 20 entries
}

/**
 * Parse education entries from lines.
 */
function parseEducation(lines: string[]): ExtractedEducation[] {
  const entries: ExtractedEducation[] = []
  const degreePatterns =
    /\b(?:B\.?S\.?|B\.?A\.?|M\.?S\.?|M\.?A\.?|Ph\.?D\.?|MBA|Bachelor|Master|Doctor|Associate|Diploma|Certificate)\b/i
  const yearPattern = /(?:19|20)\d{2}/g

  let currentEntry: Partial<ExtractedEducation> | null = null

  const flushEntry = () => {
    if (currentEntry?.institution) {
      entries.push({
        institution: currentEntry.institution,
        degree: currentEntry.degree,
        field: currentEntry.field,
        startDate: currentEntry.startDate,
        endDate: currentEntry.endDate,
      })
    }
  }

  for (const line of lines) {
    if (line.length < 3) continue

    const hasDegree = degreePatterns.test(line)
    const years = line.match(yearPattern)

    if (hasDegree || (years && years.length > 0 && line.length < 150)) {
      flushEntry()

      const degreeMatch = line.match(degreePatterns)
      const parts = line.split(/[,|–—in]/).map((p) => p.trim()).filter(Boolean)

      currentEntry = {
        institution: parts.find((p) => !degreePatterns.test(p) && p.length > 3) || parts[0] || line,
        degree: degreeMatch ? degreeMatch[0] : undefined,
        field: undefined,
      }

      if (years && years.length >= 2) {
        currentEntry.startDate = years[0]
        currentEntry.endDate = years[1]
      } else if (years && years.length === 1) {
        currentEntry.endDate = years[0]
      }
    } else if (currentEntry && !currentEntry.field && line.length < 100) {
      currentEntry.field = line
    }
  }

  flushEntry()
  return entries.slice(0, 10) // Cap at 10 entries
}

// ─── Sanitization ───────────────────────────────────────────────────────────

/**
 * Sanitize extracted text to remove dangerous characters,
 * normalize whitespace, and strip control characters.
 */
function sanitizeText(text: string): string {
  return text
    // Strip null bytes and other control characters (keep newlines, tabs)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Collapse excessive whitespace within lines
    .replace(/[ \t]+/g, ' ')
    // Collapse excessive blank lines (more than 2 → 2)
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
