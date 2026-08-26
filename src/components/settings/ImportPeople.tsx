import { useRef, useState } from 'react'
import { CheckCircle2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useDataset } from '@/hooks/useDataset'
import { useOrbitStore } from '@/state/orbitStore'
import { useToast } from '@/components/ui/Toast'
import { buildImportPayload, buildPreview, CSV_COLUMNS, type ImportPreview } from '@/services/ImportService'

const SAMPLE_CSV = `firstName,lastName,email,jobTitle,department,location,country,skills\nJordan,Rivera,jordan.rivera@example.com,Product Manager,Product,Austin,United States,Product Analytics;Go-To-Market Strategy`

type Step = 'upload' | 'preview' | 'success'

export function ImportPeople() {
  const dataset = useDataset()
  const importPeople = useOrbitStore((s) => s.importPeople)
  const { push } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('upload')
  const [fileName, setFileName] = useState('')
  const [csvText, setCsvText] = useState('')
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [importedCount, setImportedCount] = useState(0)

  async function handleFile(file: File) {
    const text = await file.text()
    setFileName(file.name)
    setCsvText(text)
    setPreview(buildPreview(text))
    setStep('preview')
  }

  function handleImport() {
    if (!dataset || !preview) return
    const payload = buildImportPayload(dataset, preview.rows)
    importPeople(payload.people, payload.personSkills, payload.personTeams, payload.newSkills)
    setImportedCount(payload.people.length)
    setStep('success')
    push({
      kind: 'success',
      title: 'Import complete',
      description: `${payload.people.length} ${payload.people.length === 1 ? 'person' : 'people'} added to ${dataset.organization.name}.`,
    })
  }

  function reset() {
    setStep('upload')
    setFileName('')
    setCsvText('')
    setPreview(null)
  }

  if (step === 'success') {
    return (
      <Card className="flex flex-col items-center gap-3 p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
          <CheckCircle2 className="h-5 w-5 text-success" />
        </div>
        <h3 className="text-base font-semibold text-ink">Import complete</h3>
        <p className="text-sm text-graphite">
          {importedCount} {importedCount === 1 ? 'person was' : 'people were'} added to your organization.
        </p>
        <Button variant="secondary" size="sm" onClick={reset} className="mt-2">
          Import more
        </Button>
      </Card>
    )
  }

  if (step === 'preview' && preview) {
    const hasBlockingError = preview.rows.length === 0
    return (
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-ink">{fileName}</p>
            <p className="text-xs text-graphite-soft">
              {preview.validRowCount} of {preview.rows.length} rows ready to import
            </p>
          </div>
          <Badge variant={preview.errors.length > 0 ? 'default' : 'success'}>
            {preview.errors.length > 0 ? `${preview.errors.length} issues` : 'All valid'}
          </Badge>
        </div>

        {hasBlockingError ? (
          <p className="text-sm text-danger">{preview.errors[0]?.message ?? 'This file could not be read.'}</p>
        ) : (
          <div className="mb-4 max-h-64 overflow-auto rounded-[var(--radius-control)] border border-border">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-mist text-graphite">
                <tr>
                  {CSV_COLUMNS.map((c) => (
                    <th key={c} className="whitespace-nowrap px-3 py-2 font-medium">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.slice(0, 8).map((row) => (
                  <tr key={row.rowNumber} className="border-t border-border">
                    {CSV_COLUMNS.map((c) => (
                      <td key={c} className="whitespace-nowrap px-3 py-2 text-graphite">
                        {row.values[c] || '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={reset}>
            Cancel
          </Button>
          <Button variant="accent" size="sm" onClick={handleImport} disabled={hasBlockingError || preview.validRowCount === 0}>
            Import {preview.validRowCount} {preview.validRowCount === 1 ? 'person' : 'people'}
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card
      className="flex flex-col items-center gap-3 border-dashed p-10 text-center"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        const file = e.dataTransfer.files[0]
        if (file) void handleFile(file)
      }}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-mist">
        <Upload className="h-5 w-5 text-graphite" strokeWidth={1.75} />
      </div>
      <h3 className="text-base font-semibold text-ink">Import organization</h3>
      <p className="max-w-sm text-sm text-graphite">
        Upload a CSV with columns: {CSV_COLUMNS.join(', ')}. Separate multiple skills with a semicolon.
      </p>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => fileInputRef.current?.click()}>
          Choose CSV file
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setFileName('sample-import.csv')
            setCsvText(SAMPLE_CSV)
            setPreview(buildPreview(SAMPLE_CSV))
            setStep('preview')
          }}
        >
          Use sample file
        </Button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file)
        }}
      />
      {csvText === '' && <p className="text-xs text-graphite-soft">or drag and drop a file here</p>}
    </Card>
  )
}
