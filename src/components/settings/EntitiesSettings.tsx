import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Building, ShieldAlert, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useDataset } from '@/hooks/useDataset'
import { useOrbitStore } from '@/state/orbitStore'
import { useEffectivePermissions } from '@/hooks/usePermissions'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'
import type { EntityIsolationMode } from '@/types'

export function EntitiesSettings() {
  const dataset = useDataset()
  const isDemo = useOrbitStore((s) => s.isDemo)
  const permissions = useEffectivePermissions()
  const createEntity = useOrbitStore((s) => s.createEntity)
  const renameEntity = useOrbitStore((s) => s.renameEntity)
  const deleteEntity = useOrbitStore((s) => s.deleteEntity)
  const setEntityIsolationMode = useOrbitStore((s) => s.setEntityIsolationMode)
  const { push } = useToast()
  const { t } = useTranslation()
  const [newEntityName, setNewEntityName] = useState('')
  const [renaming, setRenaming] = useState<Record<string, string>>({})

  if (!dataset) return null

  if (isDemo) {
    return (
      <Card className="flex flex-col items-center gap-3 p-8 text-center">
        <Building className="h-8 w-8 text-graphite-soft" strokeWidth={1.5} />
        <h3 className="text-base font-semibold text-ink">{t('entities.demo.title')}</h3>
        <p className="max-w-sm text-sm text-graphite">{t('entities.demo.description')}</p>
      </Card>
    )
  }

  if (!permissions.actions.manageEntities) {
    return (
      <Card className="flex flex-col items-center gap-3 p-8 text-center">
        <ShieldAlert className="h-8 w-8 text-graphite-soft" strokeWidth={1.5} />
        <h3 className="text-base font-semibold text-ink">{t('entities.notAuthorized.title')}</h3>
        <p className="max-w-sm text-sm text-graphite">{t('entities.notAuthorized.description')}</p>
      </Card>
    )
  }

  async function handleAdd() {
    if (!newEntityName.trim()) return
    try {
      await createEntity(newEntityName.trim())
      setNewEntityName('')
    } catch (err) {
      push({ kind: 'error', title: t('entities.error'), description: err instanceof Error ? err.message : undefined })
    }
  }

  async function handleRename(entityId: string) {
    const name = renaming[entityId]?.trim()
    if (!name) return
    try {
      await renameEntity(entityId, name)
      setRenaming((prev) => {
        const next = { ...prev }
        delete next[entityId]
        return next
      })
    } catch (err) {
      push({ kind: 'error', title: t('entities.error'), description: err instanceof Error ? err.message : undefined })
    }
  }

  async function handleDelete(entityId: string) {
    try {
      await deleteEntity(entityId)
    } catch (err) {
      push({ kind: 'error', title: t('entities.error'), description: err instanceof Error ? err.message : undefined })
    }
  }

  async function handleModeChange(mode: EntityIsolationMode) {
    try {
      await setEntityIsolationMode(mode)
    } catch (err) {
      push({ kind: 'error', title: t('entities.error'), description: err instanceof Error ? err.message : undefined })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('entities.isolation.title')}</CardTitle>
          <CardDescription>{t('entities.isolation.description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row">
          {(['filter', 'strict'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => handleModeChange(mode)}
              className={cn(
                'flex-1 rounded-[var(--radius-control)] border p-4 text-left transition-colors',
                dataset.organization.entityIsolationMode === mode ? 'border-accent bg-accent-soft/40' : 'border-border hover:border-accent/40',
              )}
            >
              <p className="text-sm font-semibold text-ink">{t(`entities.isolation.${mode}.title`)}</p>
              <p className="mt-1 text-xs text-graphite">{t(`entities.isolation.${mode}.description`)}</p>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('entities.list.title')}</CardTitle>
          <CardDescription>{t('entities.list.description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {dataset.entities.length === 0 && <p className="text-sm text-graphite-soft">{t('entities.list.empty')}</p>}
          {dataset.entities.map((entity) => {
            const memberCount = dataset.people.filter((p) => p.entityId === entity.id).length
            return (
              <div key={entity.id} className="flex items-center gap-2 rounded-[var(--radius-control)] border border-border px-3 py-2.5">
                <Input
                  value={renaming[entity.id] ?? entity.name}
                  onChange={(e) => setRenaming((prev) => ({ ...prev, [entity.id]: e.target.value }))}
                  onBlur={() => renaming[entity.id] !== undefined && renaming[entity.id] !== entity.name && handleRename(entity.id)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRename(entity.id)}
                  className="h-8 flex-1"
                />
                <span className="shrink-0 text-xs text-graphite-soft">{t('entities.list.memberCount', { count: memberCount })}</span>
                <button
                  onClick={() => handleDelete(entity.id)}
                  aria-label={t('entities.list.remove', { name: entity.name })}
                  className="shrink-0 text-graphite-soft hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )
          })}

          <div className="flex gap-2 border-t border-border pt-4">
            <Input
              value={newEntityName}
              onChange={(e) => setNewEntityName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder={t('entities.list.addPlaceholder')}
              className="max-w-xs"
            />
            <Button size="sm" onClick={handleAdd} disabled={!newEntityName.trim()}>
              {t('entities.list.addAction')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
