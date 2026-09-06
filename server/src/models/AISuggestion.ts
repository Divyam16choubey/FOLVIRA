/**
 * AISuggestion.ts — Mongoose schema for AI-generated profile improvement suggestions.
 *
 * AI output is NEVER automatically applied to the user's profile.
 * Every suggestion lives here in a pending state until the user explicitly
 * accepts or rejects it via the approval workflow.
 *
 * Data provenance:
 * - When a suggestion is accepted, the profile update records source: 'ai'.
 * - The original field value is preserved here until acceptance.
 * - Accepted/rejected state is immutable after decision.
 *
 * Security:
 * - All queries must filter by userId (ownership enforcement).
 * - No auth secrets, tokens, or passwords are stored here.
 * - sectionId is stored as a string (not ObjectId) so it can reference
 *   sub-document _id values from the Profile without a hard FK constraint.
 */
import mongoose, { Document, Schema, Types } from 'mongoose'

export const SUGGESTION_TYPES = [
  'about',
  'headline',
  'experience_description',
  'project_description',
  'achievement_description',
  'skill_normalization',
  'skill_merge',
  'skill_missing',
  'summary',
  'general',
] as const
export type SuggestionType = (typeof SUGGESTION_TYPES)[number]

export const SUGGESTION_CATEGORIES = [
  'clarity',
  'grammar',
  'conciseness',
  'impact',
  'specificity',
  'consistency',
  'missing_context',
  'recruiter_readability',
  'skill_intelligence',
  'completeness',
] as const
export type SuggestionCategory = (typeof SUGGESTION_CATEGORIES)[number]

export const SUGGESTION_STATUSES = ['pending', 'accepted', 'rejected'] as const
export type SuggestionStatus = (typeof SUGGESTION_STATUSES)[number]

export interface IAISuggestion extends Document {
  _id: Types.ObjectId
  userId: Types.ObjectId
  profileId: Types.ObjectId

  // What section/field this suggestion applies to
  type: SuggestionType
  sectionId?: string       // sub-document _id, if applicable
  field: string            // field name (e.g. 'description', 'about')

  // Content
  category: SuggestionCategory
  original: string         // exact text before AI suggestion
  suggested: string        // AI-proposed replacement
  reason: string           // human-readable explanation

  // Provenance & workflow
  status: SuggestionStatus
  aiModel: string          // which model produced this (e.g. 'gpt-4o-mini')
  providerName: string     // which provider (e.g. 'openai', 'mock')

  // Timestamps
  createdAt: Date
  updatedAt: Date
  decidedAt?: Date         // when user accepted or rejected
}

const aiSuggestionSchema = new Schema<IAISuggestion>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    profileId: {
      type: Schema.Types.ObjectId,
      ref: 'Profile',
      required: true,
    },
    type: {
      type: String,
      enum: SUGGESTION_TYPES,
      required: true,
    },
    sectionId: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    field: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    category: {
      type: String,
      enum: SUGGESTION_CATEGORIES,
      required: true,
    },
    original: {
      type: String,
      default: '',
      maxlength: 10000,
    },
    suggested: {
      type: String,
      required: true,
      maxlength: 10000,
    },
    reason: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: SUGGESTION_STATUSES,
      default: 'pending' as SuggestionStatus,
      index: true,
    },
    aiModel: {
      type: String,
      required: true,
      maxlength: 100,
    },
    providerName: {
      type: String,
      required: true,
      maxlength: 50,
    },
    decidedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
)

// Compound indexes for efficient per-user queries
aiSuggestionSchema.index({ userId: 1, status: 1 })
aiSuggestionSchema.index({ userId: 1, createdAt: -1 })
aiSuggestionSchema.index({ userId: 1, type: 1, status: 1 })

export const AISuggestion = mongoose.model<IAISuggestion>('AISuggestion', aiSuggestionSchema)
