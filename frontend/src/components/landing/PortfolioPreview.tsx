import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRightIcon, GithubIcon, LinkedinIcon, MailIcon } from '../common/Icons'

const dots = Array.from({ length: 16 })

export function PortfolioPreview() {
  const reducedMotion = useReducedMotion()
  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, scale: 0.97, y: 20 }}
      animate={reducedMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
      transition={reducedMotion ? { duration: 0 } : { duration: 0.72, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-full max-w-[770px] lg:mx-0"
    >
      {/* Decorative glow ring */}
      <div className="absolute -inset-5 -z-10 rounded-[2rem] bg-brass/10 blur-3xl" aria-hidden="true" />

      {/*
        The entire preview card is illustrative UI — not real content.
        aria-hidden="true" prevents screen readers from traversing mock
        headings, nav items, and social icons inside this decorative widget.
        The visible label beneath the card provides the accessible description.
      */}
      <div aria-hidden="true" className="overflow-hidden rounded-card border border-ink/10 bg-paper shadow-lift">
        {/* Mock browser chrome / portfolio nav */}
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4 sm:px-7">
          <span className="text-[9px] font-extrabold tracking-[0.19em] text-pine sm:text-[10px]">ALEX MORGAN</span>
          <div className="hidden items-center gap-5 text-[10px] font-bold text-ink/80 sm:flex">
            <span>About</span><span>Work</span><span>Notes</span><span>Contact</span>
          </div>
          <span className="flex size-7 items-center justify-center rounded-full bg-pine text-xs text-white">✦</span>
        </div>

        {/* Hero area of the mock portfolio */}
        <div className="relative grid min-h-[370px] overflow-hidden px-5 py-8 sm:min-h-[418px] sm:grid-cols-[1fr_0.85fr] sm:px-7 sm:py-11">
          <div className="relative z-10 flex flex-col items-start">
            <p className="text-lg text-ink sm:text-xl">Hello, I'm</p>
            {/* <p> not <h2> — this is illustrative content, not a real page heading */}
            <p className="mt-1 font-display text-[2.75rem] leading-[0.9] tracking-[-0.06em] text-ink sm:text-[4.1rem]">Alex<br />Morgan</p>
            <p className="mt-4 text-sm font-bold text-brass sm:text-base">Full Stack Developer</p>
            <span className="mt-4 h-px w-10 bg-brass" />
            <p className="mt-4 max-w-[255px] text-xs leading-5 text-muted sm:text-sm sm:leading-6">I build thoughtful digital products that help people do their best work.</p>
            <span className="mt-5 inline-flex items-center gap-2 rounded-[var(--radius-control)] bg-pine px-3.5 py-2.5 text-[10px] font-extrabold text-white">
              View selected work <ArrowUpRightIcon size={13} />
            </span>
            <div className="mt-auto hidden gap-2.5 pt-5 sm:flex">
              {[GithubIcon, LinkedinIcon, MailIcon].map((Social, index) => (
                <span key={index} className="flex size-8 items-center justify-center rounded-full border border-ink/10 text-ink">
                  <Social size={15} />
                </span>
              ))}
            </div>
          </div>

          {/* Illustrated portrait column */}
          <div className="relative mt-2 min-h-[255px] sm:mt-0 sm:min-h-0">
            <div className="preview-dots absolute right-1 top-2 grid grid-cols-4 gap-3 text-pine/25">
              {dots.map((_, index) => <span key={index} className="size-1 rounded-full bg-current" />)}
            </div>
            <div className="portrait-wash absolute inset-x-0 bottom-0 top-8" />
            <div
              className="absolute bottom-0 left-[17%] right-[4%] top-4 overflow-hidden rounded-t-[9rem] bg-[#c9c8b9]"
              role="img"
              aria-label="Illustrated demo portrait of Alex Morgan"
            >
              <div className="portrait-hair" />
              <div className="portrait-face" />
              <div className="portrait-neck" />
              <div className="portrait-shirt" />
              <div className="portrait-collar portrait-collar-left" />
              <div className="portrait-collar portrait-collar-right" />
              <div className="portrait-arm portrait-arm-left" />
              <div className="portrait-arm portrait-arm-right" />
            </div>
          </div>
        </div>

        {/* Mini work pages strip */}
        <div className="grid grid-cols-3 border-t border-ink/10 bg-[#f4f1e9] px-3 py-3 sm:px-4">
          <MiniPage title="Rook & River" type="Systems" tone="light" />
          <MiniPage title="Local Signal" type="Product" tone="dark" />
          <MiniPage title="In Process" type="Writing" tone="sand" />
        </div>
      </div>

      {/* Visible-but-screen-reader-hidden label (whole card is aria-hidden above) */}
      <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-[0.13em] text-muted/70" aria-hidden="true">
        Illustrative portfolio preview
      </p>
    </motion.div>
  )
}

function MiniPage({ title, type, tone }: { title: string; type: string; tone: 'light' | 'dark' | 'sand' }) {
  return (
    <div
      aria-hidden="true"
      className={`mx-1 min-w-0 overflow-hidden rounded-[5px] border border-ink/10 p-2 sm:mx-1.5 sm:p-2.5 ${tone === 'dark' ? 'bg-pine text-white' : tone === 'sand' ? 'bg-[#ded3bf]' : 'bg-paper'}`}
    >
      <p className="text-[5px] font-bold opacity-65">{type}</p>
      <p className="mt-1 truncate font-display text-[10px] leading-none tracking-[-0.04em] sm:text-xs">{title}</p>
      <span className={`mt-3 block h-7 w-full rounded-sm ${tone === 'dark' ? 'bg-white/15' : 'bg-pine/10'}`} />
    </div>
  )
}
