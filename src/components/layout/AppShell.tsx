import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'

export function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <main className="flex-1 pb-20 lg:pb-0">
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
