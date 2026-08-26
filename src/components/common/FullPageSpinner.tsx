import { Orbit } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function FullPageSpinner() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-canvas">
      <Orbit className="h-8 w-8 animate-spin text-graphite-soft" strokeWidth={1.5} />
      <p className="text-sm text-graphite-soft">{t('fullPageSpinner.loading')}</p>
    </div>
  )
}
