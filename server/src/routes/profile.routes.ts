/**
 * profile.routes.ts — /api/profile/* router.
 *
 * All routes require authentication.
 * Input validation via express-validator on mutation endpoints.
 * Resume upload via multer middleware.
 */
import { Router } from 'express'
import { body, param } from 'express-validator'
import { authenticate } from '../middleware/authenticate'
import { resumeUpload } from '../middleware/upload'
import {
  getProfile,
  updateProfileHandler,
  addExperienceHandler,
  updateExperienceHandler,
  deleteExperienceHandler,
  addEducationHandler,
  updateEducationHandler,
  deleteEducationHandler,
  addProjectHandler,
  updateProjectHandler,
  deleteProjectHandler,
  addSkillsHandler,
  deleteSkillHandler,
  addCertificationHandler,
  updateCertificationHandler,
  deleteCertificationHandler,
  updateSocialLinksHandler,
  uploadResumeHandler,
  mergeResumeDataHandler,
  fetchGitHubHandler,
  importGitHubProjectsHandler,
  getDataSourcesHandler,
} from '../controllers/profile.controller'

const router = Router()

// All profile routes require authentication
router.use(authenticate)

// ─── Validation rule sets ──────────────────────────────────────────────────

const idParam = [
  param('id')
    .isMongoId()
    .withMessage('Invalid entry ID'),
]

const profileUpdateValidation = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Name must be between 1 and 200 characters'),
  body('headline')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('Headline must be at most 300 characters'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Location must be at most 200 characters'),
  body('email')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Email must be at most 200 characters'),
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage('Phone must be at most 30 characters'),
  body('website')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Website URL must be at most 500 characters'),
  body('linkedinUrl')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('LinkedIn URL must be at most 500 characters'),
  body('githubUrl')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('GitHub URL must be at most 500 characters'),
  body('about')
    .optional()
    .trim()
    .isLength({ max: 10000 })
    .withMessage('About/bio must be at most 10000 characters'),
]

const experienceValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Job title is required (max 200 characters)'),
  body('company')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Company name is required (max 200 characters)'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 200 }),
  body('startDate')
    .optional()
    .trim()
    .isLength({ max: 20 }),
  body('endDate')
    .optional()
    .trim()
    .isLength({ max: 20 }),
  body('current')
    .optional()
    .isBoolean()
    .withMessage('Current must be a boolean'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 }),
]

const educationValidation = [
  body('institution')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Institution name is required (max 200 characters)'),
  body('degree')
    .optional()
    .trim()
    .isLength({ max: 200 }),
  body('field')
    .optional()
    .trim()
    .isLength({ max: 200 }),
  body('startDate')
    .optional()
    .trim()
    .isLength({ max: 20 }),
  body('endDate')
    .optional()
    .trim()
    .isLength({ max: 20 }),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 }),
]

const projectValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Project name is required (max 200 characters)'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 }),
  body('url')
    .optional()
    .trim()
    .isLength({ max: 500 }),
  body('repoUrl')
    .optional()
    .trim()
    .isLength({ max: 500 }),
  body('technologies')
    .optional()
    .isArray({ max: 30 })
    .withMessage('Technologies must be an array (max 30 items)'),
  body('technologies.*')
    .optional()
    .trim()
    .isLength({ max: 50 }),
]

const skillsValidation = [
  body('skills')
    .isArray({ min: 1, max: 50 })
    .withMessage('Skills must be a non-empty array (max 50)'),
  body('skills.*.name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Skill name is required (max 100 characters)'),
]

const certificationValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Certification name is required (max 200 characters)'),
  body('issuer')
    .optional()
    .trim()
    .isLength({ max: 200 }),
  body('date')
    .optional()
    .trim()
    .isLength({ max: 20 }),
  body('url')
    .optional()
    .trim()
    .isLength({ max: 500 }),
]

const socialLinksValidation = [
  body('socialLinks')
    .isArray({ max: 20 })
    .withMessage('Social links must be an array (max 20)'),
  body('socialLinks.*.platform')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Platform name is required (max 50 characters)'),
  body('socialLinks.*.url')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('URL is required (max 500 characters)'),
]

const githubFetchValidation = [
  body('username')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('GitHub username or URL is required'),
]

const githubImportValidation = [
  body('repos')
    .isArray({ min: 1, max: 100 })
    .withMessage('At least one repository must be selected'),
  body('repos.*.id')
    .isInt()
    .withMessage('Repository ID must be an integer'),
  body('repos.*.name')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Repository name is required'),
  body('repos.*.url')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Repository URL is required'),
]

// ─── Routes ───────────────────────────────────────────────────────────────────

// Profile
router.get('/', getProfile)
router.put('/', profileUpdateValidation, updateProfileHandler)

// Experience
router.post('/experience', experienceValidation, addExperienceHandler)
router.put('/experience/:id', [...idParam, ...experienceValidation], updateExperienceHandler)
router.delete('/experience/:id', idParam, deleteExperienceHandler)

// Education
router.post('/education', educationValidation, addEducationHandler)
router.put('/education/:id', [...idParam, ...educationValidation], updateEducationHandler)
router.delete('/education/:id', idParam, deleteEducationHandler)

// Projects
router.post('/projects', projectValidation, addProjectHandler)
router.put('/projects/:id', [...idParam, ...projectValidation], updateProjectHandler)
router.delete('/projects/:id', idParam, deleteProjectHandler)

// Skills
router.post('/skills', skillsValidation, addSkillsHandler)
router.delete('/skills/:id', idParam, deleteSkillHandler)

// Certifications
router.post('/certifications', certificationValidation, addCertificationHandler)
router.put('/certifications/:id', [...idParam, ...certificationValidation], updateCertificationHandler)
router.delete('/certifications/:id', idParam, deleteCertificationHandler)

// Social Links
router.put('/social-links', socialLinksValidation, updateSocialLinksHandler)

// Resume import
router.post('/resume/upload', resumeUpload, uploadResumeHandler)
router.post('/resume/merge', mergeResumeDataHandler)

// GitHub import
router.post('/github/fetch', githubFetchValidation, fetchGitHubHandler)
router.post('/github/import', githubImportValidation, importGitHubProjectsHandler)

// Data sources
router.get('/datasources', getDataSourcesHandler)

export default router
