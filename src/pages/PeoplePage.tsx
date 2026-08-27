import { useMemo, useState } from 'react'
import { LayoutGrid, List, Users2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useDataset } from '@/hooks/useDataset'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { PageHeader } from '@/components/common/PageHeader'
import { SearchBar } from '@/components/common/SearchBar'
import { PersonCard } from '@/components/people/PersonCard'
import { PersonGridCard } from '@/components/people/PersonGridCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { normalizeQuery, skillsForPerson } from '@/services/SearchService'
import { cn } from '@/lib/utils'

type PeopleView = 'list' | 'trombinoscope'

export function PeoplePage() {
  const dataset = useDataset()
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [team, setTeam] = useState('')
  const [location, setLocation] = useState('')
  const [view, setView] = useState<PeopleView>('list')
  const debouncedQuery = useDebouncedValue(query, 150)

  const { teams, locations } = useMemo(() => {
    if (!dataset) return { teams: [], locations: [] }
    return {
      teams: dataset.teams,
      locations: [...new Set(dataset.people.map((p) => p.location))].sort(),
    }
  }, [dataset])

  const filteredPeople = useMemo(() => {
    if (!dataset) return []
    let people = dataset.people
    if (team) {
      const memberIds = new Set(dataset.personTeams.filter((pt) => pt.teamId === team).map((pt) => pt.personId))
      people = people.filter((p) => memberIds.has(p.id))
    }
    if (location) people = people.filter((p) => p.location === location)
    if (debouncedQuery.trim()) {
      const q = normalizeQuery(debouncedQuery)
      people = people.filter((p) =>
        normalizeQuery(`${p.firstName} ${p.lastName} ${p.jobTitle} ${p.department} ${p.location}`).includes(q),
      )
    }
    return people
  }, [dataset, team, location, debouncedQuery])

  if (!dataset) return null

  return (
    <div>
      <PageHeader
        eyebrow={t('people.eyebrow', { count: dataset.people.length })}
        title={t('people.title')}
        description={t('people.description')}
      />

      <div className="flex flex-col gap-4 px-6 py-6 sm:px-10">
        <SearchBar
          placeholder={t('people.searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xl"
        />

        <div className="flex flex-wrap gap-2">
          <select
            value={team}
            onChange={(e) => setTeam(e.target.value)}
            className="h-9 rounded-[var(--radius-control)] border border-border bg-canvas-raised px-3 text-sm text-ink focus-visible:outline-none focus:border-accent"
          >
            <option value="">{t('people.allTeams')}</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="h-9 rounded-[var(--radius-control)] border border-border bg-canvas-raised px-3 text-sm text-ink focus-visible:outline-none focus:border-accent"
          >
            <option value="">{t('people.allLocations')}</option>
            {locations.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>

          <div className="ml-auto flex gap-1 rounded-[var(--radius-control)] border border-border bg-canvas-raised p-1">
            <button
              onClick={() => setView('list')}
              aria-label={t('people.view.list')}
              aria-pressed={view === 'list'}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-[6px] transition-colors',
                view === 'list' ? 'bg-ink text-canvas' : 'text-graphite hover:text-ink',
              )}
            >
              <List className="h-4 w-4" strokeWidth={1.75} />
            </button>
            <button
              onClick={() => setView('trombinoscope')}
              aria-label={t('people.view.trombinoscope')}
              aria-pressed={view === 'trombinoscope'}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-[6px] transition-colors',
                view === 'trombinoscope' ? 'bg-ink text-canvas' : 'text-graphite hover:text-ink',
              )}
            >
              <LayoutGrid className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {filteredPeople.length === 0 ? (
          <EmptyState
            icon={Users2}
            title={t('people.empty.title')}
            description={t('people.empty.description')}
            actionLabel={t('people.empty.action')}
            onAction={() => {
              setQuery('')
              setTeam('')
              setLocation('')
            }}
          />
        ) : view === 'trombinoscope' ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filteredPeople.map((person) => (
              <PersonGridCard key={person.id} person={person} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredPeople.map((person) => (
              <PersonCard
                key={person.id}
                person={person}
                topSkills={skillsForPerson(dataset, person.id)
                  .filter((s) => s.category !== 'Language')
                  .sort((a, b) => b.yearsExperience - a.yearsExperience)
                  .map((s) => s.name)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
