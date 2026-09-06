import { Button } from '../common/Button'
import { scrollToSection } from '../../lib/scroll'
import { Reveal } from '../common/Reveal'

export function FinalCta() {
  return (
    <section id="final-cta" className="section-shell section-space">
      <Reveal className="relative overflow-hidden rounded-card bg-pine px-6 py-14 text-center text-white shadow-lift sm:px-12 sm:py-20">
        <div className="cta-arch cta-arch-one" aria-hidden="true" /><div className="cta-arch cta-arch-two" aria-hidden="true" />
        <div className="relative mx-auto max-w-[690px]"><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#d7b680]">A good place to be seen</p><h2 className="mt-5 font-display text-[clamp(3rem,6vw,5.2rem)] leading-[0.9] tracking-[-0.06em]">Your work deserves more than a resume.</h2><p className="mx-auto mt-6 max-w-[500px] text-base leading-7 text-white/72">Create a portfolio that introduces your professional story with clarity, confidence, and care.</p><Button onClick={() => scrollToSection('templates')} className="mt-8 bg-[var(--color-surface-cta)] text-pine hover:bg-white" showArrow>Create my portfolio</Button><p className="mt-5 text-xs text-white/55">An early look at the FOLVIRA foundation.</p></div>
      </Reveal>
    </section>
  )
}
