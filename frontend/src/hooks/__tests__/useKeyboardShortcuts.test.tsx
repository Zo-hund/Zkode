import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useKeyboardShortcuts } from '../useKeyboardShortcuts'
import { fireEvent } from '@testing-library/react'

// Test component using the hook
function TestComponent({ shortcuts }: { shortcuts: any[] }) {
  useKeyboardShortcuts(shortcuts)
  return <div>Keyboard shortcuts active</div>
}

describe('useKeyboardShortcuts Hook', () => {
  it('calls callback when matching key is pressed', () => {
    const callback = vi.fn()
    const shortcuts = [
      {
        key: 'Enter',
        ctrl: true,
        callback,
        description: 'Submit'
      }
    ]

    render(<TestComponent shortcuts={shortcuts} />)

    fireEvent.keyDown(window, { key: 'Enter', ctrlKey: true })

    expect(callback).toHaveBeenCalled()
  })

  it('does not call callback when ctrl modifier is missing', () => {
    const callback = vi.fn()
    const shortcuts = [
      {
        key: 'Enter',
        ctrl: true,
        callback,
        description: 'Submit'
      }
    ]

    render(<TestComponent shortcuts={shortcuts} />)

    fireEvent.keyDown(window, { key: 'Enter' })

    expect(callback).not.toHaveBeenCalled()
  })

  it('handles shift modifier correctly', () => {
    const callback = vi.fn()
    const shortcuts = [
      {
        key: 'S',
        shift: true,
        callback,
        description: 'Save'
      }
    ]

    render(<TestComponent shortcuts={shortcuts} />)

    fireEvent.keyDown(window, { key: 'S', shiftKey: true })

    expect(callback).toHaveBeenCalled()
  })

  it('handles alt modifier correctly', () => {
    const callback = vi.fn()
    const shortcuts = [
      {
        key: 'F',
        alt: true,
        callback,
        description: 'Find'
      }
    ]

    render(<TestComponent shortcuts={shortcuts} />)

    fireEvent.keyDown(window, { key: 'F', altKey: true })

    expect(callback).toHaveBeenCalled()
  })

  it('handles multiple shortcuts', () => {
    const callback1 = vi.fn()
    const callback2 = vi.fn()
    const shortcuts = [
      {
        key: 'Enter',
        ctrl: true,
        callback: callback1,
        description: 'Submit'
      },
      {
        key: 'Escape',
        callback: callback2,
        description: 'Cancel'
      }
    ]

    render(<TestComponent shortcuts={shortcuts} />)

    fireEvent.keyDown(window, { key: 'Enter', ctrlKey: true })
    expect(callback1).toHaveBeenCalled()
    expect(callback2).not.toHaveBeenCalled()

    callback1.mockClear()

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(callback2).toHaveBeenCalled()
    expect(callback1).not.toHaveBeenCalled()
  })

  it('prevents default behavior when shortcut matches', () => {
    const callback = vi.fn()
    const shortcuts = [
      {
        key: 'S',
        ctrl: true,
        callback,
        description: 'Save'
      }
    ]

    render(<TestComponent shortcuts={shortcuts} />)

    const event = new KeyboardEvent('keydown', {
      key: 'S',
      ctrlKey: true,
      bubbles: true,
      cancelable: true
    })
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

    fireEvent(window, event)

    expect(preventDefaultSpy).toHaveBeenCalled()
  })

  it('cleans up event listeners on unmount', () => {
    const callback = vi.fn()
    const shortcuts = [
      {
        key: 'Enter',
        callback,
        description: 'Submit'
      }
    ]

    const { unmount } = render(<TestComponent shortcuts={shortcuts} />)

    fireEvent.keyDown(window, { key: 'Enter' })
    expect(callback).toHaveBeenCalledTimes(1)

    unmount()

    fireEvent.keyDown(window, { key: 'Enter' })
    // Should still be 1, not 2 (listener removed)
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('handles case-insensitive key matching', () => {
    const callback = vi.fn()
    const shortcuts = [
      {
        key: 'a',
        callback,
        description: 'Action'
      }
    ]

    render(<TestComponent shortcuts={shortcuts} />)

    fireEvent.keyDown(window, { key: 'A' })
    expect(callback).toHaveBeenCalled()
  })

  it('supports meta key (Cmd on Mac)', () => {
    const callback = vi.fn()
    const shortcuts = [
      {
        key: 'k',
        ctrl: true,
        callback,
        description: 'Command palette'
      }
    ]

    render(<TestComponent shortcuts={shortcuts} />)

    // Meta key should work as ctrl on Mac
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    expect(callback).toHaveBeenCalled()
  })
})
