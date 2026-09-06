import { motion, useReducedMotion } from 'framer-motion'
import { Button } from '../common/Button'
import { PlayIcon } from '../common/Icons'
import { PortfolioPreview } from './PortfolioPreview'

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

export function Hero() {
  const reducedMotion = useReducedMotion()
  return (
    <section id="top" className="section-shell pb-20 pt-9 sm:pb-24 sm:pt-14 lg:pb-28">
      <div className="grid items-center gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:gap-12 xl:gap-16">
        <div className="max-w-[540px]">
          <motion.p initial={reducedMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }} className="mb-6 text-xs font-extrabold uppercase tracking-[0.16em] text-pine">A portfolio, with perspective</motion.p>
          <motion.h1 initial={reducedMotion ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.62, delay: 0.12, ease: [0.22, 1, 0.36, 1] }} className="font-display text-[clamp(3.6rem,7vw,6.4rem)] leading-[0.88] tracking-[-0.065em] text-ink">
            Your identity.<br />Your work.<br /><span className="text-brass">Your portfolio.</span>
          </motion.h1>
          <motion.p initial={reducedMotion ? false : { opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.24 }} className="mt-7 max-w-[460px] text-[1.04rem] leading-7 text-muted sm:text-lg sm:leading-8">
            Turn the experience you already have into a considered portfolio that feels unmistakably yours.
          </motion.p>
          <motion.div initial={reducedMotion ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.34 }} className="mt-8 flex flex-col gap-3 xs:flex-row">
            <Button onClick={() => scrollTo('templates')} showArrow className="px-6 py-3.5">Create my portfolio</Button>
            <Button onClick={() => scrollTo('how-it-works')} variant="secondary" className="px-6 py-3.5"><PlayIcon size={18} /> See how it works</Button>
          </motion.div>
          <motion.div initial={reducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.5 }} className="mt-10 flex items-center gap-4">
            <div className="flex -space-x-2" aria-hidden="true">
              <span className="avatar avatar-one" /><span className="avatar avatar-two" /><span className="avatar avatar-three" />
            </div>
            <p className="max-w-[260px] text-sm leading-5 text-muted">Built for developers, designers, students, creators, and professionals.</p>
          </motion.div>
        </div>
        <PortfolioPreview />
      </div>
    </section>
  )
}
