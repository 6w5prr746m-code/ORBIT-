import { describe, expect, it, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { fakeSupabase } from '@/test/fakeSupabase'

vi.mock('@/lib/supabaseClient', () => ({ supabase: fakeSupabase }))

const { default: App } = await import('@/App')
const { useOrbitStore } = await import('@/state/orbitStore')

beforeEach(() => {
  useOrbitStore.getState().clear()
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
    await useOrbitStore.getState().loadDemo()

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Organization snapshot')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Ask anything about your organization…')).toBeInTheDocument()
  })

  it('shows a 404 state for an unknown route', async () => {
    await useOrbitStore.getState().loadDemo()

    render(
      <MemoryRouter initialEntries={['/this-does-not-exist']}>
        <App />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Page not found')).toBeInTheDocument()
  })
})
