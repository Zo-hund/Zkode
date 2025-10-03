import { useState, useRef, useEffect } from 'react'
import { Editor } from '@monaco-editor/react'
import { 
  Play, Download, Sparkles, Code, Eye, Palette, Settings, Zap, 
  User, LogOut, ChevronLeft, ChevronRight, Layers, Keyboard,
  Monitor, Smartphone, Tablet, Maximize, Minimize, RefreshCw,
  Star, Heart, Share2, Copy, CheckCircle, AlertCircle,
  Cpu, Wand2, Rocket, Globe, GitBranch
} from 'lucide-react'
import { useAuth } from './hooks/useAuth.tsx'
import { useToast } from './hooks/useToast.tsx'
import { useKeyboardShortcuts, ShortcutsHelp } from './hooks/useKeyboardShortcuts.tsx'
import { AuthModal } from './components/Auth/AuthModal'
import { ErrorBoundary } from './components/ErrorBoundary'
import { LoadingSpinner } from './components/LoadingSpinner'
import { TemplateGallery } from './components/TemplateGallery'
import { apiEndpoints } from './config/env'
import { analytics } from './utils/analytics'

interface GeneratedFiles {
  [key: string]: string
}

type PreviewMode = 'desktop' | 'tablet' | 'mobile'

function App() {
  const [prompt, setPrompt] = useState('')
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFiles>({})
  const [currentFile, setCurrentFile] = useState('index.html')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor')
  const [projectName, setProjectName] = useState('')
  const [selectedModel, setSelectedModel] = useState('balanced')
  const [selectedFramework, setSelectedFramework] = useState('html')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showTemplateGallery, setShowTemplateGallery] = useState(false)
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null)
  const [lastGenerationTime, setLastGenerationTime] = useState<number | null>(null)
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)
  const previewRef = useRef<HTMLIFrameElement>(null)
  const { user, logout } = useAuth()
  const toast = useToast()

  const handleSelectTemplate = (templatePrompt: string, framework: string) => {
    setPrompt(templatePrompt)
    setSelectedFramework(framework)
    toast.info('Template selected! Click Generate to create your project.')
  }

  // Define keyboard shortcuts
  const shortcuts = [
    {
      key: 'Enter',
      ctrl: true,
      callback: () => {
        if (prompt.trim() && !isGenerating) {
          generateCode()
        }
      },
      description: 'Generate code'
    },
    {
      key: 'b',
      ctrl: true,
      callback: () => setIsSidebarCollapsed(!isSidebarCollapsed),
      description: 'Toggle sidebar'
    },
    {
      key: 'p',
      ctrl: true,
      callback: () => setActiveTab(activeTab === 'editor' ? 'preview' : 'editor'),
      description: 'Toggle preview'
    },
    {
      key: 't',
      ctrl: true,
      callback: () => setShowTemplateGallery(true),
      description: 'Open templates'
    },
    {
      key: '/',
      ctrl: true,
      callback: () => setShowShortcutsHelp(true),
      description: 'Show shortcuts'
    }
  ]

  useKeyboardShortcuts(shortcuts)

  // Cleanup blob URL on component unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl)
      }
    }
  }, [previewBlobUrl])

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
    setGenerationProgress(0)
    setShowSuccessAnimation(false)

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        const increment = Math.random() * 15 + 5
        return prev + increment > 90 ? 90 : prev + increment
      })
    }, 500)

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
      
      clearInterval(progressInterval)
      setGenerationProgress(100)
      setLastGenerationTime(duration)

      if (result.response) {
        try {
          const parsed = JSON.parse(result.response)
          setGeneratedFiles(parsed.files || {})
          setCurrentFile(Object.keys(parsed.files || {})[0] || 'index.html')
          setProjectName(parsed.description?.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() || 'my-project')

          // Track successful generation
          analytics.trackAIGenerationResult(true, duration);
          analytics.trackFeatureUsage('ai_code_generation', `${selectedFramework}_${selectedModel}`);

          // Show success animation and toast
          setShowSuccessAnimation(true)
          setTimeout(() => setShowSuccessAnimation(false), 2000)
          toast.success(`Code generated in ${(duration / 1000).toFixed(1)}s! 🎉`)
        } catch (parseError) {
          setGeneratedFiles({
            'index.html': result.response
          })

          // Track partial success
          analytics.trackAIGenerationResult(true, duration);
          toast.success(`Code generated in ${(duration / 1000).toFixed(1)}s!`)
        }
      } else {
        // Track generation failure
        analytics.trackAIGenerationResult(false, duration, 'No response received');
        toast.error('No response received from AI. Please try again.')
      }
    } catch (error) {
      console.error('Generation failed:', error)
      const duration = Date.now() - startTime;
      clearInterval(progressInterval)

      // Track generation error
      analytics.trackAIGenerationResult(false, duration, error instanceof Error ? error.message : 'Unknown error');
      analytics.trackError(error instanceof Error ? error.message : 'Generation failed', 'generateCode');

      // Show error toast
      toast.error(error instanceof Error ? error.message : 'Failed to generate code. Please try again.')
    }
    
    setTimeout(() => {
      setIsGenerating(false)
      setGenerationProgress(0)
    }, 500)
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

    // Revoke old blob URL before creating new one to prevent memory leaks
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl)
    }

    const blob = new Blob([fullHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    setPreviewBlobUrl(url)

    if (previewRef.current) {
      previewRef.current.src = url
    }
  }

  const downloadProject = () => {
    if (!generatedFiles) {
      toast.error('No files to download')
      return
    }

    analytics.trackFeatureUsage('project_download', 'manual')

    try {
      // Create a bundled HTML file with inline CSS and JS
      const htmlContent = generatedFiles['index.html'] || ''
      const cssContent = generatedFiles['style.css'] || ''
      const jsContent = generatedFiles['script.js'] || ''

      const bundledHtml = htmlContent
        .replace('</head>', `<style>${cssContent}</style></head>`)
        .replace('</body>', `<script>${jsContent}</script></body>`)

      // Create blob and trigger download
      const blob = new Blob([bundledHtml], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${projectName || 'zkode-project'}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('Project downloaded! 🎉')
      analytics.trackProjectAction('download_success', projectName || 'unnamed')
    } catch (error) {
      console.error('Download failed:', error)
      toast.error('Download failed. Please try again.')
      analytics.trackError(error instanceof Error ? error.message : 'Download failed', 'downloadProject')
    }
  }

  const getPreviewDimensions = () => {
    switch (previewMode) {
      case 'mobile': return 'w-80 h-[640px]'
      case 'tablet': return 'w-[768px] h-[1024px]'
      default: return 'w-full h-full'
    }
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-dark-950 text-white relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-float" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        </div>

        {/* Success Animation Overlay */}
        {showSuccessAnimation && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-dark-800/90 backdrop-blur-xl rounded-3xl p-8 flex flex-col items-center space-y-4 animate-scale-in-bounce">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center animate-pulse-glow">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold text-white mb-2">Code Generated Successfully!</h3>
                <p className="text-gray-300 text-sm">Your amazing creation is ready ✨</p>
                {lastGenerationTime && (
                  <p className="text-gray-400 text-xs mt-1">Generated in {(lastGenerationTime / 1000).toFixed(1)}s</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Header */}
        <header className="relative border-b border-dark-800/50 bg-dark-900/80 backdrop-blur-xl animate-slide-in-top">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl blur-lg opacity-75 animate-pulse-glow" />
                  <div className="relative bg-dark-800 p-2 rounded-xl">
                    <Wand2 className="w-8 h-8 text-blue-400" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold gradient-text font-display">ZKode</h1>
                  <p className="text-gray-400 text-sm font-medium">AI-Powered Development Studio</p>
                </div>
                {generatedFiles['index.html'] && (
                  <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium">
                    <CheckCircle className="w-3 h-3" />
                    <span>Project Ready</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                {/* Keyboard shortcuts */}
                <button
                  onClick={() => setShowShortcutsHelp(true)}
                  className="hidden md:flex items-center space-x-2 px-3 py-2.5 text-gray-300 hover:text-white hover:bg-dark-700/50 rounded-xl transition-all duration-200 hover:scale-105 glass"
                  title="Keyboard shortcuts (Ctrl+/)"
                >
                  <Keyboard className="w-4 h-4" />
                  <span className="text-sm font-medium">Shortcuts</span>
                </button>

                {/* Download button */}
                <button
                  onClick={() => {
                    analytics.trackButtonClick('download_project', 'header');
                    downloadProject();
                  }}
                  disabled={!generatedFiles['index.html']}
                  className="btn-success flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>

                {/* Deploy button */}
                {generatedFiles['index.html'] && (
                  <button
                    onClick={() => {
                      // TODO: Implement deploy functionality
                      toast.info('Deploy feature coming soon! 🚀');
                    }}
                    className="hidden sm:flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl transition-all duration-200 transform hover:scale-105 font-medium text-sm"
                  >
                    <Rocket className="w-4 h-4" />
                    <span>Deploy</span>
                  </button>
                )}

                {/* User menu */}
                {user ? (
                  <div className="flex items-center space-x-3">
                    <div className="hidden sm:flex items-center space-x-2 px-3 py-2 bg-dark-800/50 rounded-xl">
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-xs font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-300">{user.name}</span>
                    </div>
                    <button
                      onClick={() => {
                        analytics.trackButtonClick('logout', 'header');
                        logout();
                      }}
                      className="flex items-center space-x-2 px-3 py-2.5 text-gray-300 hover:text-white hover:bg-dark-700/50 rounded-xl transition-all duration-200 hover:scale-105"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="hidden sm:inline text-sm font-medium">Logout</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      analytics.trackButtonClick('sign_in', 'header');
                      setShowAuthModal(true);
                    }}
                    className="btn-primary flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm"
                  >
                    <User className="w-4 h-4" />
                    <span>Sign In</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex h-[calc(100vh-89px)] relative">
          {/* Enhanced Sidebar */}
          <div className={`relative bg-dark-900/80 backdrop-blur-xl border-r border-dark-800/50 flex flex-col transition-all duration-500 ease-out ${
            isSidebarCollapsed ? 'w-0 opacity-0 -translate-x-full' : 'w-96 opacity-100 translate-x-0'
          } animate-slide-in-left`}>
            <div className="absolute inset-0 bg-gradient-to-br from-dark-800/20 to-transparent pointer-events-none" />
          <div className="p-4 border-b border-dark-800">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold flex items-center">
                <Sparkles className="w-4 h-4 mr-2 text-yellow-400" />
                Describe Your Vibe
              </h2>
              <button
                onClick={() => setShowTemplateGallery(true)}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-600/20 text-purple-400 hover:bg-purple-600 hover:text-white rounded-md transition-colors"
                title="Browse templates"
              >
                <Layers className="w-3 h-3" />
                Templates
              </button>
            </div>
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
              className="w-full mt-4 flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isGenerating ? (
                <LoadingSpinner size="sm" />
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

          {/* Enhanced Sidebar Toggle Button */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="absolute left-0 top-6 z-20 bg-dark-800/80 backdrop-blur-sm hover:bg-dark-700/80 p-3 rounded-r-2xl border border-l-0 border-dark-700/50 transition-all duration-500 transform hover:scale-110 shadow-lg group"
            style={{
              left: isSidebarCollapsed ? '0' : '24rem',
              transition: 'left 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            title={isSidebarCollapsed ? 'Show sidebar (Ctrl+B)' : 'Hide sidebar (Ctrl+B)'}
          >
            <div className="relative">
              {isSidebarCollapsed ? (
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              ) : (
                <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
            </div>
          </button>

          {/* Enhanced Main Content */}
          <div className="flex-1 flex flex-col bg-dark-925/50 backdrop-blur-sm">
            {/* Enhanced Tabs with Preview Controls */}
            <div className="flex items-center justify-between border-b border-dark-800/50 bg-dark-900/50 backdrop-blur-xl px-6 py-3">
              <div className="flex space-x-1">
                <button
                  onClick={() => setActiveTab('editor')}
                  className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                    activeTab === 'editor'
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-dark-700/50'
                  }`}
                >
                  <Code className="w-4 h-4" />
                  <span>Editor</span>
                </button>
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                    activeTab === 'preview'
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-dark-700/50'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview</span>
                </button>
              </div>
              
              {/* Preview Controls */}
              {activeTab === 'preview' && generatedFiles['index.html'] && (
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 bg-dark-700/50 rounded-lg p-1">
                    {[
                      { mode: 'desktop' as PreviewMode, icon: Monitor, label: 'Desktop' },
                      { mode: 'tablet' as PreviewMode, icon: Tablet, label: 'Tablet' },
                      { mode: 'mobile' as PreviewMode, icon: Smartphone, label: 'Mobile' }
                    ].map(({ mode, icon: Icon, label }) => (
                      <button
                        key={mode}
                        onClick={() => setPreviewMode(mode)}
                        className={`p-2 rounded-md transition-all duration-200 ${
                          previewMode === mode
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-dark-600'
                        }`}
                        title={label}
                      >
                        <Icon className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="p-2 rounded-lg bg-dark-700/50 text-gray-400 hover:text-white hover:bg-dark-600 transition-all duration-200"
                    title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                  >
                    {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </div>

            {/* Enhanced Content Area */}
            <div className={`flex-1 relative ${
              isFullscreen ? 'fixed inset-0 z-50 bg-dark-950' : ''
            }`}>
              {activeTab === 'editor' ? (
                <div className="h-full relative">
                  {generatedFiles[currentFile] ? (
                    <div className="h-full">
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
                          minimap: { enabled: window.innerWidth > 1024 },
                          fontSize: 14,
                          lineNumbers: 'on',
                          wordWrap: 'on',
                          automaticLayout: true,
                          fontFamily: 'JetBrains Mono, Fira Code, monospace',
                          fontLigatures: true,
                          cursorBlinking: 'smooth',
                          smoothScrolling: true,
                          scrollBeyondLastLine: false,
                          renderWhitespace: 'selection',
                          bracketPairColorization: { enabled: true },
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5" />
                      <div className="text-center relative z-10 animate-fade-in">
                        <div className="relative mb-6">
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-2xl opacity-20 animate-float" />
                          <Wand2 className="w-20 h-20 mx-auto relative z-10 text-gray-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3 font-display">Ready to Create Magic?</h3>
                        <p className="text-gray-400 mb-6 max-w-md mx-auto leading-relaxed">
                          Describe your vision in the sidebar and watch as AI transforms your ideas into beautiful, functional code.
                        </p>
                        <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                            <span>AI-Powered</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                            <span>Instant Preview</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
                            <span>One-Click Deploy</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative overflow-hidden">
                  {generatedFiles['index.html'] ? (
                    <div className={`${previewMode === 'desktop' ? 'w-full h-full' : 'flex items-center justify-center w-full h-full'}`}>
                      <div className={`${getPreviewDimensions()} mx-auto relative`}>
                        {previewMode !== 'desktop' && (
                          <div className="absolute -top-8 left-0 text-xs text-gray-500 font-medium capitalize">
                            {previewMode} Preview
                          </div>
                        )}
                        <div className={`${previewMode !== 'desktop' ? 'rounded-2xl overflow-hidden shadow-2xl border-4 border-gray-300' : 'w-full h-full'}`}>
                          <iframe
                            ref={previewRef}
                            className="w-full h-full border-0 bg-white"
                            title="Preview"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center relative z-10 animate-fade-in">
                      <div className="relative mb-6">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-cyan-500 rounded-full blur-2xl opacity-20 animate-float" />
                        <Eye className="w-20 h-20 mx-auto relative z-10 text-gray-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-dark-800 mb-3 font-display">Preview Awaits</h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto leading-relaxed">
                        Generate some code first to see your creation come to life with live preview.
                      </p>
                      <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-200 rounded-full text-sm text-gray-600">
                        <Sparkles className="w-4 h-4" />
                        <span>Live preview updates automatically</span>
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

      {/* Template Gallery */}
      {showTemplateGallery && (
        <TemplateGallery
          onSelectTemplate={handleSelectTemplate}
          onClose={() => setShowTemplateGallery(false)}
        />
      )}

      {/* Keyboard Shortcuts Help */}
      <ShortcutsHelp
        shortcuts={shortcuts}
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
      />
      </div>
    </ErrorBoundary>
  )
}

export default App