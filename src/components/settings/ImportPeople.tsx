import { useRef, useState } from 'react'
import { CheckCircle2, ShieldAlert, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useDataset } from '@/hooks/useDataset'
import { useOrbitStore } from '@/state/orbitStore'
import { useEffectivePermissions } from '@/hooks/usePermissions'
import { useToast } from '@/components/ui/Toast'
import { buildImportPayload, buildPreview, CSV_COLUMNS, type ImportPreview } from '@/services/ImportService'

const SAMPLE_CSV = `firstName,lastName,email,jobTitle,department,location,country,skills,photoUrl,entity\nJordan,Rivera,jordan.rivera@example.com,Product Manager,Product,Austin,United States,Product Analytics;Go-To-Market Strategy,https://i.pravatar.cc/300?u=jordan.rivera,Acme US`

type Step = 'upload' | 'preview' | 'success'

export function ImportPeople() {
  const dataset = useDataset()
  const { t } = useTranslation()
  const isDemo = useOrbitStore((s) => s.isDemo)
  const permissions = useEffectivePermissions()
  const importPeople = useOrbitStore((s) => s.importPeople)
  const { push } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('upload')
  const [fileName, setFileName] = useState('')
  const [csvText, setCsvText] = useState('')
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [importedCount, setImportedCount] = useState(0)
  const [importing, setImporting] = useState(false)

  async function handleFile(file: File) {
    const text = await file.text()
    setFileName(file.name)
    setCsvText(text)
    setPreview(buildPreview(text))
    setStep('preview')
  }

  async function handleImport() {
    if (!dataset || !preview) return
    setImporting(true)
    const payload = buildImportPayload(dataset, preview.rows)
    try {
      await importPeople(payload.people, payload.personSkills, payload.personTeams, payload.newSkills, payload.newEntities)
      setImportedCount(payload.people.length)
      setStep('success')
      push({
        kind: 'success',
        title: t('import.success.title'),
        description: t('import.success.toastDescription', { count: payload.people.length, orgName: dataset.organization.name }),
      })
    } catch (err) {
      push({
        kind: 'error',
        title: t('import.error.title'),
        description: err instanceof Error ? err.message : t('import.error.default'),
      })
    } finally {
      setImporting(false)
    }
  }

  if (isDemo) {
    return (
      <Card className="flex flex-col items-center gap-3 p-8 text-center">
        <Upload className="h-8 w-8 text-graphite-soft" strokeWidth={1.5} />
        <h3 className="text-base font-semibold text-ink">{t('import.demo.title')}</h3>
        <p className="max-w-sm text-sm text-graphite">{t('import.demo.description')}</p>
      </Card>
    )
  }

  if (!permissions.actions.importData) {
    return (
      <Card className="flex flex-col items-center gap-3 p-8 text-center">
        <ShieldAlert className="h-8 w-8 text-graphite-soft" strokeWidth={1.5} />
        <h3 className="text-base font-semibold text-ink">{t('import.notAuthorized.title')}</h3>
        <p className="max-w-sm text-sm text-graphite">{t('import.notAuthorized.description')}</p>
      </Card>
    )
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
        <h3 className="text-base font-semibold text-ink">{t('import.success.title')}</h3>
        <p className="text-sm text-graphite">{t('import.success.person', { count: importedCount })}</p>
        <Button variant="secondary" size="sm" onClick={reset} className="mt-2">
          {t('import.success.importMore')}
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
              {t('import.preview.rowsReady', { valid: preview.validRowCount, total: preview.rows.length })}
            </p>
          </div>
          <Badge variant={preview.errors.length > 0 ? 'default' : 'success'}>
            {preview.errors.length > 0 ? t('import.preview.issues', { count: preview.errors.length }) : t('import.preview.allValid')}
          </Badge>
        </div>

        {hasBlockingError ? (
          <p className="text-sm text-danger">{preview.errors[0]?.message ?? t('import.preview.unreadable')}</p>
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
            {t('import.preview.cancel')}
          </Button>
          <Button
            variant="accent"
            size="sm"
            onClick={handleImport}
            disabled={hasBlockingError || preview.validRowCount === 0 || importing}
          >
            {importing ? t('import.preview.importing') : t('import.preview.importAction', { count: preview.validRowCount })}
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
      <h3 className="text-base font-semibold text-ink">{t('import.upload.title')}</h3>
      <p className="max-w-sm text-sm text-graphite">{t('import.upload.description', { columns: CSV_COLUMNS.join(', ') })}</p>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => fileInputRef.current?.click()}>
          {t('import.upload.chooseFile')}
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
          {t('import.upload.useSample')}
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
      {csvText === '' && <p className="text-xs text-graphite-soft">{t('import.upload.dragDrop')}</p>}
    </Card>
  )
}
