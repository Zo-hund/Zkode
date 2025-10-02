import { useState, useRef, useEffect } from 'react'
import { Editor } from '@monaco-editor/react'
import { Play, Download, Sparkles, Code, Eye, Palette, Settings, Zap, User, LogOut } from 'lucide-react'
import { useAuth } from './hooks/useAuth.tsx'
import { AuthModal } from './components/Auth/AuthModal'
import { ErrorBoundary } from './components/ErrorBoundary'
import { apiEndpoints } from './config/env'
import { analytics } from './utils/analytics'

interface GeneratedFiles {
  [key: string]: string
}

function App() {
  const [prompt, setPrompt] = useState('')
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFiles>({})
  const [currentFile, setCurrentFile] = useState('index.html')
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor')
  const [projectName, setProjectName] = useState('')
  const [selectedModel, setSelectedModel] = useState('balanced')
  const [selectedFramework, setSelectedFramework] = useState('html')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const previewRef = useRef<HTMLIFrameElement>(null)
  const { user, logout } = useAuth()

  // Track page view on component mount
  useEffect(() => {
    analytics.trackPageView('main_app');
    analytics.trackSessionEvent('start');

    // Track page visibility changes for session tracking
    const handleVisibilityChange = () => {
      if (document.hidden) {
        analytics.trackSessionEvent('idle');
      } else {
        analytics.trackSessionEvent('active');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      analytics.trackSessionEvent('end');
    };
  }, []);

  // Track model and framework changes
  useEffect(() => {
    analytics.trackPreferenceChange('ai_model', 'balanced', selectedModel);
  }, [selectedModel]);

  useEffect(() => {
    analytics.trackPreferenceChange('framework', 'html', selectedFramework);
  }, [selectedFramework]);

  // Auto-update preview when generated files change
  useEffect(() => {
    if (generatedFiles['index.html']) {
      updatePreview();
    }
  }, [generatedFiles]);

  const generateCode = async () => {
    if (!prompt.trim()) return

    const startTime = Date.now();
    setIsGenerating(true)

    // Track AI generation request
    analytics.trackAIGeneration(prompt, selectedFramework, selectedModel);

    try {
      const response = await fetch(apiEndpoints.ai.generate, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          framework: selectedFramework,
          model: selectedModel
        })
      })

      const result = await response.json()
      const duration = Date.now() - startTime;

      if (result.response) {
        try {
          const parsed = JSON.parse(result.response)
          setGeneratedFiles(parsed.files || {})
          setCurrentFile(Object.keys(parsed.files || {})[0] || 'index.html')
          setProjectName(parsed.description?.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() || 'my-project')

          // Track successful generation
          analytics.trackAIGenerationResult(true, duration);
          analytics.trackFeatureUsage('ai_code_generation', `${selectedFramework}_${selectedModel}`);
        } catch (parseError) {
          setGeneratedFiles({
            'index.html': result.response
          })

          // Track partial success
          analytics.trackAIGenerationResult(true, duration);
        }
      } else {
        // Track generation failure
        analytics.trackAIGenerationResult(false, duration, 'No response received');
      }
    } catch (error) {
      console.error('Generation failed:', error)
      const duration = Date.now() - startTime;

      // Track generation error
      analytics.trackAIGenerationResult(false, duration, error instanceof Error ? error.message : 'Unknown error');
      analytics.trackError(error instanceof Error ? error.message : 'Generation failed', 'generateCode');
    }
    setIsGenerating(false)
  }

  const updatePreview = () => {
    if (!previewRef.current || !generatedFiles['index.html']) return

    // Track preview update
    analytics.trackFeatureUsage('preview_update', 'manual');

    const htmlContent = generatedFiles['index.html']
    const cssContent = generatedFiles['style.css'] || ''
    const jsContent = generatedFiles['script.js'] || ''

    const fullHtml = htmlContent.includes('<html>')
      ? htmlContent.replace('</head>', `<style>${cssContent}</style></head>`).replace('</body>', `<script>${jsContent}</script></body>`)
      : `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Preview</title>
          <style>${cssContent}</style>
        </head>
        <body>
          ${htmlContent}
          <script>${jsContent}</script>
        </body>
        </html>
      `

    const blob = new Blob([fullHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    previewRef.current.src = url
  }

  const deployProject = async () => {
    if (!generatedFiles || !projectName) return

    // Track deployment attempt
    analytics.trackFeatureUsage('project_deployment', 'manual');

    try {
      const response = await fetch(apiEndpoints.deploy, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: generatedFiles, name: projectName })
      })

      const result = await response.json()
      if (result.success) {
        analytics.trackProjectAction('deploy_success', projectName);
        window.open(result.url, '_blank')
      } else {
        analytics.trackProjectAction('deploy_failed', projectName);
      }
    } catch (error) {
      console.error('Deployment failed:', error)
      analytics.trackError(error instanceof Error ? error.message : 'Deployment failed', 'deployProject');
    }
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-dark-950 text-white">
      {/* Header */}
      <header className="border-b border-dark-800 bg-dark-900">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Code className="w-8 h-8 text-blue-400" />
              <h1 className="text-2xl font-bold gradient-text">ZKode</h1>
              <span className="text-gray-400 text-sm">AI Vibe Coding</span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  analytics.trackButtonClick('deploy_project', 'header');
                  deployProject();
                }}
                disabled={!generatedFiles['index.html']}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Deploy</span>
              </button>

              {user ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 text-gray-300">
                    <User className="w-4 h-4" />
                    <span className="text-sm">{user.name}</span>
                  </div>
                  <button
                    onClick={() => {
                      analytics.trackButtonClick('logout', 'header');
                      logout();
                    }}
                    className="flex items-center space-x-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Logout</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    analytics.trackButtonClick('sign_in', 'header');
                    setShowAuthModal(true);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <div className="w-80 bg-dark-900 border-r border-dark-800 flex flex-col">
          <div className="p-4 border-b border-dark-800">
            <h2 className="font-semibold mb-3 flex items-center">
              <Sparkles className="w-4 h-4 mr-2 text-yellow-400" />
              Describe Your Vibe
            </h2>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Create a modern todo app with dark theme and animations..."
              className="w-full h-32 p-3 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {/* Framework Selection */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Settings className="w-4 h-4 inline mr-2" />
                Framework
              </label>
              <select
                value={selectedFramework}
                onChange={(e) => setSelectedFramework(e.target.value)}
                className="w-full p-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="html">HTML + CSS + JS</option>
                <option value="react">React</option>
                <option value="vue">Vue.js</option>
              </select>
            </div>

            {/* AI Model Selection */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Zap className="w-4 h-4 inline mr-2" />
                AI Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full p-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="fast">⚡ Fast - Quick generation</option>
                <option value="balanced">⚖️ Balanced - Best overall</option>
                <option value="creative">🎨 Creative - More artistic</option>
                <option value="code">💻 Code - Advanced logic</option>
              </select>
            </div>

            <button
              onClick={generateCode}
              disabled={isGenerating || !prompt.trim()}
              className="w-full mt-4 flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {isGenerating ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              <span>{isGenerating ? 'Generating...' : 'Generate Code'}</span>
            </button>
          </div>

          {Object.keys(generatedFiles).length > 0 && (
            <div className="flex-1 p-4">
              <h3 className="font-semibold mb-3 text-gray-300">Files</h3>
              <div className="space-y-1">
                {Object.keys(generatedFiles).map((filename) => (
                  <button
                    key={filename}
                    onClick={() => setCurrentFile(filename)}
                    className={`w-full text-left p-2 rounded text-sm transition-colors ${
                      currentFile === filename
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-dark-800'
                    }`}
                  >
                    {filename}
                  </button>
                ))}
              </div>

              <button
                onClick={updatePreview}
                className="w-full mt-4 flex items-center justify-center space-x-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-sm"
              >
                <Eye className="w-4 h-4" />
                <span>Update Preview</span>
              </button>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-dark-800 bg-dark-900">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'editor'
                  ? 'border-blue-400 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Code className="w-4 h-4 inline mr-2" />
              Editor
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'preview'
                  ? 'border-blue-400 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Eye className="w-4 h-4 inline mr-2" />
              Preview
            </button>
          </div>

          {/* Content */}
          <div className="flex-1">
            {activeTab === 'editor' ? (
              <div className="h-full">
                {generatedFiles[currentFile] ? (
                  <Editor
                    height="100%"
                    language={
                      currentFile.endsWith('.html') ? 'html' :
                      currentFile.endsWith('.css') ? 'css' :
                      currentFile.endsWith('.js') ? 'javascript' : 'plaintext'
                    }
                    value={generatedFiles[currentFile]}
                    onChange={(value) => {
                      if (value !== undefined) {
                        setGeneratedFiles(prev => ({
                          ...prev,
                          [currentFile]: value
                        }))
                      }
                    }}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: 'on',
                      wordWrap: 'on',
                      automaticLayout: true,
                    }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <Palette className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg mb-2">Ready to create something amazing?</p>
                      <p className="text-sm">Describe your idea and watch the magic happen</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full bg-white">
                {generatedFiles['index.html'] ? (
                  <iframe
                    ref={previewRef}
                    className="w-full h-full border-0"
                    title="Preview"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500 bg-dark-950">
                    <div className="text-center">
                      <Eye className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg mb-2">No preview available</p>
                      <p className="text-sm">Generate some code first to see the preview</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          analytics.trackButtonClick('close_auth_modal', 'modal');
          setShowAuthModal(false);
        }}
      />
      </div>
    </ErrorBoundary>
  )
}

export default App