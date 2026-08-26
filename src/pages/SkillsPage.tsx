import { useMemo, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useDataset } from '@/hooks/useDataset'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { PageHeader } from '@/components/common/PageHeader'
import { SearchBar } from '@/components/common/SearchBar'
import { SkillCard } from '@/components/skills/SkillCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { normalizeQuery } from '@/services/SearchService'
import type { SkillCategory } from '@/types'

const CATEGORIES: SkillCategory[] = ['Technology', 'Business', 'Language', 'Design', 'Operations', 'Leadership']

export function SkillsPage() {
  const dataset = useDataset()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<SkillCategory | ''>('')
  const debouncedQuery = useDebouncedValue(query, 150)

  const peopleCountBySkill = useMemo(() => {
    if (!dataset) return new Map<string, number>()
    const counts = new Map<string, number>()
    for (const ps of dataset.personSkills) counts.set(ps.skillId, (counts.get(ps.skillId) ?? 0) + 1)
    return counts
  }, [dataset])

  const filteredSkills = useMemo(() => {
    if (!dataset) return []
    let skills = dataset.skills
    if (category) skills = skills.filter((s) => s.category === category)
    if (debouncedQuery.trim()) {
      const q = normalizeQuery(debouncedQuery)
      skills = skills.filter((s) => normalizeQuery(s.name).includes(q))
    }
    return [...skills].sort((a, b) => (peopleCountBySkill.get(b.id) ?? 0) - (peopleCountBySkill.get(a.id) ?? 0))
  }, [dataset, category, debouncedQuery, peopleCountBySkill])

  if (!dataset) return null

  return (
    <div>
      <PageHeader
        eyebrow={`${dataset.skills.length} skills`}
        title="Skills"
        description="What does your organization know?"
      />

      <div className="flex flex-col gap-4 px-6 py-6 sm:px-10">
        <SearchBar placeholder="Search skills…" value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-xl" />

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategory('')}
            className={`rounded-[var(--radius-pill)] border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
              category === '' ? 'border-ink bg-ink text-canvas' : 'border-border bg-canvas-raised text-graphite hover:text-ink'
            }`}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-[var(--radius-pill)] border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                category === c ? 'border-ink bg-ink text-canvas' : 'border-border bg-canvas-raised text-graphite hover:text-ink'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {filteredSkills.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No skills found yet."
            description="Import your organization to start discovering expertise."
            actionLabel="Import people"
            onAction={() => navigate('/settings')}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredSkills.map((skill) => (
              <SkillCard key={skill.id} skill={skill} peopleCount={peopleCountBySkill.get(skill.id) ?? 0} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
