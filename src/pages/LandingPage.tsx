import { useNavigate } from 'react-router-dom'
import { ArrowRight, Compass, MessageCircle, Network, Orbit, Sparkles, Users2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { LanguageSwitcher } from '@/components/settings/LanguageSwitcher'
import { useOrbitStore } from '@/state/orbitStore'

const PROBLEM_KEYS = ['0', '1', '2']
const HOW_IT_WORKS_KEYS = ['0', '1', '2']
const USE_CASE_ICONS = [Users2, Network, Sparkles]

export function LandingPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
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
          <LanguageSwitcher />
          <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
            {t('landing.setUpOrg')}
          </Button>
          <Button variant="accent" size="sm" onClick={exploreDemo} disabled={demoLoading}>
            {t('landing.exploreDemo')}
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-20 text-center sm:px-10 sm:py-28">
        <h1 className="text-4xl font-semibold tracking-tight text-ink sm:text-6xl">{t('landing.hero.title')}</h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-graphite">{t('landing.hero.subtitle')}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button variant="accent" size="lg" onClick={exploreDemo} disabled={demoLoading}>
            {t('landing.exploreDemo')} <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
          >
            {t('landing.hero.howItWorks')}
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16 sm:px-10">
        <h2 className="text-center text-sm font-semibold uppercase tracking-wide text-graphite-soft">{t('landing.problem.eyebrow')}</h2>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {PROBLEM_KEYS.map((key) => (
            <div key={key} className="rounded-[var(--radius-card-lg)] border border-border bg-canvas-raised p-6">
              <h3 className="text-base font-semibold text-ink">{t(`landing.problem.items.${key}.title`)}</h3>
              <p className="mt-2 text-sm text-graphite">{t(`landing.problem.items.${key}.description`)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16 text-center sm:px-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-graphite-soft">{t('landing.solution.eyebrow')}</h2>
        <p className="mx-auto mt-4 max-w-2xl text-2xl font-medium tracking-tight text-ink">{t('landing.solution.text')}</p>
      </section>

      <section id="how-it-works" className="mx-auto max-w-5xl px-6 py-16 sm:px-10">
        <h2 className="text-center text-sm font-semibold uppercase tracking-wide text-graphite-soft">{t('landing.howItWorks.eyebrow')}</h2>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {HOW_IT_WORKS_KEYS.map((key, i) => (
            <div key={key} className="rounded-[var(--radius-card-lg)] border border-border bg-canvas-raised p-6">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent-ink">
                {i + 1}
              </span>
              <h3 className="mt-4 text-base font-semibold text-ink">{t(`landing.howItWorks.items.${key}.title`)}</h3>
              <p className="mt-2 text-sm text-graphite">{t(`landing.howItWorks.items.${key}.description`)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16 sm:px-10">
        <h2 className="text-center text-sm font-semibold uppercase tracking-wide text-graphite-soft">{t('landing.useCases.eyebrow')}</h2>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {USE_CASE_ICONS.map((Icon, i) => (
            <div key={i} className="rounded-[var(--radius-card-lg)] border border-border bg-canvas-raised p-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-[10px] bg-accent-soft text-accent">
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </div>
              <h3 className="text-base font-semibold text-ink">{t(`landing.useCases.items.${i}.title`)}</h3>
              <p className="mt-2 text-sm text-graphite">{t(`landing.useCases.items.${i}.description`)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16 sm:px-10">
        <div className="overflow-hidden rounded-[var(--radius-card-lg)] border border-border bg-ink p-10 text-canvas">
          <div className="flex items-center gap-2 text-canvas/60">
            <MessageCircle className="h-4 w-4" />
            <span className="text-sm">{t('landing.askDemo.label')}</span>
          </div>
          <p className="mt-4 text-xl font-medium">{t('landing.askDemo.question')}</p>
          <div className="mt-4 flex items-center gap-3 rounded-[var(--radius-control)] bg-white/5 p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white">SM</div>
            <div>
              <p className="text-sm font-medium">{t('landing.askDemo.personTitle')}</p>
              <p className="text-xs text-canvas/60">{t('landing.askDemo.personSubtitle')}</p>
            </div>
            <span className="ml-auto text-sm font-semibold text-success">94%</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-20 text-center sm:px-10">
        <div className="mb-4 flex justify-center">
          <Compass className="h-8 w-8 text-graphite-soft" strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{t('landing.finalCta.title')}</h2>
        <p className="mt-3 text-graphite">{t('landing.finalCta.subtitle')}</p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button variant="accent" size="lg" onClick={exploreDemo} disabled={demoLoading}>
            {t('landing.exploreDemo')}
          </Button>
          <Button variant="outline" size="lg" onClick={() => navigate('/auth')}>
            {t('landing.setUpOrg')}
          </Button>
        </div>
      </section>

      <footer className="border-t border-border px-6 py-8 text-center text-xs text-graphite-soft sm:px-10">
        {t('landing.footer')}
      </footer>
    </div>
  )
}
