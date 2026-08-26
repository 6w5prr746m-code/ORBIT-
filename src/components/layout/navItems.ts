import { Compass, Home, MessageCircle, Settings, Sparkles, Users, type LucideIcon } from 'lucide-react'

export interface NavItemDef {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

export const NAV_ITEMS: NavItemDef[] = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/people', label: 'People', icon: Users },
  { to: '/skills', label: 'Skills', icon: Sparkles },
  { to: '/discover', label: 'Discover', icon: Compass },
  { to: '/ask', label: 'Ask', icon: MessageCircle },
]

export const SETTINGS_ITEM: NavItemDef = { to: '/settings', label: 'Settings', icon: Settings }

export const MOBILE_NAV_ITEMS: NavItemDef[] = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/people', label: 'People', icon: Users },
  { to: '/discover', label: 'Discover', icon: Compass },
  { to: '/ask', label: 'Ask', icon: MessageCircle },
]
