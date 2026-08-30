import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { MOBILE_NAV_ITEMS } from './navItems'
import { useEffectivePermissions } from '@/hooks/usePermissions'

export function MobileNav() {
  const { t } = useTranslation()
  const permissions = useEffectivePermissions()
  const navItems = MOBILE_NAV_ITEMS.filter((item) => !item.permissionKey || permissions.pages[item.permissionKey])
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-border bg-canvas-raised/95 px-2 py-2 backdrop-blur lg:hidden">
      {navItems.map(({ to, labelKey, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              'flex flex-1 flex-col items-center gap-1 rounded-[var(--radius-control)] py-1.5 text-[11px] font-medium transition-colors',
              isActive ? 'text-ink' : 'text-graphite-soft',
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.1 : 1.75} />
              {t(labelKey)}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
