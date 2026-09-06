import { Footer } from './components/layout/Footer'
import { Navbar } from './components/layout/Navbar'
import { FinalCta } from './components/landing/FinalCta'
import { Features } from './components/landing/Features'
import { Hero } from './components/landing/Hero'
import { HowItWorks } from './components/landing/HowItWorks'
import { Templates } from './components/landing/Templates'

function App() {
  return (
    <div className="min-h-screen overflow-x-clip bg-canvas text-ink">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Navbar />
      <main id="main-content" tabIndex={-1}>
        <Hero />
        <Features />
        <HowItWorks />
        <Templates />
        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}

export default App
