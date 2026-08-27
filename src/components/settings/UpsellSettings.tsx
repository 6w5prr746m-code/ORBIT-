import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useDataset } from '@/hooks/useDataset'
import { useOrbitStore } from '@/state/orbitStore'
import { useAuthStore } from '@/state/authStore'
import { useToast } from '@/components/ui/Toast'
import type { MembershipRole } from '@/types'

const ADMIN_ROLES: MembershipRole[] = ['owner', 'hr_admin']

export function UpsellSettings() {
  const dataset = useDataset()
  const isDemo = useOrbitStore((s) => s.isDemo)
  const user = useAuthStore((s) => s.user)
  const requestAdvancedPermissions = useOrbitStore((s) => s.requestAdvancedPermissions)
  const { push } = useToast()
  const { t } = useTranslation()
  const [note, setNote] = useState('')
  const [sending, setSending] = useState(false)

  if (!dataset) return null

  if (isDemo) {
    return (
      <Card className="flex flex-col items-center gap-3 p-8 text-center">
        <Sparkles className="h-8 w-8 text-graphite-soft" strokeWidth={1.5} />
        <h3 className="text-base font-semibold text-ink">{t('upsell.demo.title')}</h3>
        <p className="max-w-sm text-sm text-graphite">{t('upsell.demo.description')}</p>
      </Card>
    )
  }

  const myMembership = dataset.memberships.find((m) => m.userId === user?.id)
  const isAdmin = !!myMembership && ADMIN_ROLES.includes(myMembership.role)

  if (!isAdmin) {
    return (
      <Card className="flex flex-col items-center gap-3 p-8 text-center">
        <ShieldAlert className="h-8 w-8 text-graphite-soft" strokeWidth={1.5} />
        <h3 className="text-base font-semibold text-ink">{t('upsell.notAuthorized.title')}</h3>
        <p className="max-w-sm text-sm text-graphite">{t('upsell.notAuthorized.description')}</p>
      </Card>
    )
  }

  if (dataset.organization.advancedPermissionsEnabled) {
    return (
      <Card className="flex flex-col items-center gap-3 p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
          <CheckCircle2 className="h-5 w-5 text-success" />
        </div>
        <h3 className="text-base font-semibold text-ink">{t('upsell.enabled.title')}</h3>
        <p className="max-w-sm text-sm text-graphite">{t('upsell.enabled.description')}</p>
      </Card>
    )
  }

  const pendingRequest = [...dataset.upgradeRequests].reverse().find((r) => r.status === 'pending')

  async function handleRequest() {
    setSending(true)
    try {
      await requestAdvancedPermissions(note)
      setNote('')
      push({ kind: 'success', title: t('upsell.sent.title'), description: t('upsell.sent.description') })
    } catch (err) {
      push({ kind: 'error', title: t('upsell.error'), description: err instanceof Error ? err.message : undefined })
    } finally {
      setSending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" strokeWidth={1.75} />
          <CardTitle>{t('upsell.title')}</CardTitle>
        </div>
        <CardDescription>{t('upsell.description')}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ul className="flex flex-col gap-2 text-sm text-graphite">
          {(t('upsell.features', { returnObjects: true }) as string[]).map((feature) => (
            <li key={feature} className="flex gap-2">
              <span className="text-accent">·</span>
              {feature}
            </li>
          ))}
        </ul>

        {pendingRequest ? (
          <Badge variant="accent" className="w-fit">
            {t('upsell.pendingNotice')}
          </Badge>
        ) : (
          <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1.5 block text-sm font-medium text-ink">{t('upsell.noteLabel')}</label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('upsell.notePlaceholder')} />
            </div>
            <Button onClick={handleRequest} disabled={sending} className="shrink-0">
              {sending ? t('upsell.sending') : t('upsell.cta')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
