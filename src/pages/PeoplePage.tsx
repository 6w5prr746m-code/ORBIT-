import { useMemo, useState } from 'react'
import { Users2 } from 'lucide-react'
import { useDataset } from '@/hooks/useDataset'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { PageHeader } from '@/components/common/PageHeader'
import { SearchBar } from '@/components/common/SearchBar'
import { PersonCard } from '@/components/people/PersonCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { normalizeQuery, skillsForPerson } from '@/services/SearchService'

export function PeoplePage() {
  const dataset = useDataset()
  const [query, setQuery] = useState('')
  const [team, setTeam] = useState('')
  const [location, setLocation] = useState('')
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
      <PageHeader eyebrow={`${dataset.people.length} people`} title="People" description="Everyone in your organization." />

      <div className="flex flex-col gap-4 px-6 py-6 sm:px-10">
        <SearchBar
          placeholder="Search by name, role, team or location…"
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
            <option value="">All teams</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="h-9 rounded-[var(--radius-control)] border border-border bg-canvas-raised px-3 text-sm text-ink focus-visible:outline-none focus:border-accent"
          >
            <option value="">All locations</option>
            {locations.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>

        {filteredPeople.length === 0 ? (
          <EmptyState
            icon={Users2}
            title="No one matches these filters"
            description="Try a different search term, or clear your filters to see everyone."
            actionLabel="Clear filters"
            onAction={() => {
              setQuery('')
              setTeam('')
              setLocation('')
            }}
          />
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
