import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, MailCheck, Orbit } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/state/authStore'
import { useOrbitStore } from '@/state/orbitStore'
import { cn } from '@/lib/utils'

type Mode = 'signup' | 'login'

export function AuthPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const signUp = useAuthStore((s) => s.signUp)
  const signIn = useAuthStore((s) => s.signIn)
  const loadMyOrganization = useOrbitStore((s) => s.loadMyOrganization)

  const [mode, setMode] = useState<Mode>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const result = mode === 'signup' ? await signUp(email, password) : await signIn(email, password)

    if (result.error) {
      setSubmitting(false)
      setError(result.error)
      return
    }

    if (result.needsEmailConfirmation) {
      setSubmitting(false)
      setNeedsConfirmation(true)
      return
    }

    const outcome = await loadMyOrganization()
    setSubmitting(false)
    navigate(outcome === 'none' ? '/onboarding' : '/', { replace: true })
  }

  if (needsConfirmation) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas px-6 text-center">
        <MailCheck className="h-10 w-10 text-accent" strokeWidth={1.5} />
        <h1 className="text-xl font-semibold text-ink">{t('auth.checkEmail.title')}</h1>
        <p className="max-w-sm text-sm text-graphite">
          <Trans i18nKey="auth.checkEmail.description" values={{ email }} components={{ strong: <strong /> }} />
        </p>
        <Button variant="outline" onClick={() => setNeedsConfirmation(false)}>
          {t('auth.checkEmail.backToSignIn')}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-canvas px-6">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-ink text-canvas">
          <Orbit className="h-4 w-4" strokeWidth={2} />
        </div>
        <span className="text-[15px] font-semibold tracking-tight text-ink">ORBIT</span>
      </div>

      <div className="w-full max-w-sm">
        <div className="mb-6 flex gap-1 rounded-[var(--radius-control)] bg-mist p-1">
          {(['signup', 'login'] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m)
                setError(null)
              }}
              className={cn(
                'flex-1 rounded-[8px] py-2 text-sm font-medium transition-colors',
                mode === m ? 'bg-canvas-raised text-ink shadow-xs' : 'text-graphite',
              )}
            >
              {m === 'signup' ? t('auth.createAccount') : t('auth.login')}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">{t('auth.email')}</label>
            <Input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.emailPlaceholder')}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">{t('auth.password')}</label>
            <Input
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.passwordPlaceholder')}
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button type="submit" variant="accent" size="lg" disabled={submitting} className="mt-2">
            {submitting ? t('auth.pleaseWait') : mode === 'signup' ? t('auth.createAccount') : t('auth.login')}
            {!submitting && <ArrowRight className="h-4 w-4" />}
          </Button>
        </form>
      </div>

      <Button variant="ghost" size="sm" onClick={() => navigate('/welcome')}>
        {t('auth.back')}
      </Button>
    </div>
  )
}
