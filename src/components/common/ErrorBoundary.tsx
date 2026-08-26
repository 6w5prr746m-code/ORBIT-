import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { withTranslation, type WithTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'

interface Props extends WithTranslation {
  children: ReactNode
}

interface State {
  error: Error | null
}

class ErrorBoundaryBase extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ORBIT encountered an unexpected error', error, info)
  }

  render() {
    if (this.state.error) {
      const { t } = this.props
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas px-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger/10">
            <AlertTriangle className="h-5 w-5 text-danger" strokeWidth={1.75} />
          </div>
          <h1 className="text-lg font-semibold text-ink">{t('errorBoundary.title')}</h1>
          <p className="max-w-sm text-sm text-graphite">{t('errorBoundary.description')}</p>
          <Button variant="accent" onClick={() => window.location.reload()}>
            {t('errorBoundary.reload')}
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}

export const ErrorBoundary = withTranslation()(ErrorBoundaryBase)
