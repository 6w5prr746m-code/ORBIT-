import { Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { RequireDataset } from '@/components/layout/RequireDataset'
import { RequirePagePermission } from '@/components/layout/RequirePagePermission'
import { HomePage } from '@/pages/HomePage'
import { PeoplePage } from '@/pages/PeoplePage'
import { PersonProfilePage } from '@/pages/PersonProfilePage'
import { ProfilePage } from '@/pages/ProfilePage'
import { SkillsPage } from '@/pages/SkillsPage'
import { SkillPage } from '@/pages/SkillPage'
import { DiscoverPage } from '@/pages/DiscoverPage'
import { CoveragePage } from '@/pages/CoveragePage'
import { TeamBuilderPage } from '@/pages/TeamBuilderPage'
import { AskPage } from '@/pages/AskPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { LandingPage } from '@/pages/LandingPage'
import { AuthPage } from '@/pages/AuthPage'
import { AcceptInvitePage } from '@/pages/AcceptInvitePage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

function App() {
  return (
    <Routes>
      <Route path="/welcome" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/invite/:token" element={<AcceptInvitePage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />

      <Route element={<RequireDataset />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/people" element={<PeoplePage />} />
          <Route path="/people/:personId" element={<PersonProfilePage />} />
          <Route path="/me" element={<ProfilePage />} />

          <Route element={<RequirePagePermission page="skills" />}>
            <Route path="/skills" element={<SkillsPage />} />
            <Route path="/skills/:skillId" element={<SkillPage />} />
          </Route>
          <Route element={<RequirePagePermission page="discover" />}>
            <Route path="/discover" element={<DiscoverPage />} />
          </Route>
          <Route element={<RequirePagePermission page="coverage" />}>
            <Route path="/coverage" element={<CoveragePage />} />
          </Route>
          <Route element={<RequirePagePermission page="teamBuilder" />}>
            <Route path="/team-builder" element={<TeamBuilderPage />} />
          </Route>
          <Route element={<RequirePagePermission page="ask" />}>
            <Route path="/ask" element={<AskPage />} />
          </Route>

          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
