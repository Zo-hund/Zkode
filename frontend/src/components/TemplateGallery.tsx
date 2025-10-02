import { FileCode, Layout, Sparkles, Palette, ShoppingCart, Globe } from 'lucide-react'

interface Template {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  prompt: string
  framework: string
}

const templates: Template[] = [
  {
    id: 'landing-page',
    name: 'Landing Page',
    description: 'Modern landing page with hero section',
    icon: <Layout className="w-6 h-6" />,
    prompt: 'Create a modern landing page with a hero section, features grid, and call-to-action',
    framework: 'html'
  },
  {
    id: 'todo-app',
    name: 'Todo App',
    description: 'Task management application',
    icon: <FileCode className="w-6 h-6" />,
    prompt: 'Create a todo app with add, delete, and mark complete functionality',
    framework: 'html'
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    description: 'Personal portfolio website',
    icon: <Sparkles className="w-6 h-6" />,
    prompt: 'Create a personal portfolio website with projects showcase and about section',
    framework: 'html'
  },
  {
    id: 'color-picker',
    name: 'Color Picker',
    description: 'Interactive color tool',
    icon: <Palette className="w-6 h-6" />,
    prompt: 'Create a color picker tool with RGB, HEX, and HSL values',
    framework: 'html'
  },
  {
    id: 'ecommerce',
    name: 'E-Commerce',
    description: 'Product showcase page',
    icon: <ShoppingCart className="w-6 h-6" />,
    prompt: 'Create an e-commerce product page with image gallery and add to cart',
    framework: 'html'
  },
  {
    id: 'blog',
    name: 'Blog Layout',
    description: 'Clean blog interface',
    icon: <Globe className="w-6 h-6" />,
    prompt: 'Create a blog layout with article cards and sidebar',
    framework: 'html'
  }
]

interface TemplateGalleryProps {
  onSelectTemplate: (prompt: string, framework: string) => void
  onClose: () => void
}

export function TemplateGallery({ onSelectTemplate, onClose }: TemplateGalleryProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
      <div className="bg-dark-900 rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
          <h2 className="text-2xl font-bold text-white">Choose a Template</h2>
          <p className="text-blue-100 text-sm mt-1">Start with a pre-built template or create from scratch</p>
        </div>

        {/* Template Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => {
                  onSelectTemplate(template.prompt, template.framework)
                  onClose()
                }}
                className="group p-4 bg-dark-800 hover:bg-dark-700 border border-dark-700 hover:border-blue-500 rounded-lg transition-all transform hover:scale-105 text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    {template.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">{template.name}</h3>
                    <p className="text-gray-400 text-sm">{template.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-dark-800 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-dark-800 hover:bg-dark-700 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
