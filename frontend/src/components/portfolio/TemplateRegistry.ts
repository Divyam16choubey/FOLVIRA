/**
 * TemplateRegistry.ts — Central registry of all supported portfolio templates.
 *
 * Architecture:
 *   PortfolioRenderer
 *       ↓
 *   TemplateRegistry  (this file)
 *       ↓
 *   Selected Template Component
 *       ↓
 *   Reusable Section Components
 *
 * To add a new template:
 *   1. Create the template component in ./templates/
 *   2. Add it to TEMPLATE_REGISTRY below
 *   3. Add its label to TEMPLATE_LABELS in src/types/portfolio.ts
 *
 * AI is NOT the renderer. Templates are controlled React components.
 * No arbitrary JSX, HTML, or CSS is generated.
 */
import type { ComponentType } from 'react'
import type { PortfolioTemplate, Portfolio, RendererProfile } from '../../types/portfolio'
import { EditorialTemplate } from './templates/EditorialTemplate'
import { MinimalTemplate } from './templates/MinimalTemplate'
import { DeveloperTemplate } from './templates/DeveloperTemplate'

export interface TemplateProps {
  portfolio: Portfolio
  profile: RendererProfile
}

export type TemplateComponent = ComponentType<TemplateProps>

/**
 * Registry: maps template name → React component.
 * All templates implement the same TemplateProps interface.
 */
export const TEMPLATE_REGISTRY: Record<PortfolioTemplate, TemplateComponent> = {
  editorial: EditorialTemplate,
  minimal:   MinimalTemplate,
  developer: DeveloperTemplate,
}

/**
 * Resolve a template component from its name.
 * Falls back to Editorial if an unknown template name is encountered.
 */
export function resolveTemplate(name: PortfolioTemplate): TemplateComponent {
  return TEMPLATE_REGISTRY[name] ?? EditorialTemplate
}
