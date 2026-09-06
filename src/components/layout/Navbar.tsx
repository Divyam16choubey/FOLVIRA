import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useState } from 'react'
import { navigation } from '../../data/landing'
import { Button } from '../common/Button'
import { CloseIcon, MenuIcon } from '../common/Icons'

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const reducedMotion = useReducedMotion()
  const closeAndScroll = (target: string) => { setIsOpen(false); scrollTo(target) }

  return (
    <header className="relative z-30">
      <motion.nav initial={reducedMotion ? false : { opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: 'easeOut' }} className="section-shell flex h-[82px] items-center justify-between md:h-[94px]">
        <button onClick={() => scrollTo('top')} className="font-display text-[1.82rem] leading-none tracking-[-0.06em] text-pine focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pine sm:text-[2rem]" aria-label="FOLVIRA home">
          FOLVIRA<span className="text-brass">.</span>
        </button>
        <div className="hidden items-center gap-7 lg:flex">
          {navigation.map((item) => <button key={item.target} onClick={() => scrollTo(item.target)} className="text-sm font-bold text-ink transition-colors hover:text-pine focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pine">{item.label}</button>)}
          <button onClick={() => scrollTo('footer')} className="text-sm font-bold text-ink transition-colors hover:text-pine focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pine">Resources</button>
        </div>
        <div className="hidden items-center gap-6 sm:flex">
          <button onClick={() => scrollTo('final-cta')} className="text-sm font-bold text-ink transition-colors hover:text-pine focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pine">Log in</button>
          <Button onClick={() => scrollTo('templates')} showArrow className="px-5 py-3">Get started</Button>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="inline-flex size-10 items-center justify-center rounded-md border border-line text-ink transition-colors hover:border-pine hover:text-pine focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pine sm:hidden" aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={isOpen}>
          {isOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </motion.nav>
      <AnimatePresence>
        {isOpen && <motion.div initial={reducedMotion ? false : { opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="absolute inset-x-0 top-[70px] overflow-hidden border-y border-line bg-paper shadow-soft sm:hidden">
          <div className="section-shell flex flex-col py-3">
            {navigation.map((item) => <button key={item.target} onClick={() => closeAndScroll(item.target)} className="py-3 text-left text-base font-bold text-ink transition-colors hover:text-pine">{item.label}</button>)}
            <button onClick={() => closeAndScroll('footer')} className="py-3 text-left text-base font-bold text-ink transition-colors hover:text-pine">Resources</button>
            <Button onClick={() => closeAndScroll('templates')} showArrow className="mt-3 w-full">Get started</Button>
          </div>
        </motion.div>}
      </AnimatePresence>
    </header>
  )
}
