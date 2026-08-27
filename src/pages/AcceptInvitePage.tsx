import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, Orbit, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { FullPageSpinner } from '@/components/common/FullPageSpinner'
import { useAuthStore } from '@/state/authStore'
import { useOrbitStore } from '@/state/orbitStore'
import { getInvitationPreview } from '@/repositories/SupabaseRepository'
import { cn } from '@/lib/utils'
import type { AssignableRole } from '@/types'

type Mode = 'signup' | 'login'
type Preview = { email: string; organizationName: string; role: AssignableRole }

export function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const signUp = useAuthStore((s) => s.signUp)
  const signIn = useAuthStore((s) => s.signIn)
  const user = useAuthStore((s) => s.user)
  const initialized = useAuthStore((s) => s.initialized)
  const acceptInvitation = useOrbitStore((s) => s.acceptInvitation)

  const [preview, setPreview] = useState<Preview | 'not-found' | 'loading'>('loading')
  const [mode, setMode] = useState<Mode>('signup')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!token) {
      setPreview('not-found')
      return
    }
    getInvitationPreview(token)
      .then((result) => setPreview(result ?? 'not-found'))
      .catch(() => setPreview('not-found'))
  }, [token])

  useEffect(() => {
    if (!initialized || !user || !token || done || submitting) return
    if (preview === 'loading' || preview === 'not-found') return
    void finishAccepting()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized, user, token, preview])

  async function finishAccepting() {
    if (!token) return
    setSubmitting(true)
    setError(null)
    try {
      await acceptInvitation(token)
      setDone(true)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('acceptInvite.error'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (preview === 'loading' || preview === 'not-found') return
    setSubmitting(true)
    setError(null)

    const result = mode === 'signup' ? await signUp(preview.email, password) : await signIn(preview.email, password)

    if (result.error) {
      setSubmitting(false)
      setError(result.error)
      return
    }
    if (result.needsEmailConfirmation) {
      setSubmitting(false)
      setError(t('acceptInvite.confirmEmailFirst'))
      return
    }

    await finishAccepting()
  }

  if (preview === 'loading' || (initialized && user && !error)) return <FullPageSpinner />

  if (initialized && user && error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas px-6 text-center">
        <XCircle className="h-10 w-10 text-danger" strokeWidth={1.5} />
        <h1 className="text-xl font-semibold text-ink">{t('acceptInvite.error')}</h1>
        <p className="max-w-sm text-sm text-graphite">{error}</p>
        <Button variant="outline" onClick={() => navigate('/')}>
          {t('acceptInvite.goHome')}
        </Button>
      </div>
    )
  }

  if (preview === 'not-found') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas px-6 text-center">
        <XCircle className="h-10 w-10 text-danger" strokeWidth={1.5} />
        <h1 className="text-xl font-semibold text-ink">{t('acceptInvite.notFound.title')}</h1>
        <p className="max-w-sm text-sm text-graphite">{t('acceptInvite.notFound.description')}</p>
        <Button variant="outline" onClick={() => navigate('/welcome')}>
          {t('auth.back')}
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
        <p className="mb-6 text-center text-sm text-graphite">
          {t('acceptInvite.invitedTo', { org: preview.organizationName, role: t(`access.roles.${preview.role}`) })}
        </p>

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
              {m === 'signup' ? t('acceptInvite.createAccountAndJoin') : t('acceptInvite.signInAndJoin')}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">{t('auth.email')}</label>
            <Input type="email" value={preview.email} disabled />
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
            {submitting ? t('auth.pleaseWait') : mode === 'signup' ? t('acceptInvite.createAccountAndJoin') : t('acceptInvite.signInAndJoin')}
            {!submitting && <ArrowRight className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  )
}
