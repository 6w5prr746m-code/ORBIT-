import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Compass, Sparkles, Users2, Layers } from 'lucide-react'
import { useDataset } from '@/hooks/useDataset'
import { SearchBar } from '@/components/common/SearchBar'
import { Card } from '@/components/ui/Card'
import { ASK_SUGGESTIONS } from '@/services/AskService'

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning.'
  if (hour < 18) return 'Good afternoon.'
  return 'Good evening.'
}

const DISCOVER_CARDS = [
  { to: '/people', label: 'People', description: 'Browse everyone in your organization', icon: Users2 },
  { to: '/skills', label: 'Skills', description: 'See the expertise your company holds', icon: Sparkles },
  { to: '/discover', label: 'Discover', description: 'Explore recommendations and hidden experts', icon: Compass },
  { to: '/ask', label: 'Ask ORBIT', description: 'Ask a question, get the right person', icon: Layers },
]

export function HomePage() {
  const dataset = useDataset()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const stats = useMemo(() => {
    if (!dataset) return null
    const locations = new Set(dataset.people.map((p) => p.location))
    return {
      people: dataset.people.length,
      skills: dataset.skills.length,
      teams: dataset.teams.length,
      locations: locations.size,
    }
  }, [dataset])

  function submitSearch(value: string) {
    const trimmed = value.trim()
    if (!trimmed) return
    navigate(`/ask?q=${encodeURIComponent(trimmed)}`)
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-10 sm:px-10 sm:py-14">
      <div>
        <p className="text-sm font-medium text-graphite-soft">{greeting()}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Your organization, understood.</h1>
        <p className="mt-3 max-w-xl text-base text-graphite">
          Discover the people, skills and expertise behind your organization.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <SearchBar
          placeholder="Ask anything about your organization…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submitSearch(query)}
        />
        <div className="flex flex-wrap gap-2">
          {ASK_SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => submitSearch(s)}
              className="rounded-[var(--radius-pill)] border border-border bg-canvas-raised px-3.5 py-1.5 text-[13px] text-graphite transition-colors duration-150 hover:border-accent/40 hover:text-accent-ink"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-graphite-soft">Discover</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {DISCOVER_CARDS.map(({ to, label, description, icon: Icon }) => (
            <Card
              key={to}
              className="cursor-pointer p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-raised)]"
              onClick={() => navigate(to)}
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-[10px] bg-accent-soft text-accent">
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </div>
              <p className="text-[15px] font-semibold text-ink">{label}</p>
              <p className="mt-1 text-[13px] text-graphite">{description}</p>
            </Card>
          ))}
        </div>
      </div>

      {stats && (
        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-graphite-soft">Organization snapshot</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'People', value: stats.people },
              { label: 'Skills', value: stats.skills },
              { label: 'Teams', value: stats.teams },
              { label: 'Locations', value: stats.locations },
            ].map((stat) => (
              <Card key={stat.label} className="p-5">
                <p className="text-2xl font-semibold tracking-tight text-ink">{stat.value}</p>
                <p className="mt-1 text-[13px] text-graphite-soft">{stat.label}</p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
