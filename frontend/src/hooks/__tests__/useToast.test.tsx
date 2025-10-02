import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { ToastProvider, useToast } from '../useToast'

// Test component that uses the hook
function TestComponent() {
  const toast = useToast()

  return (
    <div>
      <button onClick={() => toast.success('Success message')}>Show Success</button>
      <button onClick={() => toast.error('Error message')}>Show Error</button>
      <button onClick={() => toast.warning('Warning message')}>Show Warning</button>
      <button onClick={() => toast.info('Info message')}>Show Info</button>
      <button onClick={() => toast.showToast('Custom toast', 'success', 1000)}>Show Custom</button>
    </div>
  )
}

describe('useToast Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('provides toast functions via context', () => {
    const { getByText } = render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    expect(getByText('Show Success')).toBeInTheDocument()
  })

  it('displays success toast when success() is called', () => {
    const { getByText } = render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    act(() => {
      getByText('Show Success').click()
    })

    expect(screen.getByText('Success message')).toBeInTheDocument()
  })

  it('displays error toast when error() is called', () => {
    const { getByText } = render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    act(() => {
      getByText('Show Error').click()
    })

    expect(screen.getByText('Error message')).toBeInTheDocument()
  })

  it('displays warning toast when warning() is called', () => {
    const { getByText } = render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    act(() => {
      getByText('Show Warning').click()
    })

    expect(screen.getByText('Warning message')).toBeInTheDocument()
  })

  it('displays info toast when info() is called', () => {
    const { getByText } = render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    act(() => {
      getByText('Show Info').click()
    })

    expect(screen.getByText('Info message')).toBeInTheDocument()
  })

  it('displays multiple toasts simultaneously', () => {
    const { getByText } = render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    act(() => {
      getByText('Show Success').click()
      getByText('Show Error').click()
    })

    expect(screen.getByText('Success message')).toBeInTheDocument()
    expect(screen.getByText('Error message')).toBeInTheDocument()
  })

  it('removes toast after duration', () => {
    const { getByText } = render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    act(() => {
      getByText('Show Custom').click()
    })

    expect(screen.getByText('Custom toast')).toBeInTheDocument()

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(screen.queryByText('Custom toast')).not.toBeInTheDocument()
  })

  it('renders toasts in fixed top-right position', () => {
    const { container, getByText } = render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    act(() => {
      getByText('Show Success').click()
    })

    const toastContainer = container.querySelector('.fixed.top-4.right-4')
    expect(toastContainer).toBeInTheDocument()
  })

  it('throws error when used outside ToastProvider', () => {
    // Suppress console error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    function InvalidUsage() {
      useToast()
      return null
    }

    expect(() => render(<InvalidUsage />)).toThrow(
      'useToast must be used within ToastProvider'
    )

    consoleSpy.mockRestore()
  })
})
