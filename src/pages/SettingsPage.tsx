import { useState } from 'react'
import {
  Building2,
  Database,
  Lock,
  Network,
  Plug,
  Send,
  ShieldCheck,
  Upload,
  UserCircle,
  Wand2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useNavigate } from 'react-router-dom'
import { ImportPeople } from '@/components/settings/ImportPeople'
import { EntitiesSettings } from '@/components/settings/EntitiesSettings'
import { AccessSettings } from '@/components/settings/AccessSettings'
import { InvitationsSettings } from '@/components/settings/InvitationsSettings'
import { LanguageSwitcher } from '@/components/settings/LanguageSwitcher'
import { useDataset } from '@/hooks/useDataset'
import { useOrbitStore } from '@/state/orbitStore'
import { useAuthStore } from '@/state/authStore'
import { cn } from '@/lib/utils'
import type { IntegrationSourceType } from '@/types'

const ACCENT_OPTIONS = [
  { nameKey: 'settings.workspace.accentNames.signalBlue', value: '#3b5bfd' },
  { nameKey: 'settings.workspace.accentNames.forest', value: '#1c8a5e' },
  { nameKey: 'settings.workspace.accentNames.amber', value: '#b5750f' },
  { nameKey: 'settings.workspace.accentNames.plum', value: '#6d4fc4' },
]

const SECTIONS = [
  { id: 'workspace', labelKey: 'settings.sections.workspace', icon: Wand2 },
  { id: 'organization', labelKey: 'settings.sections.organization', icon: Building2 },
  { id: 'entities', labelKey: 'settings.sections.entities', icon: Network },
  { id: 'access', labelKey: 'settings.sections.access', icon: ShieldCheck },
  { id: 'invitations', labelKey: 'settings.sections.invitations', icon: Send },
  { id: 'data', labelKey: 'settings.sections.data', icon: Database },
  { id: 'import', labelKey: 'settings.sections.import', icon: Upload },
  { id: 'integrations', labelKey: 'settings.sections.integrations', icon: Plug },
  { id: 'security', labelKey: 'settings.sections.security', icon: Lock },
  { id: 'user', labelKey: 'settings.sections.user', icon: UserCircle },
] as const

type SectionId = (typeof SECTIONS)[number]['id']

const INTEGRATION_LABEL_KEYS: Record<IntegrationSourceType, string> = {
  'core-hr': 'settings.integrations.labels.core-hr',
  'microsoft-365': 'settings.integrations.labels.microsoft-365',
  'google-workspace': 'settings.integrations.labels.google-workspace',
  slack: 'settings.integrations.labels.slack',
  teams: 'settings.integrations.labels.teams',
  notion: 'settings.integrations.labels.notion',
  jira: 'settings.integrations.labels.jira',
  'csv-import': 'settings.integrations.labels.csv-import',
}

export function SettingsPage() {
  const navigate = useNavigate()
  const dataset = useDataset()
  const isDemo = useOrbitStore((s) => s.isDemo)
  const clearDataset = useOrbitStore((s) => s.clear)
  const user = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)
  const { t } = useTranslation()
  const [section, setSection] = useState<SectionId>('workspace')
  const [accent, setAccent] = useState(ACCENT_OPTIONS[0].value)

  async function handleSignOut() {
    await signOut()
    clearDataset()
    navigate('/welcome')
  }

  if (!dataset) return null

  function applyAccent(value: string) {
    setAccent(value)
    document.documentElement.style.setProperty('--color-accent', value)
  }

  return (
    <div>
      <PageHeader title={t('settings.title')} description={t('settings.description')} />

      <div className="flex flex-col gap-8 px-6 py-8 sm:flex-row sm:px-10">
        <nav className="flex shrink-0 gap-1 overflow-x-auto sm:w-52 sm:flex-col sm:overflow-visible">
          {SECTIONS.map(({ id, labelKey, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSection(id)}
              className={cn(
                'flex items-center gap-2.5 whitespace-nowrap rounded-[var(--radius-control)] px-3 py-2 text-left text-sm font-medium transition-colors',
                section === id ? 'bg-ink text-canvas' : 'text-graphite hover:bg-mist hover:text-ink',
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
              {t(labelKey)}
            </button>
          ))}
        </nav>

        <div className="max-w-2xl flex-1">
          {section === 'workspace' && (
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.workspace.title')}</CardTitle>
                <CardDescription>{t('settings.workspace.description')}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <div>
                  <p className="mb-2 text-sm font-medium text-ink">{t('settings.workspace.accentColor')}</p>
                  <div className="flex gap-2">
                    {ACCENT_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        aria-label={t(option.nameKey)}
                        onClick={() => applyAccent(option.value)}
                        className={cn(
                          'h-9 w-9 rounded-full border-2 transition-transform hover:scale-105',
                          accent === option.value ? 'border-ink' : 'border-transparent',
                        )}
                        style={{ backgroundColor: option.value }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-ink">{t('settings.workspace.language')}</p>
                  <LanguageSwitcher />
                </div>
              </CardContent>
            </Card>
          )}

          {section === 'organization' && (
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.organization.title')}</CardTitle>
                <CardDescription>{t('settings.organization.description')}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">{t('settings.organization.name')}</label>
                  <Input value={dataset.organization.name} readOnly />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">{t('settings.organization.industry')}</label>
                  <Input value={dataset.organization.industry} readOnly />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">{t('settings.organization.size')}</label>
                  <Input value={t('settings.organization.employees', { count: dataset.organization.size })} readOnly />
                </div>
              </CardContent>
            </Card>
          )}

          {section === 'entities' && <EntitiesSettings />}

          {section === 'access' && <AccessSettings />}

          {section === 'invitations' && <InvitationsSettings />}

          {section === 'data' && (
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.data.title')}</CardTitle>
                <CardDescription>{t('settings.data.description')}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: t('settings.data.people'), value: dataset.people.length },
                    { label: t('settings.data.skills'), value: dataset.skills.length },
                    { label: t('settings.data.teams'), value: dataset.teams.length },
                    { label: t('settings.data.connections'), value: dataset.connections.length },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-[var(--radius-control)] border border-border p-3">
                      <p className="text-lg font-semibold text-ink">{stat.value}</p>
                      <p className="text-xs text-graphite-soft">{stat.label}</p>
                    </div>
                  ))}
                </div>
                {isDemo && (
                  <div className="border-t border-border pt-4">
                    <p className="text-sm text-graphite">{t('settings.data.demoNotice')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {section === 'import' && (
            <div>
              <div className="mb-4">
                <h2 className="text-base font-semibold text-ink">{t('settings.import.title')}</h2>
                <p className="text-sm text-graphite">{t('settings.import.subtitle')}</p>
              </div>
              <ImportPeople />
            </div>
          )}

          {section === 'integrations' && (
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.integrations.title')}</CardTitle>
                <CardDescription>{t('settings.integrations.description')}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {dataset.sources.map((source) => (
                  <div key={source.id} className="flex items-center justify-between rounded-[var(--radius-control)] border border-border px-4 py-3">
                    <span className="text-sm font-medium text-ink">{t(INTEGRATION_LABEL_KEYS[source.type])}</span>
                    <Badge variant={source.status === 'connected' ? 'success' : 'default'}>
                      {source.status === 'connected' ? t('settings.integrations.connected') : t('settings.integrations.comingSoon')}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {section === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.security.title')}</CardTitle>
                <CardDescription>{t('settings.security.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-3 text-sm text-graphite">
                  {(t('settings.security.items', { returnObjects: true }) as string[]).map((item) => (
                    <li key={item}>· {item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {section === 'user' && (
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.user.title')}</CardTitle>
                <CardDescription>{t('settings.user.description')}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">{t('settings.user.email')}</label>
                  <Input value={user?.email ?? t('settings.user.notSignedIn')} readOnly />
                </div>
                {user && (
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigate('/me')}>
                      {t('settings.user.manageProfile')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleSignOut}>
                      {t('common.signOut')}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
