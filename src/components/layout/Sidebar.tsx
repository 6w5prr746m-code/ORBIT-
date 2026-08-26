import { NavLink } from 'react-router-dom'
import { Orbit } from 'lucide-react'
import { cn, initials } from '@/lib/utils'
import { NAV_ITEMS, SETTINGS_ITEM, type NavItemDef } from './navItems'
import { useDataset } from '@/hooks/useDataset'
import { Avatar } from '@/components/ui/Avatar'

function NavItem({ to, label, icon: Icon, end }: NavItemDef) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-sm font-medium transition-colors duration-150',
          isActive ? 'bg-ink text-canvas' : 'text-graphite hover:bg-mist hover:text-ink',
        )
      }
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
      {label}
    </NavLink>
  )
}

export function Sidebar() {
  const dataset = useDataset()

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-canvas-raised px-4 py-6 lg:flex">
      <div className="flex items-center gap-2 px-2 pb-8">
        <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-ink text-canvas">
          <Orbit className="h-4 w-4" strokeWidth={2} />
        </div>
        <span className="text-[15px] font-semibold tracking-tight text-ink">ORBIT</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      <div className="flex flex-col gap-1 border-t border-border pt-4">
        <NavItem {...SETTINGS_ITEM} />
        {dataset && (
          <div className="mt-2 flex items-center gap-3 rounded-[var(--radius-control)] px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-mist text-xs font-semibold text-graphite">
              {initials(dataset.organization.name, '')}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-ink">{dataset.organization.name}</p>
              <p className="truncate text-[11px] text-graphite-soft">{dataset.organization.industry}</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-3 px-3 py-2">
          <Avatar name="You" initials="Y" size={28} />
          <p className="text-[13px] font-medium text-ink">You</p>
        </div>
      </div>
    </aside>
  )
}
