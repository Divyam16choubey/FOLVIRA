import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function Icon({ size = 20, children, ...props }: IconProps & { children: React.ReactNode }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{children}</svg>
}

export function ArrowUpRightIcon(props: IconProps) { return <Icon {...props}><path d="M7 17 17 7M8 7h9v9" /></Icon> }
export function ArrowRightIcon(props: IconProps) { return <Icon {...props}><path d="M4 12h16M14 6l6 6-6 6" /></Icon> }
export function MenuIcon(props: IconProps) { return <Icon {...props}><path d="M4 7h16M4 12h16M4 17h16" /></Icon> }
export function CloseIcon(props: IconProps) { return <Icon {...props}><path d="m6 6 12 12M18 6 6 18" /></Icon> }
export function PlayIcon(props: IconProps) { return <Icon {...props}><circle cx="12" cy="12" r="9" /><path d="m10 8 6 4-6 4Z" /></Icon> }
export function ArchiveIcon(props: IconProps) { return <Icon {...props}><path d="M4 7h16v13H4zM3 4h18v3H3zM9 11h6" /></Icon> }
export function SparkIcon(props: IconProps) { return <Icon {...props}><path d="m12 3 1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4L12 3ZM19 16l.6 2.4L22 19l-2.4.6L19 22l-.6-2.4L16 19l2.4-.6L19 16Z" /></Icon> }
export function BrushIcon(props: IconProps) { return <Icon {...props}><path d="m14.5 4.5 5 5M4 20c1.8-.1 3.4-.8 4.7-2.1L18.4 8a2.1 2.1 0 0 0-3-3L5.7 14.9C4.5 16.2 4 17.9 4 20Z" /><path d="M13 6l5 5" /></Icon> }
export function WandIcon(props: IconProps) { return <Icon {...props}><path d="m4 20 11-11M14 4l1-2 1 2 2 1-2 1-1 2-1-2-2-1 2-1ZM19 13l.8-1.8L21 13l1.8.8L21 15l-1.2 1.8L19 15l-1.8-1.2L19 13Z" /></Icon> }
export function LaunchIcon(props: IconProps) { return <Icon {...props}><path d="M14 4h6v6M20 4l-9 9M19 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" /></Icon> }
export function ChartIcon(props: IconProps) { return <Icon {...props}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></Icon> }
export function GithubIcon(props: IconProps) { return <Icon {...props}><path d="M15 21v-3.9c0-1 .1-1.4-.5-1.9 2.8-.3 5.5-1.4 5.5-6.2 0-1.4-.5-2.5-1.3-3.4.1-.3.6-1.6-.1-3.3 0 0-1.1-.4-3.5 1.3a12.2 12.2 0 0 0-6.4 0C6.3 1.9 5.2 2.3 5.2 2.3c-.7 1.7-.2 3-.1 3.3A4.8 4.8 0 0 0 3.8 9c0 4.8 2.7 5.9 5.5 6.2-.5.4-.7.9-.7 1.8V21" /><path d="M8 19.5c-2 .6-3.5-.8-3.5-.8" /></Icon> }
export function LinkedinIcon(props: IconProps) { return <Icon {...props}><path d="M6.5 9.5V18M6.5 6.2v.1M10.5 18v-4.7a3.8 3.8 0 0 1 7.5 0V18M10.5 9.5V18" /></Icon> }
export function MailIcon(props: IconProps) { return <Icon {...props}><rect x="3" y="5" width="18" height="14" rx="1" /><path d="m3 7 9 6 9-6" /></Icon> }
