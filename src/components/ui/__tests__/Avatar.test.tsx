import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Avatar } from '@/components/ui/Avatar'

describe('Avatar', () => {
  it('renders initials when no photo URL is given', () => {
    const { container } = render(<Avatar name="Jordan Rivera" initials="JR" />)
    expect(screen.getByText('JR')).toBeInTheDocument()
    expect(container.querySelector('img')).toBeNull()
  })

  it('renders the photo when a photo URL is given', () => {
    const { container } = render(<Avatar name="Jordan Rivera" initials="JR" photoUrl="https://example.com/jordan.jpg" />)
    const img = container.querySelector('img')
    expect(img).toHaveAttribute('src', 'https://example.com/jordan.jpg')
  })

  it('falls back to initials if the photo fails to load', () => {
    const { container } = render(<Avatar name="Jordan Rivera" initials="JR" photoUrl="https://example.com/broken.jpg" />)
    const img = container.querySelector('img')!
    fireEvent.error(img)
    expect(screen.getByText('JR')).toBeInTheDocument()
  })
})
