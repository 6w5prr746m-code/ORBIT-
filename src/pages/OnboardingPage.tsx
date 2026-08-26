import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Orbit, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ImportPeople } from '@/components/settings/ImportPeople'
import { useOrbitStore } from '@/state/orbitStore'
import { cn } from '@/lib/utils'

const STEPS = ['Welcome', 'Organization', 'People', 'Discover'] as const

export function OnboardingPage() {
  const navigate = useNavigate()
  const loadDemo = useOrbitStore((s) => s.loadDemo)
  const createOrganization = useOrbitStore((s) => s.createOrganization)
  const dataset = useOrbitStore((s) => s.dataset)

  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [industry, setIndustry] = useState('')
  const [size, setSize] = useState('')

  function skipToDemo() {
    loadDemo()
    navigate('/')
  }

  function goNext() {
    if (step === 1) {
      createOrganization({ name: name || 'My Organization', industry: industry || 'Technology', size: Number(size) || 100 })
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="flex items-center justify-between px-6 py-6 sm:px-10">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-ink text-canvas">
            <Orbit className="h-4 w-4" strokeWidth={2} />
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-ink">ORBIT</span>
        </div>
        <Button variant="ghost" size="sm" onClick={skipToDemo}>
          Skip — explore demo
        </Button>
      </header>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-6 py-10 sm:px-0">
        <div className="mb-8 flex gap-1.5">
          {STEPS.map((label, i) => (
            <div key={label} className={cn('h-1 flex-1 rounded-full', i <= step ? 'bg-ink' : 'bg-mist')} />
          ))}
        </div>

        {step === 0 && (
          <div className="flex flex-1 flex-col justify-center text-center">
            <h1 className="text-3xl font-semibold tracking-tight text-ink">Welcome to Orbit.</h1>
            <p className="mt-3 text-base text-graphite">
              Know who knows what. Let's set up your organization in a couple of minutes.
            </p>
            <Button variant="accent" size="lg" className="mx-auto mt-8 w-fit" onClick={goNext}>
              Get started <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-1 flex-col justify-center">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">Tell us about your organization.</h1>
            <div className="mt-6 flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Inc." />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">Industry</label>
                <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="B2B SaaS" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">Company size</label>
                <Input value={size} onChange={(e) => setSize(e.target.value)} placeholder="250" type="number" min="1" />
              </div>
            </div>
            <Button variant="accent" size="lg" className="mt-8 w-fit" onClick={goNext}>
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-1 flex-col justify-center">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">Add your people.</h1>
            <p className="mt-2 text-sm text-graphite">Import a CSV now, or skip and do it later from Settings.</p>
            <div className="mt-6">
              <ImportPeople />
            </div>
            <Button variant="accent" size="lg" className="mt-8 w-fit" onClick={goNext}>
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-1 flex-col justify-center text-center">
            <Sparkles className="mx-auto h-10 w-10 text-accent" strokeWidth={1.5} />
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink">Discover your organization.</h1>
            <p className="mt-2 text-sm text-graphite">
              {dataset && dataset.people.length > 0
                ? `${dataset.people.length} people are ready to explore.`
                : 'Your workspace is ready — import people anytime from Settings.'}
            </p>
            <Button variant="accent" size="lg" className="mx-auto mt-8 w-fit" onClick={() => navigate('/')}>
              Go to ORBIT <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
