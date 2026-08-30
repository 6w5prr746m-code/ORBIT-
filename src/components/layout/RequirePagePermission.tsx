import { Navigate, Outlet } from 'react-router-dom'
import { useEffectivePermissions } from '@/hooks/usePermissions'
import type { RolePagePermissions } from '@/types'

/**
 * Guards a page against direct navigation when the signed-in user's
 * effective permissions don't include it — defense in depth alongside
 * the Sidebar/MobileNav already hiding the link. This is a UI/product-
 * tier gate, not a security boundary: the data underneath is still
 * scoped entirely by RLS, unaffected by this.
 */
export function RequirePagePermission({ page }: { page: keyof RolePagePermissions }) {
  const permissions = useEffectivePermissions()
  if (!permissions.pages[page]) return <Navigate to="/" replace />
  return <Outlet />
}
