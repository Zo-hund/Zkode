import { useEffect } from 'react'

interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
  alt?: boolean
  callback: () => void
  description: string
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const matchingShortcut = shortcuts.find(shortcut => {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase()
        const ctrlMatches = !shortcut.ctrl || (event.ctrlKey || event.metaKey)
        const shiftMatches = !shortcut.shift || event.shiftKey
        const altMatches = !shortcut.alt || event.altKey

        return keyMatches && ctrlMatches && shiftMatches && altMatches
      })

      if (matchingShortcut) {
        event.preventDefault()
        matchingShortcut.callback()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [shortcuts])
}

// Keyboard shortcuts help component
interface ShortcutsHelpProps {
  shortcuts: KeyboardShortcut[]
  isOpen: boolean
  onClose: () => void
}

export function ShortcutsHelp({ shortcuts, isOpen, onClose }: ShortcutsHelpProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
      <div className="bg-dark-900 rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
          <h2 className="text-xl font-bold text-white">Keyboard Shortcuts</h2>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {shortcuts.map((shortcut, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-gray-300">{shortcut.description}</span>
                <kbd className="px-2 py-1 bg-dark-800 border border-dark-700 rounded text-sm text-gray-400">
                  {shortcut.ctrl && <span className="mr-1">Ctrl +</span>}
                  {shortcut.shift && <span className="mr-1">Shift +</span>}
                  {shortcut.alt && <span className="mr-1">Alt +</span>}
                  {shortcut.key.toUpperCase()}
                </kbd>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-dark-800 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
