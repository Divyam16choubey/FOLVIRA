import type { ReactNode } from 'react'

export type Feature = {
  number: string
  title: string
  description: string
  icon: ReactNode
  availability: 'Product direction' | 'Roadmap'
}

export type ProcessStep = {
  number: string
  title: string
  description: string
}

export type Template = {
  name: string
  kind: 'editorial' | 'minimal' | 'developer' | 'creative'
  description: string
}
