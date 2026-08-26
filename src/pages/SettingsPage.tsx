import { useState } from 'react'
import {
  Building2,
  Database,
  Lock,
  Plug,
  Upload,
  UserCircle,
  Wand2,
} from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ImportPeople } from '@/components/settings/ImportPeople'
import { useDataset } from '@/hooks/useDataset'
import { useOrbitStore } from '@/state/orbitStore'
import { cn } from '@/lib/utils'
import type { IntegrationSourceType } from '@/types'

const ACCENT_OPTIONS = [
  { name: 'Signal blue', value: '#3b5bfd' },
  { name: 'Forest', value: '#1c8a5e' },
  { name: 'Amber', value: '#b5750f' },
  { name: 'Plum', value: '#6d4fc4' },
]

const SECTIONS = [
  { id: 'workspace', label: 'Workspace', icon: Wand2 },
  { id: 'organization', label: 'Organization', icon: Building2 },
  { id: 'data', label: 'Data', icon: Database },
  { id: 'import', label: 'Import', icon: Upload },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'user', label: 'User', icon: UserCircle },
] as const

type SectionId = (typeof SECTIONS)[number]['id']

const INTEGRATION_LABELS: Record<IntegrationSourceType, string> = {
  'core-hr': 'Core HR',
  'microsoft-365': 'Microsoft 365',
  'google-workspace': 'Google Workspace',
  slack: 'Slack',
  teams: 'Microsoft Teams',
  notion: 'Notion',
  jira: 'Jira',
  'csv-import': 'CSV Import',
}

export function SettingsPage() {
  const dataset = useDataset()
  const resetOrganization = useOrbitStore((s) => s.resetOrganization)
  const [section, setSection] = useState<SectionId>('workspace')
  const [accent, setAccent] = useState(ACCENT_OPTIONS[0].value)

  if (!dataset) return null

  function applyAccent(value: string) {
    setAccent(value)
    document.documentElement.style.setProperty('--color-accent', value)
  }

  return (
    <div>
      <PageHeader title="Settings" description="Manage your workspace, data and integrations." />

      <div className="flex flex-col gap-8 px-6 py-8 sm:flex-row sm:px-10">
        <nav className="flex shrink-0 gap-1 overflow-x-auto sm:w-52 sm:flex-col sm:overflow-visible">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSection(id)}
              className={cn(
                'flex items-center gap-2.5 whitespace-nowrap rounded-[var(--radius-control)] px-3 py-2 text-left text-sm font-medium transition-colors',
                section === id ? 'bg-ink text-canvas' : 'text-graphite hover:bg-mist hover:text-ink',
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
              {label}
            </button>
          ))}
        </nav>

        <div className="max-w-2xl flex-1">
          {section === 'workspace' && (
            <Card>
              <CardHeader>
                <CardTitle>Workspace</CardTitle>
                <CardDescription>Personalize how ORBIT looks for your organization.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div>
                  <p className="mb-2 text-sm font-medium text-ink">Accent color</p>
                  <div className="flex gap-2">
                    {ACCENT_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        aria-label={option.name}
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
              </CardContent>
            </Card>
          )}

          {section === 'organization' && (
            <Card>
              <CardHeader>
                <CardTitle>Organization</CardTitle>
                <CardDescription>Basic information about your company.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">Name</label>
                  <Input value={dataset.organization.name} readOnly />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">Industry</label>
                  <Input value={dataset.organization.industry} readOnly />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">Company size</label>
                  <Input value={`${dataset.organization.size} employees`} readOnly />
                </div>
              </CardContent>
            </Card>
          )}

          {section === 'data' && (
            <Card>
              <CardHeader>
                <CardTitle>Data</CardTitle>
                <CardDescription>What ORBIT currently knows about your organization.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: 'People', value: dataset.people.length },
                    { label: 'Skills', value: dataset.skills.length },
                    { label: 'Teams', value: dataset.teams.length },
                    { label: 'Connections', value: dataset.connections.length },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-[var(--radius-control)] border border-border p-3">
                      <p className="text-lg font-semibold text-ink">{stat.value}</p>
                      <p className="text-xs text-graphite-soft">{stat.label}</p>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border pt-4">
                  <p className="mb-2 text-sm font-medium text-ink">Reset organization</p>
                  <p className="mb-3 text-sm text-graphite">
                    Clears all data in this workspace and returns you to onboarding. This cannot be undone.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (window.confirm('Reset this workspace? All imported data will be removed.')) {
                        resetOrganization()
                      }
                    }}
                  >
                    Reset organization
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {section === 'import' && (
            <div>
              <div className="mb-4">
                <h2 className="text-base font-semibold text-ink">Import organization</h2>
                <p className="text-sm text-graphite">Bring your people and their skills into ORBIT via CSV.</p>
              </div>
              <ImportPeople />
            </div>
          )}

          {section === 'integrations' && (
            <Card>
              <CardHeader>
                <CardTitle>Integrations</CardTitle>
                <CardDescription>Connect ORBIT to the systems your organization already uses.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {dataset.sources.map((source) => (
                  <div key={source.id} className="flex items-center justify-between rounded-[var(--radius-control)] border border-border px-4 py-3">
                    <span className="text-sm font-medium text-ink">{INTEGRATION_LABELS[source.type]}</span>
                    <Badge variant={source.status === 'connected' ? 'success' : 'default'}>
                      {source.status === 'connected' ? 'Connected' : 'Coming soon'}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {section === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>How ORBIT protects your organization's data.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-3 text-sm text-graphite">
                  <li>· Every record is scoped to your organization — no data is ever shared across workspaces.</li>
                  <li>· Imported files are validated and sanitized before anything is stored.</li>
                  <li>· ORBIT never infers a skill you haven't actually demonstrated or reported.</li>
                  <li>· No secrets or credentials are ever stored in the browser.</li>
                </ul>
              </CardContent>
            </Card>
          )}

          {section === 'user' && (
            <Card>
              <CardHeader>
                <CardTitle>User</CardTitle>
                <CardDescription>Your ORBIT account.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">Name</label>
                  <Input value="You" readOnly />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">Email</label>
                  <Input value={`you@${dataset.organization.name.toLowerCase()}.io`} readOnly />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
