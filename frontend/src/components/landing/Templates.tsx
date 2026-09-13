import { templates } from '../../data/landing'
import { Reveal } from '../common/Reveal'

export function Templates() {
  return (
    <section id="templates" className="section-space border-y border-line bg-[var(--color-surface-warm)]">
      <div className="section-shell">
        <Reveal className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Four points of view</p>
            <h2 className="section-heading mt-4">A place for every kind of <span className="text-brass">practice.</span></h2>
          </div>
          <p className="max-w-[330px] text-sm leading-6 text-muted">Static studies for now. A flexible template system is part of the product foundation ahead.</p>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {templates.map((template, index) => (
            <Reveal key={template.name} delay={index * 0.07}>
              <article className="group">
                <TemplateFrame kind={template.kind} />
                <div className="mt-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-extrabold tracking-[-0.025em]">{template.name}</h3>
                    <p className="mt-1 text-sm leading-5 text-muted">{template.description}</p>
                  </div>
                  {/* Decorative directional accent — no semantic meaning */}
                  <span className="pt-0.5 text-brass transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true">&#8599;</span>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function TemplateFrame({ kind }: { kind: 'editorial' | 'minimal' | 'developer' | 'creative' }) {
  return (
    <div className={`template-frame template-${kind}`} aria-hidden="true">
      <div className="template-top"><span>FOLVIRA</span><i /><i /><i /></div>
      {kind === 'editorial' && (
        <>
          <div className="template-editorial-copy">
            <span>HELLO, I&apos;M</span>
            <strong>Clara<br />Meyer</strong>
            <em>Visual storyteller</em>
          </div>
          <div className="template-orb" />
        </>
      )}
      {kind === 'minimal' && (
        <>
          <div className="template-minimal-copy">
            <strong>Ravi<br />Shah</strong>
            <span>Designer and strategist.<br />Working across brands.</span>
          </div>
          <div className="template-minimal-line" />
        </>
      )}
      {kind === 'developer' && (
        <>
          <div className="template-dev-code">
            const work = <b>&apos;useful&apos;</b>;<br /><span>// Farah A.</span>
          </div>
          <div className="template-dev-window"><i /><i /><i /></div>
        </>
      )}
      {kind === 'creative' && (
        <>
          <div className="template-creative-block template-creative-one" />
          <div className="template-creative-block template-creative-two" />
          <div className="template-creative-copy">MAKE<br />THINGS<br /><b>MOVE.</b></div>
        </>
      )}
    </div>
  )
}
