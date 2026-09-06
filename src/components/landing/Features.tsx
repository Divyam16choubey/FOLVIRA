import { features } from '../../data/landing'
import { Reveal } from '../common/Reveal'

export function Features() {
  return (
    <section id="features" className="border-y border-line bg-paper py-20 sm:py-24">
      <div className="section-shell">
        <Reveal className="mx-auto max-w-[760px] text-center">
          <p className="eyebrow">One home for your professional story</p>
          <h2 className="section-heading mt-4">Everything you need to make a <span className="text-brass">strong first impression.</span></h2>
          <p className="mx-auto mt-5 max-w-[610px] text-base leading-7 text-muted">A deliberate path from scattered experience to a portfolio you will be proud to share.</p>
        </Reveal>
        <div className="mt-14 grid border-t border-line sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => <Reveal key={feature.number} delay={index * 0.04} className="group border-b border-line py-9 sm:px-7 sm:[&:nth-child(odd)]:border-r lg:px-8 lg:[&:nth-child(3n+1)]:pl-0 lg:[&:nth-child(3n)]:pr-0 lg:[&:nth-child(3n)]:border-r-0">
            <div className="flex items-start justify-between"><span className="flex size-10 items-center justify-center rounded-md bg-[#f1eee6] text-pine transition-transform duration-300 group-hover:-translate-y-1">{feature.icon}</span><span className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-muted/75">{feature.availability}</span></div>
            <p className="mt-7 text-xs font-extrabold tracking-[0.12em] text-brass">{feature.number}</p>
            <h3 className="mt-2 text-lg font-extrabold tracking-[-0.03em] text-ink">{feature.title}</h3>
            <p className="mt-3 max-w-[325px] text-sm leading-6 text-muted">{feature.description}</p>
          </Reveal>)}
        </div>
        <p className="mt-6 text-center text-xs leading-5 text-muted">These are FOLVIRA’s product directions. Items marked “Roadmap” are not functionality available in this Phase 1 preview.</p>
      </div>
    </section>
  )
}
