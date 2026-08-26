import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '@/App'
import { useOrbitStore } from '@/state/orbitStore'

beforeEach(() => {
  // The store persists to localStorage but keeps its own in-memory state, so tests
  // drive it through its actions (not raw localStorage writes) to stay in sync.
  useOrbitStore.getState().resetOrganization()
})

describe('App routing', () => {
  it('redirects to the welcome page when no organization is loaded', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )
    expect(await screen.findByText('Your organization, understood.')).toBeInTheDocument()
    expect(screen.getAllByText('Explore demo').length).toBeGreaterThan(0)
  })

  it('renders the Home page once a demo dataset is present', async () => {
    useOrbitStore.getState().loadDemo()

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Organization snapshot')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Ask anything about your organization…')).toBeInTheDocument()
  })

  it('shows a 404 state for an unknown route', async () => {
    useOrbitStore.getState().loadDemo()

    render(
      <MemoryRouter initialEntries={['/this-does-not-exist']}>
        <App />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Page not found')).toBeInTheDocument()
  })
})
