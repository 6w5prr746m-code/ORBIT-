import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, Orbit, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ImportPeople } from '@/components/settings/ImportPeople'
import { useOrbitStore } from '@/state/orbitStore'
import { useAuthStore } from '@/state/authStore'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'

const STEP_KEYS = ['onboarding.steps.organization', 'onboarding.steps.people', 'onboarding.steps.discover'] as const

export function OnboardingPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { session, initialized } = useAuthStore()
  const createOrganization = useOrbitStore((s) => s.createOrganization)
  const dataset = useOrbitStore((s) => s.dataset)
  const { push } = useToast()

  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [industry, setIndustry] = useState('')
  const [size, setSize] = useState('')
  const [creating, setCreating] = useState(false)

  if (initialized && !session) return <Navigate to="/auth" replace />

  async function goNext() {
    if (step === 0) {
      setCreating(true)
      try {
        await createOrganization({
          name: name || 'My Organization',
          industry: industry || 'Technology',
          size: Number(size) || 100,
        })
      } catch {
        setCreating(false)
        push({
          kind: 'error',
          title: t('onboarding.organizationStep.createError.title'),
          description: t('onboarding.organizationStep.createError.description'),
        })
        return
      }
      setCreating(false)
    }
    setStep((s) => Math.min(s + 1, STEP_KEYS.length - 1))
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="flex items-center px-6 py-6 sm:px-10">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-ink text-canvas">
            <Orbit className="h-4 w-4" strokeWidth={2} />
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-ink">ORBIT</span>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-6 py-10 sm:px-0">
        <div className="mb-8 flex gap-1.5">
          {STEP_KEYS.map((key, i) => (
            <div key={key} className={cn('h-1 flex-1 rounded-full', i <= step ? 'bg-ink' : 'bg-mist')} />
          ))}
        </div>

        {step === 0 && (
          <div className="flex flex-1 flex-col justify-center">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">{t('onboarding.organizationStep.title')}</h1>
            <div className="mt-6 flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">{t('onboarding.organizationStep.name')}</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('onboarding.organizationStep.namePlaceholder')} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">{t('onboarding.organizationStep.industry')}</label>
                <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder={t('onboarding.organizationStep.industryPlaceholder')} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">{t('onboarding.organizationStep.size')}</label>
                <Input value={size} onChange={(e) => setSize(e.target.value)} placeholder={t('onboarding.organizationStep.sizePlaceholder')} type="number" min="1" />
              </div>
            </div>
            <Button variant="accent" size="lg" className="mt-8 w-fit" onClick={goNext} disabled={creating}>
              {creating ? t('onboarding.organizationStep.creating') : t('common.continue')} {!creating && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-1 flex-col justify-center">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">{t('onboarding.peopleStep.title')}</h1>
            <p className="mt-2 text-sm text-graphite">{t('onboarding.peopleStep.subtitle')}</p>
            <div className="mt-6">
              <ImportPeople />
            </div>
            <Button variant="accent" size="lg" className="mt-8 w-fit" onClick={goNext}>
              {t('common.continue')} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-1 flex-col justify-center text-center">
            <Sparkles className="mx-auto h-10 w-10 text-accent" strokeWidth={1.5} />
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink">{t('onboarding.discoverStep.title')}</h1>
            <p className="mt-2 text-sm text-graphite">
              {dataset && dataset.people.length > 0
                ? t('onboarding.discoverStep.readyWithPeople', { count: dataset.people.length })
                : t('onboarding.discoverStep.readyEmpty')}
            </p>
            <Button variant="accent" size="lg" className="mx-auto mt-8 w-fit" onClick={() => navigate('/')}>
              {t('onboarding.discoverStep.goToOrbit')} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
