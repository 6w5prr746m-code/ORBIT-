import { useMemo, useState } from 'react'
import { ThumbsUp, UserCheck2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useDataset } from '@/hooks/useDataset'
import { useOrbitStore } from '@/state/orbitStore'
import { useAuthStore } from '@/state/authStore'
import { useToast } from '@/components/ui/Toast'
import { PageHeader } from '@/components/common/PageHeader'
import { SearchBar } from '@/components/common/SearchBar'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Tag } from '@/components/ui/Tag'
import { initials } from '@/lib/utils'
import { normalizeQuery } from '@/services/SearchService'
import type { SkillLevel } from '@/types'

const LEVELS: SkillLevel[] = ['familiar', 'proficient', 'expert']

export function ProfilePage() {
  const dataset = useDataset()
  const isDemo = useOrbitStore((s) => s.isDemo)
  const claimPerson = useOrbitStore((s) => s.claimPerson)
  const updateMyProfile = useOrbitStore((s) => s.updateMyProfile)
  const addMySkill = useOrbitStore((s) => s.addMySkill)
  const removeMySkill = useOrbitStore((s) => s.removeMySkill)
  const user = useAuthStore((s) => s.user)
  const { push } = useToast()
  const { t } = useTranslation()

  const [query, setQuery] = useState('')
  const [claiming, setClaiming] = useState(false)
  const [bio, setBio] = useState<string | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [newSkillName, setNewSkillName] = useState('')
  const [newSkillLevel, setNewSkillLevel] = useState<SkillLevel>('proficient')
  const [newSkillYears, setNewSkillYears] = useState('2')

  const myPerson = useMemo(() => dataset?.people.find((p) => p.claimedByUserId === user?.id), [dataset, user])

  const unclaimedPeople = useMemo(() => {
    if (!dataset) return []
    const candidates = dataset.people.filter((p) => !p.claimedByUserId)
    if (!query.trim()) return candidates
    const q = normalizeQuery(query)
    return candidates.filter((p) => normalizeQuery(`${p.firstName} ${p.lastName} ${p.jobTitle} ${p.email}`).includes(q))
  }, [dataset, query])

  if (!dataset || !user) return null

  if (isDemo) {
    return (
      <div>
        <PageHeader title={t('profile.title')} />
        <div className="px-6 py-8 sm:px-10">
          <Card className="flex flex-col items-center gap-3 p-8 text-center">
            <UserCheck2 className="h-8 w-8 text-graphite-soft" strokeWidth={1.5} />
            <h3 className="text-base font-semibold text-ink">{t('profile.demo.title')}</h3>
            <p className="max-w-sm text-sm text-graphite">{t('profile.demo.description')}</p>
          </Card>
        </div>
      </div>
    )
  }

  async function handleClaim(personId: string) {
    setClaiming(true)
    try {
      await claimPerson(personId, user!.id)
    } catch (err) {
      push({ kind: 'error', title: t('profile.claim.error'), description: err instanceof Error ? err.message : undefined })
    } finally {
      setClaiming(false)
    }
  }

  async function handleSaveProfile() {
    if (!myPerson) return
    setSaving(true)
    try {
      await updateMyProfile(myPerson.id, {
        bio: bio ?? myPerson.bio,
        avatar: photoUrl ?? myPerson.avatar ?? null,
      })
      push({ kind: 'success', title: t('profile.edit.saved') })
      setBio(null)
      setPhotoUrl(null)
    } catch (err) {
      push({ kind: 'error', title: t('profile.edit.error'), description: err instanceof Error ? err.message : undefined })
    } finally {
      setSaving(false)
    }
  }

  async function handleAddSkill() {
    if (!myPerson || !newSkillName.trim()) return
    await addMySkill(myPerson.id, {
      skillName: newSkillName.trim(),
      level: newSkillLevel,
      yearsExperience: Number(newSkillYears) || 0,
    })
    setNewSkillName('')
    setNewSkillYears('2')
  }

  if (!myPerson) {
    const suggested = unclaimedPeople.find((p) => p.email.toLowerCase() === user.email?.toLowerCase())

    return (
      <div>
        <PageHeader title={t('profile.title')} description={t('profile.claim.subtitle')} />
        <div className="flex flex-col gap-4 px-6 py-6 sm:px-10">
          <SearchBar placeholder={t('profile.claim.searchPlaceholder')} value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-xl" />

          {suggested && (
            <Card className="flex items-center justify-between gap-4 border-accent/40 bg-accent-soft/40 p-4">
              <div className="flex items-center gap-3">
                <Avatar name={`${suggested.firstName} ${suggested.lastName}`} initials={initials(suggested.firstName, suggested.lastName)} photoUrl={suggested.avatar} size={44} />
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {suggested.firstName} {suggested.lastName}
                  </p>
                  <p className="text-xs text-graphite">{t('profile.claim.suggested')}</p>
                </div>
              </div>
              <Button variant="accent" size="sm" onClick={() => handleClaim(suggested.id)} disabled={claiming}>
                {t('profile.claim.action')}
              </Button>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {unclaimedPeople
              .filter((p) => p.id !== suggested?.id)
              .map((p) => (
                <Card key={p.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={`${p.firstName} ${p.lastName}`} initials={initials(p.firstName, p.lastName)} photoUrl={p.avatar} size={40} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">
                        {p.firstName} {p.lastName}
                      </p>
                      <p className="truncate text-xs text-graphite-soft">{p.jobTitle}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleClaim(p.id)} disabled={claiming}>
                    {t('profile.claim.action')}
                  </Button>
                </Card>
              ))}
          </div>

          {unclaimedPeople.length === 0 && <p className="text-sm text-graphite-soft">{t('profile.claim.empty')}</p>}
        </div>
      </div>
    )
  }

  const mySkills = dataset.personSkills.filter((ps) => ps.personId === myPerson.id)

  return (
    <div>
      <PageHeader title={t('profile.title')} description={`${myPerson.firstName} ${myPerson.lastName}`} />

      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-8 sm:px-10">
        <Card>
          <CardHeader>
            <CardTitle>{t('profile.edit.title')}</CardTitle>
            <CardDescription>{t('profile.edit.description')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <Avatar name={`${myPerson.firstName} ${myPerson.lastName}`} initials={initials(myPerson.firstName, myPerson.lastName)} photoUrl={photoUrl ?? myPerson.avatar} size={64} />
              <div className="flex-1">
                <label className="mb-1.5 block text-sm font-medium text-ink">{t('profile.edit.photoLabel')}</label>
                <Input
                  value={photoUrl ?? myPerson.avatar ?? ''}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder={t('profile.edit.photoPlaceholder')}
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">{t('profile.edit.bioLabel')}</label>
              <textarea
                value={bio ?? myPerson.bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="w-full rounded-[var(--radius-control)] border border-border bg-canvas-raised px-3.5 py-2.5 text-sm text-ink placeholder:text-graphite-soft transition-colors duration-150 focus:border-accent focus-visible:outline-none"
              />
            </div>
            <Button variant="accent" size="sm" className="w-fit" onClick={handleSaveProfile} disabled={saving}>
              {saving ? t('common.loading') : t('profile.edit.save')}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('profile.skills.title')}</CardTitle>
            <CardDescription>{t('profile.skills.description')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {mySkills.length === 0 && <p className="text-sm text-graphite-soft">{t('profile.skills.empty')}</p>}
              {mySkills.map((ps) => {
                const skill = dataset.skills.find((s) => s.id === ps.skillId)
                if (!skill) return null
                const endorsementCount = dataset.skillEndorsements.filter((e) => e.personId === myPerson.id && e.skillId === ps.skillId).length
                return (
                  <Tag key={ps.skillId} className="gap-1.5">
                    {skill.name}
                    <Badge variant={ps.level === 'expert' ? 'accent' : 'default'} className="px-1.5 py-0 text-[10px]">
                      {t(`common.levels.${ps.level}`)}
                    </Badge>
                    {endorsementCount > 0 && (
                      <span className="flex items-center gap-0.5 text-[11px] font-medium text-accent-ink">
                        <ThumbsUp className="h-3 w-3" fill="currentColor" strokeWidth={1.75} />
                        {endorsementCount}
                      </span>
                    )}
                    <button
                      onClick={() => removeMySkill(myPerson.id, ps.skillId)}
                      aria-label={t('profile.skills.remove', { skill: skill.name })}
                      className="text-graphite-soft hover:text-danger"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Tag>
                )
              })}
            </div>

            <div className="flex flex-wrap items-end gap-2">
              <div className="flex-1">
                <label className="mb-1.5 block text-xs font-medium text-graphite">{t('profile.skills.addPlaceholder')}</label>
                <Input
                  list="profile-skill-options"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  placeholder={t('profile.skills.addPlaceholder')}
                  className="min-w-[10rem]"
                />
                <datalist id="profile-skill-options">
                  {dataset.skills.map((s) => (
                    <option key={s.id} value={s.name} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-graphite">{t('profile.skills.levelLabel')}</label>
                <select
                  value={newSkillLevel}
                  onChange={(e) => setNewSkillLevel(e.target.value as SkillLevel)}
                  className="h-10 rounded-[var(--radius-control)] border border-border bg-canvas-raised px-3 text-sm text-ink focus-visible:outline-none focus:border-accent"
                >
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {t(`common.levels.${l}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-20">
                <label className="mb-1.5 block text-xs font-medium text-graphite">{t('profile.skills.yearsLabel')}</label>
                <Input type="number" min="0" value={newSkillYears} onChange={(e) => setNewSkillYears(e.target.value)} />
              </div>
              <Button size="sm" onClick={handleAddSkill} disabled={!newSkillName.trim()}>
                {t('profile.skills.addAction')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
