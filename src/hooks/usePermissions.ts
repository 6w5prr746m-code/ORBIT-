import { DEFAULT_SCOPED_PERMISSIONS, FULL_PERMISSIONS, type Membership, type RolePermissions } from '@/types'
import { useAuthStore } from '@/state/authStore'
import { useDataset } from '@/hooks/useDataset'

const FULL_ACCESS_ROLES: Membership['role'][] = ['owner', 'hr_admin', 'member']

/**
 * The signed-in user's effective permissions in the active organization —
 * which pages they can see, which admin actions they can take.
 *
 * Legacy full-access roles (owner/hr_admin/member) always get
 * FULL_PERMISSIONS. director/manager/collaborator get DEFAULT_SCOPED_PERMISSIONS
 * unless their membership carries a custom_role_id (only possible once
 * organization_features.advanced_permissions_enabled is true — the custom
 * roles UI is itself gated on that flag), in which case that role's own
 * permissions apply instead. This is a UI/product-tier gate, not a
 * security boundary: who can see which *person* is still governed
 * entirely by can_view_person() (0009_rbac.sql), unaffected by any of this.
 */
export function useEffectivePermissions(): RolePermissions {
  const dataset = useDataset()
  const user = useAuthStore((s) => s.user)
  const membership = dataset?.memberships.find((m) => m.userId === user?.id)

  if (!membership) return DEFAULT_SCOPED_PERMISSIONS
  if (FULL_ACCESS_ROLES.includes(membership.role)) return FULL_PERMISSIONS
  if (membership.customRoleId) {
    const customRole = dataset?.customRoles.find((r) => r.id === membership.customRoleId)
    if (customRole) return customRole.permissions
  }
  return DEFAULT_SCOPED_PERMISSIONS
}
