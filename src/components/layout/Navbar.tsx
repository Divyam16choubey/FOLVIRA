import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { navigation } from '../../data/landing'
import { scrollToSection } from '../../lib/scroll'
import { Button } from '../common/Button'
import { CloseIcon, MenuIcon } from '../common/Icons'

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const reducedMotion = useReducedMotion()
  const closeAndScroll = (target: string) => { setIsOpen(false); scrollToSection(target) }

  useEffect(() => {
    if (!isOpen) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [isOpen])

  return (
    <header className="relative z-30">
      <motion.nav initial={reducedMotion ? false : { opacity: 0, y: -14 }} animate={reducedMotion ? undefined : { opacity: 1, y: 0 }} transition={reducedMotion ? { duration: 0 } : { duration: 0.55, ease: 'easeOut' }} className="section-shell flex h-[82px] items-center justify-between md:h-[94px]">
        <button onClick={() => scrollToSection('top')} className="font-display text-[1.82rem] leading-none tracking-[-0.06em] text-pine focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pine sm:text-[2rem]" aria-label="FOLVIRA home">
          FOLVIRA<span className="text-brass">.</span>
        </button>
        <div className="hidden items-center gap-7 lg:flex">
          {navigation.map((item) => item.target ? <button key={item.label} onClick={() => scrollToSection(item.target!)} className="text-sm font-bold text-ink transition-colors hover:text-pine focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pine">{item.label}</button> : <PlannedNavItem key={item.label}>{item.label}</PlannedNavItem>)}
        </div>
        <div className="hidden items-center gap-6 sm:flex">
          <PlannedNavItem>Log in</PlannedNavItem>
          <Button onClick={() => scrollToSection('templates')} showArrow className="px-5 py-3">Get started</Button>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="inline-flex size-10 items-center justify-center rounded-[var(--radius-control)] border border-line text-ink transition-colors hover:border-pine hover:text-pine focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pine lg:hidden" aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-controls="mobile-navigation" aria-expanded={isOpen}>
          {isOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </motion.nav>
      <AnimatePresence>
        {isOpen && <motion.div id="mobile-navigation" initial={reducedMotion ? false : { opacity: 0, height: 0 }} animate={reducedMotion ? undefined : { opacity: 1, height: 'auto' }} exit={reducedMotion ? undefined : { opacity: 0, height: 0 }} className="absolute inset-x-0 top-full overflow-hidden border-y border-line bg-paper shadow-soft lg:hidden">
          <div className="section-shell flex flex-col py-3">
            {navigation.map((item) => item.target ? <button key={item.label} onClick={() => closeAndScroll(item.target!)} className="py-3 text-left text-base font-bold text-ink transition-colors hover:text-pine focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pine">{item.label}</button> : <span key={item.label} className="py-3 text-left text-base font-bold text-muted/65" title="Planned for a future release">{item.label}<span className="sr-only"> (planned)</span></span>)}
            <span className="py-3 text-left text-base font-bold text-muted/65" title="Account access is not part of this Phase 1 preview">Log in<span className="sr-only"> (planned)</span></span>
            <Button onClick={() => closeAndScroll('templates')} showArrow className="mt-3 w-full">Get started</Button>
          </div>
        </motion.div>}
      </AnimatePresence>
    </header>
  )
}

function PlannedNavItem({ children }: { children: string }) {
  return <span className="cursor-default text-sm font-bold text-muted/65" title="Planned for a future release">{children}<span className="sr-only"> (planned)</span></span>
}
