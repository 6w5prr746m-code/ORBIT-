import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Send, ShieldAlert } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useDataset } from '@/hooks/useDataset'
import { useOrbitStore } from '@/state/orbitStore'
import { useEffectivePermissions } from '@/hooks/usePermissions'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'
import { ASSIGNABLE_ROLES, type AssignableRole, type InvitationStatus } from '@/types'

function parseEmails(text: string): string[] {
  const seen = new Set<string>()
  for (const line of text.split(/[\n,]/)) {
    const email = line.trim().toLowerCase()
    if (email && /\S+@\S+\.\S+/.test(email)) seen.add(email)
  }
  return [...seen]
}

const STATUS_VARIANT: Record<InvitationStatus, 'default' | 'success'> = {
  pending: 'default',
  accepted: 'success',
  revoked: 'default',
}

export function InvitationsSettings() {
  const dataset = useDataset()
  const isDemo = useOrbitStore((s) => s.isDemo)
  const permissions = useEffectivePermissions()
  const createInvitations = useOrbitStore((s) => s.createInvitations)
  const resendInvitations = useOrbitStore((s) => s.resendInvitations)
  const revokeInvitation = useOrbitStore((s) => s.revokeInvitation)
  const { push } = useToast()
  const { t } = useTranslation()

  const [emailsText, setEmailsText] = useState('')
  const [role, setRole] = useState<AssignableRole>('collaborator')
  const [entityId, setEntityId] = useState('')
  const [sending, setSending] = useState(false)
  const [resendingAll, setResendingAll] = useState(false)

  if (!dataset) return null

  if (isDemo) {
    return (
      <Card className="flex flex-col items-center gap-3 p-8 text-center">
        <Send className="h-8 w-8 text-graphite-soft" strokeWidth={1.5} />
        <h3 className="text-base font-semibold text-ink">{t('invitations.demo.title')}</h3>
        <p className="max-w-sm text-sm text-graphite">{t('invitations.demo.description')}</p>
      </Card>
    )
  }

  if (!permissions.actions.manageInvitations) {
    return (
      <Card className="flex flex-col items-center gap-3 p-8 text-center">
        <ShieldAlert className="h-8 w-8 text-graphite-soft" strokeWidth={1.5} />
        <h3 className="text-base font-semibold text-ink">{t('invitations.notAuthorized.title')}</h3>
        <p className="max-w-sm text-sm text-graphite">{t('invitations.notAuthorized.description')}</p>
      </Card>
    )
  }

  const emails = parseEmails(emailsText)
  const pendingIds = dataset.invitations.filter((i) => i.status === 'pending').map((i) => i.id)

  async function handleSend() {
    if (emails.length === 0) return
    setSending(true)
    try {
      await createInvitations(emails.map((email) => ({ email, role, entityId: entityId || undefined })))
      setEmailsText('')
      push({ kind: 'success', title: t('invitations.sent.title'), description: t('invitations.sent.description', { count: emails.length }) })
    } catch (err) {
      push({ kind: 'error', title: t('invitations.error'), description: err instanceof Error ? err.message : undefined })
    } finally {
      setSending(false)
    }
  }

  async function handleResend(invitationId: string) {
    try {
      await resendInvitations([invitationId])
    } catch (err) {
      push({ kind: 'error', title: t('invitations.error'), description: err instanceof Error ? err.message : undefined })
    }
  }

  async function handleResendAll() {
    if (pendingIds.length === 0) return
    setResendingAll(true)
    try {
      await resendInvitations(pendingIds)
      push({ kind: 'success', title: t('invitations.resentAll', { count: pendingIds.length }) })
    } catch (err) {
      push({ kind: 'error', title: t('invitations.error'), description: err instanceof Error ? err.message : undefined })
    } finally {
      setResendingAll(false)
    }
  }

  async function handleRevoke(invitationId: string) {
    try {
      await revokeInvitation(invitationId)
    } catch (err) {
      push({ kind: 'error', title: t('invitations.error'), description: err instanceof Error ? err.message : undefined })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('invitations.form.title')}</CardTitle>
          <CardDescription>{t('invitations.form.description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <textarea
            value={emailsText}
            onChange={(e) => setEmailsText(e.target.value)}
            placeholder={t('invitations.form.emailsPlaceholder')}
            rows={4}
            className="w-full rounded-[var(--radius-control)] border border-border bg-canvas-raised px-3.5 py-2.5 text-sm text-ink placeholder:text-graphite-soft focus:border-accent focus-visible:outline-none"
          />
          <div className="flex flex-wrap gap-2">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as AssignableRole)}
              className="h-9 rounded-[var(--radius-control)] border border-border bg-canvas-raised px-2.5 text-sm text-ink focus:border-accent focus-visible:outline-none"
            >
              {ASSIGNABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {t(`access.roles.${r}`)}
                </option>
              ))}
            </select>
            <select
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
              className="h-9 rounded-[var(--radius-control)] border border-border bg-canvas-raised px-2.5 text-sm text-ink focus:border-accent focus-visible:outline-none"
            >
              <option value="">{t('access.noEntity')}</option>
              {dataset.entities.map((entity) => (
                <option key={entity.id} value={entity.id}>
                  {entity.name}
                </option>
              ))}
            </select>
            <Button size="sm" onClick={handleSend} disabled={emails.length === 0 || sending}>
              {sending ? t('invitations.form.sending') : t('invitations.form.send', { count: emails.length })}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('invitations.list.title')}</CardTitle>
              <CardDescription>{t('invitations.list.description')}</CardDescription>
            </div>
            {pendingIds.length > 0 && (
              <Button size="sm" variant="outline" onClick={handleResendAll} disabled={resendingAll}>
                {resendingAll ? t('invitations.form.sending') : t('invitations.list.resendAll', { count: pendingIds.length })}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {dataset.invitations.length === 0 && <p className="text-sm text-graphite-soft">{t('invitations.list.empty')}</p>}
          {dataset.invitations.map((invitation) => (
            <div
              key={invitation.id}
              className="flex flex-col gap-2 rounded-[var(--radius-control)] border border-border px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{invitation.email}</p>
                <p className="text-xs text-graphite-soft">
                  {t(`access.roles.${invitation.role}`)}
                  {invitation.entityId && ` · ${dataset.entities.find((e) => e.id === invitation.entityId)?.name ?? ''}`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant={STATUS_VARIANT[invitation.status]}>{t(`invitations.status.${invitation.status}`)}</Badge>
                {invitation.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleResend(invitation.id)}
                      className={cn('text-xs font-medium text-accent hover:underline')}
                    >
                      {t('invitations.list.resend')}
                    </button>
                    <button
                      onClick={() => handleRevoke(invitation.id)}
                      className="text-xs font-medium text-graphite-soft hover:text-danger"
                    >
                      {t('invitations.list.revoke')}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
