import { Navigate, Outlet } from 'react-router-dom'
import { useOrbitStore } from '@/state/orbitStore'

/** Guards the main app: without an organization dataset loaded, send people to the welcome flow. */
export function RequireDataset() {
  const dataset = useOrbitStore((s) => s.dataset)
  if (!dataset) return <Navigate to="/welcome" replace />
  return <Outlet />
}
