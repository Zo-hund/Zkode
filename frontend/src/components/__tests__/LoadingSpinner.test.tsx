import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LoadingSpinner, LoadingOverlay } from '../LoadingSpinner'

describe('LoadingSpinner Component', () => {
  it('renders spinner with default size', () => {
    const { container } = render(<LoadingSpinner />)
    const spinner = container.querySelector('.w-6')
    expect(spinner).toBeInTheDocument()
  })

  it('renders spinner with small size', () => {
    const { container } = render(<LoadingSpinner size="sm" />)
    const spinner = container.querySelector('.w-4')
    expect(spinner).toBeInTheDocument()
  })

  it('renders spinner with large size', () => {
    const { container } = render(<LoadingSpinner size="lg" />)
    const spinner = container.querySelector('.w-8')
    expect(spinner).toBeInTheDocument()
  })

  it('renders with text when provided', () => {
    render(<LoadingSpinner text="Loading data..." />)
    expect(screen.getByText('Loading data...')).toBeInTheDocument()
  })

  it('does not render text when not provided', () => {
    const { container } = render(<LoadingSpinner />)
    expect(container.querySelector('.text-sm')).not.toBeInTheDocument()
  })

  it('applies spin animation class', () => {
    const { container } = render(<LoadingSpinner />)
    const spinner = container.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })
})

describe('LoadingOverlay Component', () => {
  it('renders overlay with default message', () => {
    render(<LoadingOverlay />)
    expect(screen.getByText('Generating your code...')).toBeInTheDocument()
  })

  it('renders overlay with custom message', () => {
    render(<LoadingOverlay message="Processing request..." />)
    expect(screen.getByText('Processing request...')).toBeInTheDocument()
  })

  it('has backdrop blur styling', () => {
    const { container } = render(<LoadingOverlay />)
    const overlay = container.firstChild as HTMLElement
    expect(overlay).toHaveClass('backdrop-blur-sm')
    expect(overlay).toHaveClass('bg-dark-950/80')
  })

  it('displays pulsing secondary text', () => {
    render(<LoadingOverlay />)
    expect(screen.getByText('This may take a moment...')).toBeInTheDocument()
  })

  it('centers content vertically and horizontally', () => {
    const { container } = render(<LoadingOverlay />)
    const overlay = container.firstChild as HTMLElement
    expect(overlay).toHaveClass('flex')
    expect(overlay).toHaveClass('items-center')
    expect(overlay).toHaveClass('justify-center')
  })

  it('applies fade-in animation', () => {
    const { container } = render(<LoadingOverlay />)
    const overlay = container.firstChild as HTMLElement
    expect(overlay).toHaveClass('animate-fade-in')
  })
})
