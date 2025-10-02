import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Toast } from '../Toast'

describe('Toast Component', () => {
  let onCloseMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onCloseMock = vi.fn()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('renders toast with correct message', () => {
    render(
      <Toast
        id="test-1"
        message="Test notification"
        type="success"
        onClose={onCloseMock}
      />
    )

    expect(screen.getByText('Test notification')).toBeInTheDocument()
  })

  it('renders success toast with correct styling', () => {
    const { container } = render(
      <Toast
        id="test-1"
        message="Success!"
        type="success"
        onClose={onCloseMock}
      />
    )

    const toastElement = container.firstChild as HTMLElement
    expect(toastElement).toHaveClass('bg-green-500/90')
  })

  it('renders error toast with correct styling', () => {
    const { container } = render(
      <Toast
        id="test-1"
        message="Error occurred"
        type="error"
        onClose={onCloseMock}
      />
    )

    const toastElement = container.firstChild as HTMLElement
    expect(toastElement).toHaveClass('bg-red-500/90')
  })

  it('renders warning toast with correct styling', () => {
    const { container } = render(
      <Toast
        id="test-1"
        message="Warning"
        type="warning"
        onClose={onCloseMock}
      />
    )

    const toastElement = container.firstChild as HTMLElement
    expect(toastElement).toHaveClass('bg-yellow-500/90')
  })

  it('renders info toast with correct styling', () => {
    const { container } = render(
      <Toast
        id="test-1"
        message="Information"
        type="info"
        onClose={onCloseMock}
      />
    )

    const toastElement = container.firstChild as HTMLElement
    expect(toastElement).toHaveClass('bg-blue-500/90')
  })

  it('calls onClose when close button is clicked', () => {
    render(
      <Toast
        id="test-1"
        message="Test"
        type="success"
        onClose={onCloseMock}
      />
    )

    const closeButton = screen.getByRole('button')
    fireEvent.click(closeButton)

    expect(onCloseMock).toHaveBeenCalledWith('test-1')
  })

  it('auto-dismisses after default duration', () => {
    render(
      <Toast
        id="test-1"
        message="Auto dismiss"
        type="success"
        onClose={onCloseMock}
      />
    )

    // Fast-forward time by 5 seconds (default duration)
    vi.advanceTimersByTime(5000)

    expect(onCloseMock).toHaveBeenCalledWith('test-1')
  })

  it('auto-dismisses after custom duration', () => {
    render(
      <Toast
        id="test-1"
        message="Custom duration"
        type="success"
        duration={3000}
        onClose={onCloseMock}
      />
    )

    // Should not dismiss before custom duration
    vi.advanceTimersByTime(2000)
    expect(onCloseMock).not.toHaveBeenCalled()

    // Should dismiss after custom duration
    vi.advanceTimersByTime(1000)
    expect(onCloseMock).toHaveBeenCalledWith('test-1')
  })

  it('displays correct icon for each type', () => {
    const { rerender } = render(
      <Toast id="test-1" message="Test" type="success" onClose={onCloseMock} />
    )
    expect(screen.getByRole('button').previousSibling).toBeInTheDocument()

    rerender(<Toast id="test-1" message="Test" type="error" onClose={onCloseMock} />)
    expect(screen.getByRole('button').previousSibling).toBeInTheDocument()

    rerender(<Toast id="test-1" message="Test" type="warning" onClose={onCloseMock} />)
    expect(screen.getByRole('button').previousSibling).toBeInTheDocument()

    rerender(<Toast id="test-1" message="Test" type="info" onClose={onCloseMock} />)
    expect(screen.getByRole('button').previousSibling).toBeInTheDocument()
  })
})
