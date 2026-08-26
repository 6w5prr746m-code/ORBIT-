import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES } from '@/i18n'

export function LanguageSwitcher({ className }: { className?: string }) {
  const { t, i18n } = useTranslation()

  return (
    <select
      value={i18n.resolvedLanguage ?? i18n.language}
      onChange={(e) => void i18n.changeLanguage(e.target.value)}
      className={`h-9 rounded-[var(--radius-control)] border border-border bg-canvas-raised px-3 text-sm text-ink focus-visible:outline-none focus:border-accent ${className ?? ''}`}
      aria-label={t('settings.workspace.language')}
    >
      {SUPPORTED_LANGUAGES.map((lng) => (
        <option key={lng} value={lng}>
          {t(`languages.${lng}`)}
        </option>
      ))}
    </select>
  )
}
