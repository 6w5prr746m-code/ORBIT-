import { useEffect, useState } from 'react'
import { Navigate, Outlet, useNavigate } from 'react-router-dom'
import { useOrbitStore } from '@/state/orbitStore'
import { useAuthStore } from '@/state/authStore'
import { FullPageSpinner } from '@/components/common/FullPageSpinner'

/**
 * Guards the main app. Three cases:
 *  - a dataset is already loaded (demo or real) → render the app
 *  - no dataset, but a session exists → try to resume the user's own organization
 *  - neither → send them to the welcome flow
 */
export function RequireDataset() {
  const dataset = useOrbitStore((s) => s.dataset)
  const loading = useOrbitStore((s) => s.loading)
  const loadMyOrganization = useOrbitStore((s) => s.loadMyOrganization)
  const { session, user, initialized } = useAuthStore()
  const navigate = useNavigate()
  const [resuming, setResuming] = useState(false)
  const [attempted, setAttempted] = useState(false)

  useEffect(() => {
    if (!initialized || dataset || resuming || attempted) return
    if (!session || !user) return

    setResuming(true)
    loadMyOrganization()
      .then((result) => {
        setAttempted(true)
        setResuming(false)
        if (result === 'none') navigate('/onboarding', { replace: true })
      })
      .catch(() => {
        setAttempted(true)
        setResuming(false)
      })
  }, [initialized, session, user, dataset, resuming, attempted, loadMyOrganization, navigate])

  if (!initialized || loading || resuming) return <FullPageSpinner />
  if (!dataset) return <Navigate to="/welcome" replace />
  return <Outlet />
}
