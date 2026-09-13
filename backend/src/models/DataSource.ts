/**
 * DataSource.ts — Mongoose DataSource schema.
 *
 * Tracks connected/imported data sources per user.
 * Each record represents a single import or connection
 * (e.g. one resume upload, one GitHub username connection).
 *
 * This allows the dashboard to show which sources have been
 * connected and when they were last imported/synced.
 */
import mongoose, { Document, Schema, Types } from 'mongoose'

export const SOURCE_TYPES = ['resume', 'github', 'linkedin'] as const
export type SourceType = (typeof SOURCE_TYPES)[number]

export const SOURCE_STATUSES = ['connected', 'imported', 'error', 'pending'] as const
export type SourceStatus = (typeof SOURCE_STATUSES)[number]

export interface IDataSource extends Document {
  _id: Types.ObjectId
  userId: Types.ObjectId
  type: SourceType
  status: SourceStatus
  metadata: Record<string, unknown>
  lastImportedAt?: Date
  sourceIdentifier?: string
  createdAt: Date
  updatedAt: Date
}

const dataSourceSchema = new Schema<IDataSource>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: SOURCE_TYPES,
      required: true,
    },
    status: {
      type: String,
      enum: SOURCE_STATUSES,
      default: 'pending' as SourceStatus,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    lastImportedAt: {
      type: Date,
    },
    sourceIdentifier: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
)

// Compound index: one entry per source type per user
dataSourceSchema.index({ userId: 1, type: 1 })

export const DataSource = mongoose.model<IDataSource>('DataSource', dataSourceSchema)
