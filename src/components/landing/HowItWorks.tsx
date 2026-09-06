import { processSteps } from '../../data/landing'
import { Reveal } from '../common/Reveal'

export function HowItWorks() {
  return (
    <section id="how-it-works" className="section-shell py-20 sm:py-28">
      <div className="grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20">
        <Reveal>
          <p className="eyebrow">A simpler way to begin</p>
          <h2 className="section-heading mt-4 max-w-[450px]">Start with what you have. <span className="text-brass">Make it matter.</span></h2>
          <p className="mt-5 max-w-[400px] text-base leading-7 text-muted">The future FOLVIRA experience is designed to help you move from information to identity, without losing your point of view.</p>
        </Reveal>
        <div className="divide-y divide-line border-y border-line">
          {processSteps.map((step, index) => <Reveal key={step.number} delay={index * 0.05} className="grid gap-4 py-7 sm:grid-cols-[70px_1fr_auto] sm:items-start sm:gap-5">
            <span className="font-display text-3xl tracking-[-0.06em] text-brass">{step.number}</span>
            <div><h3 className="text-lg font-extrabold tracking-[-0.035em]">{step.title}</h3><p className="mt-2 max-w-[400px] text-sm leading-6 text-muted">{step.description}</p></div>
            <span className="hidden size-8 items-center justify-center rounded-full border border-line text-xs font-bold text-pine sm:flex">0{index + 1}</span>
          </Reveal>)}
        </div>
      </div>
    </section>
  )
}
