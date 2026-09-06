const footerColumns = [
  { title: 'Product', links: ['Features', 'Templates', 'How it works', 'Pricing'] },
  { title: 'Company', links: ['About', 'Contact'] },
  { title: 'Legal', links: ['Privacy', 'Terms'] },
]

export function Footer() {
  return (
    <footer id="footer" className="border-t border-line bg-[#f1eee6]">
      <div className="section-shell grid gap-12 py-14 md:grid-cols-[1.35fr_2fr] md:py-16">
        <div>
          <p className="font-display text-[2rem] leading-none tracking-[-0.06em] text-pine">FOLVIRA<span className="text-brass">.</span></p>
          <p className="mt-4 max-w-[230px] text-sm leading-6 text-muted">Your identity. Your work. Your portfolio.</p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {footerColumns.map((column) => <div key={column.title}>
            <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-pine">{column.title}</p>
            <ul className="mt-4 space-y-3">
              {column.links.map((link) => <li key={link}><span className="text-sm text-muted">{link}</span></li>)}
            </ul>
          </div>)}
        </div>
      </div>
      <div className="section-shell border-t border-ink/10 py-5 text-xs text-muted">© {new Date().getFullYear()} FOLVIRA. Phase 1 preview.</div>
    </footer>
  )
}
