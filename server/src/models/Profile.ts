/**
 * Profile.ts — Mongoose Profile schema.
 *
 * One-to-one relationship with User. Contains all professional data:
 * experiences, education, projects, skills, certifications, etc.
 *
 * Each sub-document entry carries a `source` field for data provenance
 * (manual | resume | github | linkedin) so we always know where
 * imported data came from.
 *
 * Security:
 * - userId is indexed (unique) for fast lookups and ownership enforcement.
 * - No auth secrets are stored here.
 * - All queries must filter by userId to enforce ownership.
 */
import mongoose, { Document, Schema, Types } from 'mongoose'

// ─── Source enum (data provenance) ──────────────────────────────────────────
export const DATA_SOURCES = ['manual', 'resume', 'github', 'linkedin'] as const
export type DataSourceType = (typeof DATA_SOURCES)[number]

// ─── Sub-document interfaces ────────────────────────────────────────────────

export interface ISkill {
  _id: Types.ObjectId
  name: string
  source: DataSourceType
  sourceId?: string
}

export interface IExperience {
  _id: Types.ObjectId
  title: string
  company: string
  location?: string
  startDate?: string
  endDate?: string
  current: boolean
  description?: string
  source: DataSourceType
  sourceId?: string
}

export interface IEducation {
  _id: Types.ObjectId
  institution: string
  degree?: string
  field?: string
  startDate?: string
  endDate?: string
  description?: string
  source: DataSourceType
  sourceId?: string
}

export interface IProject {
  _id: Types.ObjectId
  name: string
  description?: string
  url?: string
  repoUrl?: string
  technologies: string[]
  source: DataSourceType
  sourceId?: string
}

export interface ICertification {
  _id: Types.ObjectId
  name: string
  issuer?: string
  date?: string
  url?: string
  source: DataSourceType
}

export interface IAchievement {
  _id: Types.ObjectId
  title: string
  description?: string
  date?: string
  source: DataSourceType
}

export interface IPublication {
  _id: Types.ObjectId
  title: string
  publisher?: string
  date?: string
  url?: string
  source: DataSourceType
}

export interface ILanguage {
  _id: Types.ObjectId
  name: string
  proficiency?: string
  source: DataSourceType
}

export interface ISocialLink {
  _id: Types.ObjectId
  platform: string
  url: string
}

// ─── Main Profile interface ─────────────────────────────────────────────────

export interface IProfile extends Document {
  _id: Types.ObjectId
  userId: Types.ObjectId
  fullName: string
  headline?: string
  profilePhoto?: string
  location?: string
  email?: string
  phone?: string
  website?: string
  linkedinUrl?: string
  githubUrl?: string
  about?: string
  skills: ISkill[]
  experience: IExperience[]
  education: IEducation[]
  projects: IProject[]
  certifications: ICertification[]
  achievements: IAchievement[]
  publications: IPublication[]
  languages: ILanguage[]
  socialLinks: ISocialLink[]
  createdAt: Date
  updatedAt: Date
}

// ─── Sub-document schemas ───────────────────────────────────────────────────

const sourceField = {
  type: String,
  enum: DATA_SOURCES,
  default: 'manual' as DataSourceType,
}

const skillSchema = new Schema<ISkill>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    source: sourceField,
    sourceId: { type: String },
  },
  { _id: true }
)

const experienceSchema = new Schema<IExperience>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    company: { type: String, required: true, trim: true, maxlength: 200 },
    location: { type: String, trim: true, maxlength: 200 },
    startDate: { type: String, trim: true, maxlength: 20 },
    endDate: { type: String, trim: true, maxlength: 20 },
    current: { type: Boolean, default: false },
    description: { type: String, trim: true, maxlength: 5000 },
    source: sourceField,
    sourceId: { type: String },
  },
  { _id: true }
)

const educationSchema = new Schema<IEducation>(
  {
    institution: { type: String, required: true, trim: true, maxlength: 200 },
    degree: { type: String, trim: true, maxlength: 200 },
    field: { type: String, trim: true, maxlength: 200 },
    startDate: { type: String, trim: true, maxlength: 20 },
    endDate: { type: String, trim: true, maxlength: 20 },
    description: { type: String, trim: true, maxlength: 5000 },
    source: sourceField,
    sourceId: { type: String },
  },
  { _id: true }
)

const projectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 5000 },
    url: { type: String, trim: true, maxlength: 500 },
    repoUrl: { type: String, trim: true, maxlength: 500 },
    technologies: [{ type: String, trim: true, maxlength: 50 }],
    source: sourceField,
    sourceId: { type: String },
  },
  { _id: true }
)

const certificationSchema = new Schema<ICertification>(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    issuer: { type: String, trim: true, maxlength: 200 },
    date: { type: String, trim: true, maxlength: 20 },
    url: { type: String, trim: true, maxlength: 500 },
    source: sourceField,
  },
  { _id: true }
)

const achievementSchema = new Schema<IAchievement>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 5000 },
    date: { type: String, trim: true, maxlength: 20 },
    source: sourceField,
  },
  { _id: true }
)

const publicationSchema = new Schema<IPublication>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    publisher: { type: String, trim: true, maxlength: 200 },
    date: { type: String, trim: true, maxlength: 20 },
    url: { type: String, trim: true, maxlength: 500 },
    source: sourceField,
  },
  { _id: true }
)

const languageSchema = new Schema<ILanguage>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    proficiency: { type: String, trim: true, maxlength: 50 },
    source: sourceField,
  },
  { _id: true }
)

const socialLinkSchema = new Schema<ISocialLink>(
  {
    platform: { type: String, required: true, trim: true, maxlength: 50 },
    url: { type: String, required: true, trim: true, maxlength: 500 },
  },
  { _id: true }
)

// ─── Main Profile schema ───────────────────────────────────────────────────

const profileSchema = new Schema<IProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 200,
    },
    headline: { type: String, trim: true, maxlength: 300 },
    profilePhoto: { type: String, trim: true, maxlength: 500 },
    location: { type: String, trim: true, maxlength: 200 },
    email: { type: String, trim: true, maxlength: 200 },
    phone: { type: String, trim: true, maxlength: 30 },
    website: { type: String, trim: true, maxlength: 500 },
    linkedinUrl: { type: String, trim: true, maxlength: 500 },
    githubUrl: { type: String, trim: true, maxlength: 500 },
    about: { type: String, trim: true, maxlength: 10000 },
    skills: [skillSchema],
    experience: [experienceSchema],
    education: [educationSchema],
    projects: [projectSchema],
    certifications: [certificationSchema],
    achievements: [achievementSchema],
    publications: [publicationSchema],
    languages: [languageSchema],
    socialLinks: [socialLinkSchema],
  },
  {
    timestamps: true,
  }
)

export const Profile = mongoose.model<IProfile>('Profile', profileSchema)
