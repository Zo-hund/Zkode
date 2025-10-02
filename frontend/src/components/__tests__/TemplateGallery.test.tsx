import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TemplateGallery } from '../TemplateGallery'

describe('TemplateGallery Component', () => {
  const mockOnSelectTemplate = vi.fn()
  const mockOnClose = vi.fn()

  beforeEach(() => {
    mockOnSelectTemplate.mockClear()
    mockOnClose.mockClear()
  })

  it('renders template gallery modal', () => {
    render(
      <TemplateGallery
        onSelectTemplate={mockOnSelectTemplate}
        onClose={mockOnClose}
      />
    )

    expect(screen.getByText('Choose a Template')).toBeInTheDocument()
    expect(screen.getByText('Start with a pre-built template or create from scratch')).toBeInTheDocument()
  })

  it('displays all template options', () => {
    render(
      <TemplateGallery
        onSelectTemplate={mockOnSelectTemplate}
        onClose={mockOnClose}
      />
    )

    expect(screen.getByText('Landing Page')).toBeInTheDocument()
    expect(screen.getByText('Todo App')).toBeInTheDocument()
    expect(screen.getByText('Portfolio')).toBeInTheDocument()
    expect(screen.getByText('Color Picker')).toBeInTheDocument()
    expect(screen.getByText('E-Commerce')).toBeInTheDocument()
    expect(screen.getByText('Blog Layout')).toBeInTheDocument()
  })

  it('shows template descriptions', () => {
    render(
      <TemplateGallery
        onSelectTemplate={mockOnSelectTemplate}
        onClose={mockOnClose}
      />
    )

    expect(screen.getByText('Modern landing page with hero section')).toBeInTheDocument()
    expect(screen.getByText('Task management application')).toBeInTheDocument()
    expect(screen.getByText('Personal portfolio website')).toBeInTheDocument()
  })

  it('calls onSelectTemplate when template is clicked', async () => {
    const user = userEvent.setup()

    render(
      <TemplateGallery
        onSelectTemplate={mockOnSelectTemplate}
        onClose={mockOnClose}
      />
    )

    const todoAppButton = screen.getByText('Todo App').closest('button')
    await user.click(todoAppButton!)

    expect(mockOnSelectTemplate).toHaveBeenCalledWith(
      'Create a todo app with add, delete, and mark complete functionality',
      'html'
    )
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup()

    render(
      <TemplateGallery
        onSelectTemplate={mockOnSelectTemplate}
        onClose={mockOnClose}
      />
    )

    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('has backdrop blur effect', () => {
    const { container } = render(
      <TemplateGallery
        onSelectTemplate={mockOnSelectTemplate}
        onClose={mockOnClose}
      />
    )

    const backdrop = container.firstChild as HTMLElement
    expect(backdrop).toHaveClass('backdrop-blur-sm')
  })

  it('has fade-in animation', () => {
    const { container } = render(
      <TemplateGallery
        onSelectTemplate={mockOnSelectTemplate}
        onClose={mockOnClose}
      />
    )

    const backdrop = container.firstChild as HTMLElement
    expect(backdrop).toHaveClass('animate-fade-in')
  })

  it('template buttons have hover effects', () => {
    const { container } = render(
      <TemplateGallery
        onSelectTemplate={mockOnSelectTemplate}
        onClose={mockOnClose}
      />
    )

    const templateButton = container.querySelector('button.group')
    expect(templateButton).toHaveClass('hover:scale-105')
    expect(templateButton).toHaveClass('hover:border-blue-500')
  })

  it('renders template icons', () => {
    const { container } = render(
      <TemplateGallery
        onSelectTemplate={mockOnSelectTemplate}
        onClose={mockOnClose}
      />
    )

    // Check for icon containers
    const iconContainers = container.querySelectorAll('.bg-blue-600\\/20')
    expect(iconContainers.length).toBeGreaterThan(0)
  })

  it('displays in grid layout', () => {
    const { container } = render(
      <TemplateGallery
        onSelectTemplate={mockOnSelectTemplate}
        onClose={mockOnClose}
      />
    )

    const grid = container.querySelector('.grid')
    expect(grid).toHaveClass('grid-cols-1')
    expect(grid).toHaveClass('md:grid-cols-2')
    expect(grid).toHaveClass('lg:grid-cols-3')
  })
})
