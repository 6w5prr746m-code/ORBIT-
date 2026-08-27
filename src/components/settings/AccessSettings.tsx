import { useTranslation } from 'react-i18next'
import { ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useDataset } from '@/hooks/useDataset'
import { useOrbitStore } from '@/state/orbitStore'
import { useAuthStore } from '@/state/authStore'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'
import { ASSIGNABLE_ROLES, type MembershipRole } from '@/types'

const ADMIN_ROLES: MembershipRole[] = ['owner', 'hr_admin']
const NON_ASSIGNABLE_ROLES: MembershipRole[] = ['owner', 'member']

export function AccessSettings() {
  const dataset = useDataset()
  const isDemo = useOrbitStore((s) => s.isDemo)
  const user = useAuthStore((s) => s.user)
  const updateMembershipRole = useOrbitStore((s) => s.updateMembershipRole)
  const { push } = useToast()
  const { t } = useTranslation()

  if (!dataset) return null

  if (isDemo) {
    return (
      <Card className="flex flex-col items-center gap-3 p-8 text-center">
        <ShieldCheck className="h-8 w-8 text-graphite-soft" strokeWidth={1.5} />
        <h3 className="text-base font-semibold text-ink">{t('access.demo.title')}</h3>
        <p className="max-w-sm text-sm text-graphite">{t('access.demo.description')}</p>
      </Card>
    )
  }

  const myMembership = dataset.memberships.find((m) => m.userId === user?.id)
  const isAdmin = !!myMembership && ADMIN_ROLES.includes(myMembership.role)

  async function handleRoleChange(userId: string, role: MembershipRole, entityId: string | null) {
    try {
      await updateMembershipRole(userId, role, entityId)
    } catch (err) {
      push({ kind: 'error', title: t('access.error'), description: err instanceof Error ? err.message : undefined })
    }
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('access.title')}</CardTitle>
          <CardDescription>{t('access.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {myMembership ? (
            <div className="flex flex-col gap-1">
              <p className="text-sm text-graphite">
                {t('access.yourRole', { role: t(`access.roles.${myMembership.role}`) })}
              </p>
              {myMembership.entityId && (
                <p className="text-sm text-graphite">
                  {t('access.yourEntity', {
                    name: dataset.entities.find((e) => e.id === myMembership.entityId)?.name ?? '—',
                  })}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-graphite-soft">{t('access.noMembership')}</p>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('access.title')}</CardTitle>
        <CardDescription>{t('access.adminDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {dataset.memberships.map((membership) => {
          const person = dataset.people.find((p) => p.claimedByUserId === membership.userId)
          const locked = NON_ASSIGNABLE_ROLES.includes(membership.role)
          return (
            <div
              key={membership.userId}
              className="flex flex-col gap-2 rounded-[var(--radius-control)] border border-border px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">
                  {person ? `${person.firstName} ${person.lastName}` : t('access.unclaimed', { id: membership.userId.slice(0, 8) })}
                </p>
                {membership.userId === user?.id && <span className="text-xs text-graphite-soft">{t('access.you')}</span>}
              </div>

              {locked ? (
                <Badge>{t(`access.roles.${membership.role}`)}</Badge>
              ) : (
                <div className="flex shrink-0 gap-2">
                  <select
                    value={membership.role}
                    onChange={(e) => handleRoleChange(membership.userId, e.target.value as MembershipRole, membership.entityId ?? null)}
                    className={cn(
                      'h-9 rounded-[var(--radius-control)] border border-border bg-canvas-raised px-2.5 text-sm text-ink focus:border-accent focus-visible:outline-none',
                    )}
                  >
                    {ASSIGNABLE_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {t(`access.roles.${role}`)}
                      </option>
                    ))}
                  </select>
                  <select
                    value={membership.entityId ?? ''}
                    onChange={(e) => handleRoleChange(membership.userId, membership.role, e.target.value || null)}
                    className={cn(
                      'h-9 rounded-[var(--radius-control)] border border-border bg-canvas-raised px-2.5 text-sm text-ink focus:border-accent focus-visible:outline-none',
                    )}
                  >
                    <option value="">{t('access.noEntity')}</option>
                    {dataset.entities.map((entity) => (
                      <option key={entity.id} value={entity.id}>
                        {entity.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
