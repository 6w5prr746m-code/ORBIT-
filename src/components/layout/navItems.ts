import { Compass, Home, MessageCircle, Settings, ShieldAlert, Sparkles, Users, Users2, type LucideIcon } from 'lucide-react'

export interface NavItemDef {
  to: string
  labelKey: string
  icon: LucideIcon
  end?: boolean
}

export const NAV_ITEMS: NavItemDef[] = [
  { to: '/', labelKey: 'nav.home', icon: Home, end: true },
  { to: '/people', labelKey: 'nav.people', icon: Users },
  { to: '/skills', labelKey: 'nav.skills', icon: Sparkles },
  { to: '/discover', labelKey: 'nav.discover', icon: Compass },
  { to: '/coverage', labelKey: 'nav.coverage', icon: ShieldAlert },
  { to: '/team-builder', labelKey: 'nav.teamBuilder', icon: Users2 },
  { to: '/ask', labelKey: 'nav.ask', icon: MessageCircle },
]

export const SETTINGS_ITEM: NavItemDef = { to: '/settings', labelKey: 'nav.settings', icon: Settings }

export const MOBILE_NAV_ITEMS: NavItemDef[] = [
  { to: '/', labelKey: 'nav.home', icon: Home, end: true },
  { to: '/people', labelKey: 'nav.people', icon: Users },
  { to: '/discover', labelKey: 'nav.discover', icon: Compass },
  { to: '/ask', labelKey: 'nav.ask', icon: MessageCircle },
]
