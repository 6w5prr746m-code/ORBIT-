import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CornerDownLeft, Sparkles } from 'lucide-react'
import { useDataset } from '@/hooks/useDataset'
import { PageHeader } from '@/components/common/PageHeader'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { initials } from '@/lib/utils'
import { askOrbit, ASK_SUGGESTIONS, type AskResult } from '@/services/AskService'

interface ConversationTurn {
  id: string
  question: string
  result: AskResult
}

function scoreTone(score: number): string {
  if (score >= 75) return 'text-success'
  if (score >= 45) return 'text-accent-ink'
  return 'text-graphite'
}

export function AskPage() {
  const dataset = useDataset()
  const [searchParams, setSearchParams] = useSearchParams()
  const [input, setInput] = useState('')
  const [turns, setTurns] = useState<ConversationTurn[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const askedInitialQuery = useRef(false)

  function ask(question: string) {
    if (!dataset || !question.trim()) return
    const result = askOrbit(dataset, question)
    setTurns((prev) => [...prev, { id: crypto.randomUUID(), question, result }])
    setInput('')
  }

  useEffect(() => {
    const initialQuery = searchParams.get('q')
    if (initialQuery && dataset && !askedInitialQuery.current) {
      askedInitialQuery.current = true
      ask(initialQuery)
      setSearchParams({}, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataset, searchParams])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [turns])

  if (!dataset) return null

  return (
    <div className="mx-auto flex max-w-3xl flex-col px-6 pb-6 pt-2 sm:px-10">
      <PageHeader title="Ask Orbit" description="Ask anything about your organization." />

      <div className="py-6">
        {turns.length === 0 ? (
          <div className="flex flex-col items-center gap-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">
              <Sparkles className="h-6 w-6" strokeWidth={1.75} />
            </div>
            <p className="max-w-sm text-sm text-graphite">
              Ask a question in plain language. ORBIT searches real profiles and skills — every answer explains why.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {ASK_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  className="rounded-[var(--radius-pill)] border border-border bg-canvas-raised px-3.5 py-1.5 text-[13px] text-graphite transition-colors hover:border-accent/40 hover:text-accent-ink"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {turns.map((turn) => (
              <div key={turn.id} className="flex flex-col gap-4">
                <div className="self-end rounded-[var(--radius-card)] rounded-br-sm bg-ink px-4 py-2.5 text-sm text-canvas">
                  {turn.question}
                </div>

                <div className="flex flex-col gap-3">
                  <p className="text-[15px] text-ink">{turn.result.summary}</p>

                  {turn.result.results.length > 0 && (
                    <div className="flex flex-col gap-3">
                      {turn.result.results.map((r) => (
                        <Card key={r.person.id} className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <Link to={`/people/${r.person.id}`} className="flex min-w-0 items-center gap-3">
                              <Avatar
                                name={`${r.person.firstName} ${r.person.lastName}`}
                                initials={initials(r.person.firstName, r.person.lastName)}
                                size={40}
                              />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-ink">
                                  {r.person.firstName} {r.person.lastName}
                                </p>
                                <p className="truncate text-xs text-graphite">
                                  {r.person.jobTitle} · {r.person.location}
                                </p>
                              </div>
                            </Link>
                            {r.score > 0 && (
                              <span className={`shrink-0 text-sm font-semibold ${scoreTone(r.score)}`}>{r.score}%</span>
                            )}
                          </div>
                          {r.explanations.length > 0 && (
                            <ul className="mt-3 flex flex-wrap gap-1.5">
                              {r.explanations.map((e, i) => (
                                <li key={i}>
                                  <Badge variant={e.kind === 'fact' ? 'accent' : 'outline'}>{e.text}</Badge>
                                </li>
                              ))}
                            </ul>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          ask(input)
        }}
        className="sticky bottom-2 flex items-center gap-2 rounded-[var(--radius-card)] border border-border bg-canvas-raised p-2 shadow-[var(--shadow-raised)]"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about your organization…"
          className="h-11 flex-1 bg-transparent px-3 text-[15px] text-ink placeholder:text-graphite-soft focus-visible:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          aria-label="Send"
          className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] bg-ink text-canvas transition-opacity disabled:opacity-30"
        >
          <CornerDownLeft className="h-4 w-4" />
        </button>
      </form>
    </div>
  )
}
