import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useDataset } from '@/hooks/useDataset'
import { useOrbitStore } from '@/state/orbitStore'
import { useAuthStore } from '@/state/authStore'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'
import {
  DEFAULT_SCOPED_PERMISSIONS,
  type CustomRoleBase,
  type MembershipRole,
  type RoleActionPermissions,
  type RolePagePermissions,
  type RolePermissions,
} from '@/types'

const ADMIN_ROLES: MembershipRole[] = ['owner', 'hr_admin']
const BASE_ROLES: CustomRoleBase[] = ['director', 'manager', 'collaborator']
const PAGE_KEYS: (keyof RolePagePermissions)[] = ['skills', 'discover', 'coverage', 'teamBuilder', 'ask']
const ACTION_KEYS: (keyof RoleActionPermissions)[] = ['manageEntities', 'manageAccess', 'manageInvitations', 'importData']

function clonePermissions(p: RolePermissions): RolePermissions {
  return { pages: { ...p.pages }, actions: { ...p.actions } }
}

interface FormState {
  name: string
  baseRole: CustomRoleBase
  permissions: RolePermissions
}

const BLANK_FORM: FormState = { name: '', baseRole: 'collaborator', permissions: clonePermissions(DEFAULT_SCOPED_PERMISSIONS) }

export function CustomRolesSettings() {
  const dataset = useDataset()
  const isDemo = useOrbitStore((s) => s.isDemo)
  const user = useAuthStore((s) => s.user)
  const createCustomRole = useOrbitStore((s) => s.createCustomRole)
  const updateCustomRole = useOrbitStore((s) => s.updateCustomRole)
  const deleteCustomRole = useOrbitStore((s) => s.deleteCustomRole)
  const { push } = useToast()
  const { t } = useTranslation()

  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [form, setForm] = useState<FormState>(BLANK_FORM)
  const [saving, setSaving] = useState(false)

  if (!dataset) return null

  if (isDemo) {
    return (
      <Card className="flex flex-col items-center gap-3 p-8 text-center">
        <Sparkles className="h-8 w-8 text-graphite-soft" strokeWidth={1.5} />
        <h3 className="text-base font-semibold text-ink">{t('customRoles.demo.title')}</h3>
        <p className="max-w-sm text-sm text-graphite">{t('customRoles.demo.description')}</p>
      </Card>
    )
  }

  const myMembership = dataset.memberships.find((m) => m.userId === user?.id)
  const isAdmin = !!myMembership && ADMIN_ROLES.includes(myMembership.role)

  if (!isAdmin) {
    return (
      <Card className="flex flex-col items-center gap-3 p-8 text-center">
        <Sparkles className="h-8 w-8 text-graphite-soft" strokeWidth={1.5} />
        <h3 className="text-base font-semibold text-ink">{t('customRoles.notAuthorized.title')}</h3>
        <p className="max-w-sm text-sm text-graphite">{t('customRoles.notAuthorized.description')}</p>
      </Card>
    )
  }

  function startCreate() {
    setForm(BLANK_FORM)
    setEditingId('new')
  }

  function startEdit(roleId: string) {
    const role = dataset!.customRoles.find((r) => r.id === roleId)
    if (!role) return
    setForm({ name: role.name, baseRole: role.baseRole, permissions: clonePermissions(role.permissions) })
    setEditingId(roleId)
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(BLANK_FORM)
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      if (editingId === 'new') {
        await createCustomRole(form.name.trim(), form.baseRole, form.permissions)
      } else if (editingId) {
        await updateCustomRole(editingId, { name: form.name.trim(), baseRole: form.baseRole, permissions: form.permissions })
      }
      cancelEdit()
    } catch (err) {
      push({ kind: 'error', title: t('customRoles.error'), description: err instanceof Error ? err.message : undefined })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(roleId: string) {
    try {
      await deleteCustomRole(roleId)
    } catch (err) {
      push({ kind: 'error', title: t('customRoles.error'), description: err instanceof Error ? err.message : undefined })
    }
  }

  function togglePage(key: keyof RolePagePermissions) {
    setForm((prev) => ({ ...prev, permissions: { ...prev.permissions, pages: { ...prev.permissions.pages, [key]: !prev.permissions.pages[key] } } }))
  }

  function toggleAction(key: keyof RoleActionPermissions) {
    setForm((prev) => ({
      ...prev,
      permissions: { ...prev.permissions, actions: { ...prev.permissions.actions, [key]: !prev.permissions.actions[key] } },
    }))
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('customRoles.title')}</CardTitle>
              <CardDescription>{t('customRoles.description')}</CardDescription>
            </div>
            {editingId === null && (
              <Button size="sm" onClick={startCreate}>
                {t('customRoles.addAction')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {dataset.customRoles.length === 0 && editingId === null && (
            <p className="text-sm text-graphite-soft">{t('customRoles.empty')}</p>
          )}
          {dataset.customRoles.map((role) => (
            <div key={role.id} className="flex items-center justify-between gap-2 rounded-[var(--radius-control)] border border-border px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{role.name}</p>
                <p className="text-xs text-graphite-soft">{t(`access.roles.${role.baseRole}`)}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="outline" size="sm" onClick={() => startEdit(role.id)}>
                  {t('customRoles.editAction')}
                </Button>
                <button
                  onClick={() => handleDelete(role.id)}
                  aria-label={t('customRoles.remove', { name: role.name })}
                  className="shrink-0 text-graphite-soft hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {editingId !== null && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId === 'new' ? t('customRoles.form.createTitle') : t('customRoles.form.editTitle')}</CardTitle>
            <CardDescription>{t('customRoles.form.description')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <label className="mb-1.5 block text-sm font-medium text-ink">{t('customRoles.form.nameLabel')}</label>
                <Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder={t('customRoles.form.namePlaceholder')} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">{t('customRoles.form.baseRoleLabel')}</label>
                <select
                  value={form.baseRole}
                  onChange={(e) => setForm((prev) => ({ ...prev, baseRole: e.target.value as CustomRoleBase }))}
                  className="h-10 rounded-[var(--radius-control)] border border-border bg-canvas-raised px-3 text-sm text-ink focus:border-accent focus-visible:outline-none"
                >
                  {BASE_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {t(`access.roles.${role}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-xs text-graphite-soft">{t('customRoles.form.baseRoleHint')}</p>

            <div>
              <p className="mb-2 text-sm font-medium text-ink">{t('customRoles.form.pagesLabel')}</p>
              <div className="flex flex-wrap gap-2">
                {PAGE_KEYS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => togglePage(key)}
                    className={cn(
                      'rounded-[var(--radius-pill)] border px-3 py-1.5 text-xs font-medium transition-colors',
                      form.permissions.pages[key] ? 'border-accent bg-accent-soft/40 text-accent-ink' : 'border-border text-graphite hover:border-accent/40',
                    )}
                  >
                    {t(`customRoles.pages.${key}`)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-ink">{t('customRoles.form.actionsLabel')}</p>
              <div className="flex flex-wrap gap-2">
                {ACTION_KEYS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleAction(key)}
                    className={cn(
                      'rounded-[var(--radius-pill)] border px-3 py-1.5 text-xs font-medium transition-colors',
                      form.permissions.actions[key] ? 'border-accent bg-accent-soft/40 text-accent-ink' : 'border-border text-graphite hover:border-accent/40',
                    )}
                  >
                    {t(`customRoles.actions.${key}`)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 border-t border-border pt-4">
              <Button variant="outline" size="sm" onClick={cancelEdit}>
                {t('common.cancel')}
              </Button>
              <Button size="sm" onClick={handleSave} disabled={!form.name.trim() || saving}>
                {saving ? t('customRoles.form.saving') : t('customRoles.form.save')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
