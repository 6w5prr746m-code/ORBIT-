import { useNavigate } from 'react-router-dom'
import { ArrowRight, Compass, MessageCircle, Network, Orbit, Sparkles, Users2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useOrbitStore } from '@/state/orbitStore'

const PROBLEM_POINTS = [
  { title: 'Scattered knowledge', description: 'Skills and expertise live across HR systems, Slack threads and tribal memory.' },
  { title: 'Slow discovery', description: 'Finding the right person means asking five colleagues and hoping one of them knows.' },
  { title: 'Invisible expertise', description: 'Your most valuable specialists are often the hardest people to find.' },
]

const HOW_IT_WORKS = [
  { title: 'Connect', description: 'Bring in people data from a CSV today — Core HR and workplace tools next.' },
  { title: 'Understand', description: 'ORBIT builds a living map of who knows what, and who works with whom.' },
  { title: 'Discover', description: 'Search, browse or ask in plain language — get the right person, with proof.' },
]

const USE_CASES = [
  { icon: Users2, title: 'Find the expert', description: 'Skip the guesswork — go straight to the person who actually knows.' },
  { icon: Network, title: 'Map your org', description: 'See how teams really connect, beyond the reporting lines.' },
  { icon: Sparkles, title: 'Surface hidden talent', description: 'Spot rare expertise before it walks out the door.' },
]

export function LandingPage() {
  const navigate = useNavigate()
  const loadDemo = useOrbitStore((s) => s.loadDemo)
  const demoLoading = useOrbitStore((s) => s.loading)

  async function exploreDemo() {
    await loadDemo()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-canvas">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 sm:px-10">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-ink text-canvas">
            <Orbit className="h-4 w-4" strokeWidth={2} />
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-ink">ORBIT</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
            Set up your organization
          </Button>
          <Button variant="accent" size="sm" onClick={exploreDemo} disabled={demoLoading}>
            Explore demo
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-20 text-center sm:px-10 sm:py-28">
        <h1 className="text-4xl font-semibold tracking-tight text-ink sm:text-6xl">Your organization, understood.</h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-graphite">
          Find the people, skills and expertise hidden inside your company.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button variant="accent" size="lg" onClick={exploreDemo} disabled={demoLoading}>
            Explore demo <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
          >
            See how it works
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16 sm:px-10">
        <h2 className="text-center text-sm font-semibold uppercase tracking-wide text-graphite-soft">The problem</h2>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {PROBLEM_POINTS.map((p) => (
            <div key={p.title} className="rounded-[var(--radius-card-lg)] border border-border bg-canvas-raised p-6">
              <h3 className="text-base font-semibold text-ink">{p.title}</h3>
              <p className="mt-2 text-sm text-graphite">{p.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16 text-center sm:px-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-graphite-soft">The solution</h2>
        <p className="mx-auto mt-4 max-w-2xl text-2xl font-medium tracking-tight text-ink">
          ORBIT connects to the systems you already use and turns your people data into a living map of expertise —
          searchable, explainable, always up to date.
        </p>
      </section>

      <section id="how-it-works" className="mx-auto max-w-5xl px-6 py-16 sm:px-10">
        <h2 className="text-center text-sm font-semibold uppercase tracking-wide text-graphite-soft">How it works</h2>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {HOW_IT_WORKS.map((step, i) => (
            <div key={step.title} className="rounded-[var(--radius-card-lg)] border border-border bg-canvas-raised p-6">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent-ink">
                {i + 1}
              </span>
              <h3 className="mt-4 text-base font-semibold text-ink">{step.title}</h3>
              <p className="mt-2 text-sm text-graphite">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16 sm:px-10">
        <h2 className="text-center text-sm font-semibold uppercase tracking-wide text-graphite-soft">Use cases</h2>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {USE_CASES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-[var(--radius-card-lg)] border border-border bg-canvas-raised p-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-[10px] bg-accent-soft text-accent">
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </div>
              <h3 className="text-base font-semibold text-ink">{title}</h3>
              <p className="mt-2 text-sm text-graphite">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16 sm:px-10">
        <div className="overflow-hidden rounded-[var(--radius-card-lg)] border border-border bg-ink p-10 text-canvas">
          <div className="flex items-center gap-2 text-canvas/60">
            <MessageCircle className="h-4 w-4" />
            <span className="text-sm">Ask Orbit</span>
          </div>
          <p className="mt-4 text-xl font-medium">"Who can help with Salesforce?"</p>
          <div className="mt-4 flex items-center gap-3 rounded-[var(--radius-control)] bg-white/5 p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white">SM</div>
            <div>
              <p className="text-sm font-medium">Sarah Martin</p>
              <p className="text-xs text-canvas/60">Salesforce — expert, 5 years · works with Sales team</p>
            </div>
            <span className="ml-auto text-sm font-semibold text-success">94%</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-20 text-center sm:px-10">
        <div className="mb-4 flex justify-center">
          <Compass className="h-8 w-8 text-graphite-soft" strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Ready to see your own organization?</h2>
        <p className="mt-3 text-graphite">Explore a live demo, or set up your own workspace in minutes.</p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button variant="accent" size="lg" onClick={exploreDemo} disabled={demoLoading}>
            Explore demo
          </Button>
          <Button variant="outline" size="lg" onClick={() => navigate('/auth')}>
            Set up your organization
          </Button>
        </div>
      </section>

      <footer className="border-t border-border px-6 py-8 text-center text-xs text-graphite-soft sm:px-10">
        ORBIT — Know who knows what.
      </footer>
    </div>
  )
}
