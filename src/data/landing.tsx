import { ArchiveIcon, BrushIcon, ChartIcon, LaunchIcon, SparkIcon, WandIcon } from '../components/common/Icons'
import type { Feature, ProcessStep, Template } from '../types/landing'

export const navigation = [
  { label: 'Features', target: 'features' },
  { label: 'Templates', target: 'templates' },
  { label: 'How it works', target: 'how-it-works' },
  { label: 'Pricing', target: 'final-cta' },
]

export const features: Feature[] = [
  {
    number: '01',
    title: 'Import your story',
    description: 'Bring your resume, GitHub, LinkedIn, or manually entered experience into one clear profile.',
    icon: <ArchiveIcon />,
    availability: 'Roadmap',
  },
  {
    number: '02',
    title: 'Shape your portfolio',
    description: 'Choose a visual direction and organize the work, experience, and moments that matter.',
    icon: <SparkIcon />,
    availability: 'Product direction',
  },
  {
    number: '03',
    title: 'Customize the details',
    description: 'Make the layout, type, colour, and sections feel recognizably yours—not like a template.',
    icon: <BrushIcon />,
    availability: 'Roadmap',
  },
  {
    number: '04',
    title: 'Make it job ready',
    description: 'Focus your story around the opportunities you want to be considered for.',
    icon: <WandIcon />,
    availability: 'Roadmap',
  },
  {
    number: '05',
    title: 'Publish your way',
    description: 'Publish with FOLVIRA, connect a domain, or export a project when you are ready.',
    icon: <LaunchIcon />,
    availability: 'Roadmap',
  },
  {
    number: '06',
    title: 'Understand your impact',
    description: 'See how people engage with your work and discover what deserves a closer look.',
    icon: <ChartIcon />,
    availability: 'Roadmap',
  },
]

export const processSteps: ProcessStep[] = [
  {
    number: '01',
    title: 'Bring your information',
    description: 'Start with the experience you already have, wherever it currently lives.',
  },
  {
    number: '02',
    title: 'Build the foundation',
    description: 'Turn the raw details into a thoughtful professional story and structure.',
  },
  {
    number: '03',
    title: 'Make it unmistakably yours',
    description: 'Refine the visual direction, the words, and the way your work is introduced.',
  },
  {
    number: '04',
    title: 'Share your work',
    description: 'Publish a portfolio that is ready to send, share, and keep evolving.',
  },
]

export const templates: Template[] = [
  { name: 'Editorial', kind: 'editorial', description: 'Expressive type for considered work.' },
  { name: 'Minimal', kind: 'minimal', description: 'Quiet confidence with room to breathe.' },
  { name: 'Developer', kind: 'developer', description: 'A technical point of view, clearly framed.' },
  { name: 'Creative', kind: 'creative', description: 'An energetic canvas for visual practice.' },
]
