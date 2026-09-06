/**
 * upload.ts — Multer upload middleware for resume file handling.
 *
 * Security:
 * - Memory storage (no disk persistence — prevents path traversal).
 * - 5 MB file size limit.
 * - Extension AND MIME type validation.
 * - Single file upload only (field: 'resume').
 * - Never executes uploaded content.
 */
import multer from 'multer'
import path from 'path'
import { Request } from 'express'
import { createError } from './errorHandler'

const ALLOWED_MIMES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx'])

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

const storage = multer.memoryStorage()

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  const ext = path.extname(file.originalname).toLowerCase()

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    cb(createError('Only PDF and DOCX files are allowed', 400))
    return
  }

  if (!ALLOWED_MIMES.has(file.mimetype)) {
    cb(createError('Invalid file type. Only PDF and DOCX files are allowed', 400))
    return
  }

  cb(null, true)
}

export const resumeUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
}).single('resume')
