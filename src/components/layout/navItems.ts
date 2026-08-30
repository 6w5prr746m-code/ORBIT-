import { Compass, Home, MessageCircle, Settings, ShieldAlert, Sparkles, Users, Users2, type LucideIcon } from 'lucide-react'
import type { RolePagePermissions } from '@/types'

export interface NavItemDef {
  to: string
  labelKey: string
  icon: LucideIcon
  end?: boolean
  /** Which RolePagePermissions key gates this item; omit for always-visible items (Home, People, Settings). */
  permissionKey?: keyof RolePagePermissions
}

export const NAV_ITEMS: NavItemDef[] = [
  { to: '/', labelKey: 'nav.home', icon: Home, end: true },
  { to: '/people', labelKey: 'nav.people', icon: Users },
  { to: '/skills', labelKey: 'nav.skills', icon: Sparkles, permissionKey: 'skills' },
  { to: '/discover', labelKey: 'nav.discover', icon: Compass, permissionKey: 'discover' },
  { to: '/coverage', labelKey: 'nav.coverage', icon: ShieldAlert, permissionKey: 'coverage' },
  { to: '/team-builder', labelKey: 'nav.teamBuilder', icon: Users2, permissionKey: 'teamBuilder' },
  { to: '/ask', labelKey: 'nav.ask', icon: MessageCircle, permissionKey: 'ask' },
]

export const SETTINGS_ITEM: NavItemDef = { to: '/settings', labelKey: 'nav.settings', icon: Settings }

export const MOBILE_NAV_ITEMS: NavItemDef[] = [
  { to: '/', labelKey: 'nav.home', icon: Home, end: true },
  { to: '/people', labelKey: 'nav.people', icon: Users },
  { to: '/discover', labelKey: 'nav.discover', icon: Compass, permissionKey: 'discover' },
  { to: '/ask', labelKey: 'nav.ask', icon: MessageCircle, permissionKey: 'ask' },
]
