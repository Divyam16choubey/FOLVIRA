import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { ArrowRightIcon } from './Icons'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'quiet'
  showArrow?: boolean
}

export function Button({ children, variant = 'primary', showArrow = false, className = '', type = 'button', ...props }: ButtonProps) {
  const styles = {
    primary: 'bg-pine text-white hover:bg-[var(--color-pine-deep)] focus-visible:outline-pine',
    secondary: 'border border-ink/20 bg-paper text-ink hover:border-pine/55 hover:bg-white focus-visible:outline-pine',
    quiet: 'text-ink hover:text-pine focus-visible:outline-pine',
  }

  return (
    <button type={type} className={`inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] px-5 py-3 text-sm font-bold tracking-[-0.01em] transition duration-200 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 ${styles[variant]} ${className}`} {...props}>
      {children}
      {showArrow && <ArrowRightIcon size={17} />}
    </button>
  )
}
