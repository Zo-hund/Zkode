// AI Service for ZKode - Enhanced multi-provider AI system with specialized models

export class AIService {
  constructor(env) {
    this.env = env;

    // Cloudflare AI models (primary)
    this.cloudflareModels = {
      'fast': '@cf/meta/llama-3.1-8b-instruct',
      'balanced': '@cf/meta/llama-3.1-70b-instruct',
      'creative': '@cf/mistral/mistral-7b-instruct-v0.1',
      'code': '@cf/deepseek-ai/deepseek-coder-6.7b-base-awq',
      'code-advanced': '@cf/meta/llama-3.1-70b-instruct',
      'vision': '@cf/meta/llama-3.2-11b-vision-instruct',
      'reasoning': '@cf/meta/llama-3.1-70b-instruct'
    };

    // External API models (if API keys available)
    this.externalModels = {
      'claude-3-5-sonnet': { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
      'gpt-4': { provider: 'openai', model: 'gpt-4-1106-preview' },
      'gpt-4-turbo': { provider: 'openai', model: 'gpt-4-turbo-preview' },
      'gemini-pro': { provider: 'google', model: 'gemini-1.5-pro' },
      'claude-3-haiku': { provider: 'anthropic', model: 'claude-3-haiku-20240307' }
    };

    // Model categories for specialized tasks
    this.modelCategories = {
      coding: ['code', 'code-advanced', 'claude-3-5-sonnet', 'gpt-4'],
      design: ['creative', 'claude-3-5-sonnet', 'gpt-4-turbo'],
      performance: ['fast', 'claude-3-haiku'],
      advanced: ['balanced', 'reasoning', 'claude-3-5-sonnet', 'gpt-4'],
      vision: ['vision'],
      general: ['balanced', 'fast']
    };

    // Model capabilities
    this.modelCapabilities = {
      'fast': { tokens: 4096, strength: 'speed', weakness: 'complexity' },
      'balanced': { tokens: 8192, strength: 'general', weakness: 'speed' },
      'creative': { tokens: 4096, strength: 'creativity', weakness: 'code' },
      'code': { tokens: 4096, strength: 'programming', weakness: 'design' },
      'code-advanced': { tokens: 8192, strength: 'complex-code', weakness: 'speed' },
      'vision': { tokens: 4096, strength: 'image-analysis', weakness: 'text-only' },
      'reasoning': { tokens: 8192, strength: 'logic', weakness: 'speed' },
      'claude-3-5-sonnet': { tokens: 200000, strength: 'everything', weakness: 'cost' },
      'gpt-4': { tokens: 128000, strength: 'reasoning', weakness: 'cost' },
      'gpt-4-turbo': { tokens: 128000, strength: 'speed+quality', weakness: 'cost' },
      'gemini-pro': { tokens: 2000000, strength: 'context', weakness: 'availability' },
      'claude-3-haiku': { tokens: 200000, strength: 'speed+cost', weakness: 'complexity' }
    };
  }

  /**
   * Generate system prompt based on framework and user intent
   */
  generateSystemPrompt(framework, userPrompt) {
    const basePrompt = `You are ZKode, an expert AI coding assistant that creates beautiful, functional web applications.

Your task: Create a complete ${framework} application based on the user's description.

CRITICAL REQUIREMENTS:
1. Return ONLY a valid JSON object with this exact structure:
{
  "files": {
    "index.html": "complete HTML content",
    "style.css": "complete CSS styling",
    "script.js": "complete JavaScript functionality"
  },
  "description": "Brief description of the app",
  "framework": "${framework}",
  "features": ["feature1", "feature2", "feature3"]
}

2. Code Quality Standards:
   - Use modern, semantic HTML5
   - Implement responsive design with CSS Grid/Flexbox
   - Write clean, commented JavaScript
   - Include proper error handling
   - Add accessibility features (ARIA labels, alt text)
   - Use CSS custom properties for theming

3. Design Requirements:
   - Create visually appealing, modern interfaces
   - Use attractive color schemes and typography
   - Add smooth animations and transitions
   - Ensure mobile-first responsive design
   - Include hover effects and interactive elements

4. Functionality:
   - Make the app fully functional, not just a mockup
   - Add meaningful interactivity
   - Include form validation where applicable
   - Implement local storage for data persistence
   - Add keyboard navigation support`;

    // Add framework-specific instructions
    if (framework === 'react') {
      return basePrompt + `

5. React-Specific Requirements:
   - Use functional components with hooks
   - Implement proper state management
   - Add error boundaries
   - Use modern React patterns (useState, useEffect)
   - Include TypeScript interfaces if applicable`;
    }

    if (framework === 'vue') {
      return basePrompt + `

5. Vue-Specific Requirements:
   - Use Vue 3 Composition API
   - Implement reactive data binding
   - Add proper component lifecycle
   - Use Vue directives effectively
   - Include proper event handling`;
    }

    return basePrompt + `

5. Vanilla JavaScript Requirements:
   - Use modern ES6+ features
   - Implement modular code structure
   - Add proper event listeners
   - Use async/await for API calls
   - Include proper DOM manipulation`;
  }

  /**
   * Get all available models with their details
   */
  getAvailableModels() {
    const models = {};

    // Add Cloudflare models
    Object.keys(this.cloudflareModels).forEach(key => {
      models[key] = {
        ...this.modelCapabilities[key],
        provider: 'cloudflare',
        available: true,
        cost: 'free'
      };
    });

    // Add external models (check for API keys)
    Object.keys(this.externalModels).forEach(key => {
      const config = this.externalModels[key];
      const hasApiKey = this.hasApiKey(config.provider);

      models[key] = {
        ...this.modelCapabilities[key],
        provider: config.provider,
        available: hasApiKey,
        cost: 'paid'
      };
    });

    return models;
  }

  /**
   * Check if API key is available for external provider
   */
  hasApiKey(provider) {
    const apiKeys = {
      'anthropic': this.env.ANTHROPIC_API_KEY,
      'openai': this.env.OPENAI_API_KEY,
      'google': this.env.GOOGLE_API_KEY
    };
    return !!apiKeys[provider];
  }

  /**
   * Get recommended models for specific task types
   */
  getRecommendedModels(taskType, userPreferences = {}) {
    const category = this.modelCategories[taskType] || this.modelCategories.general;
    const availableModels = this.getAvailableModels();

    return category
      .filter(modelKey => availableModels[modelKey]?.available)
      .map(modelKey => ({
        key: modelKey,
        ...availableModels[modelKey],
        recommended: true
      }));
  }

  /**
   * Enhanced prompt analysis with task categorization
   */
  analyzePrompt(prompt) {
    const promptLower = prompt.toLowerCase();

    // Determine task categories
    const taskIndicators = {
      coding: ['function', 'algorithm', 'api', 'backend', 'frontend', 'javascript', 'react', 'vue', 'html', 'css'],
      design: ['beautiful', 'stunning', 'modern', 'sleek', 'elegant', 'ui', 'ux', 'design', 'layout', 'theme'],
      complex: ['complex', 'advanced', 'sophisticated', 'enterprise', 'dashboard', 'admin', 'management', 'system'],
      widget: ['widget', 'component', 'button', 'form', 'modal', 'dropdown', 'chart', 'graph', 'calendar'],
      game: ['game', 'interactive', 'animation', 'canvas', 'player', 'score', 'level'],
      ecommerce: ['shop', 'cart', 'product', 'payment', 'checkout', 'store', 'marketplace'],
      social: ['social', 'chat', 'message', 'user', 'profile', 'feed', 'comment', 'like']
    };

    const detectedTasks = [];
    const scores = {};

    Object.entries(taskIndicators).forEach(([task, indicators]) => {
      const score = indicators.reduce((sum, indicator) => {
        return sum + (promptLower.includes(indicator) ? 1 : 0);
      }, 0);
      scores[task] = score;
      if (score > 0) detectedTasks.push(task);
    });

    // Determine primary task
    const primaryTask = Object.entries(scores).reduce((a, b) => scores[a[1]] > scores[b[1]] ? a : b)[0];

    // Estimate complexity
    const complexityScore = scores.complex + (prompt.length > 200 ? 1 : 0) + detectedTasks.length;
    const complexity = complexityScore > 3 ? 'high' : complexityScore > 1 ? 'medium' : 'low';

    // Select best model category
    let modelCategory = 'general';
    if (scores.coding > 1) modelCategory = 'coding';
    else if (scores.design > 1) modelCategory = 'design';
    else if (complexity === 'high') modelCategory = 'advanced';
    else if (scores.complex === 0 && complexity === 'low') modelCategory = 'performance';

    // Get recommended models
    const recommendedModels = this.getRecommendedModels(modelCategory);
    const selectedModel = recommendedModels[0]?.key || 'balanced';

    return {
      model: selectedModel,
      primaryTask,
      detectedTasks,
      complexity,
      modelCategory,
      recommendedModels,
      scores,
      estimatedTokens: prompt.length * 4
    };
  }

  /**
   * Generate application code using AI (enhanced multi-provider)
   */
  async generateApplication(prompt, framework = 'html', modelPreference = null) {
    try {
      const analysis = this.analyzePrompt(prompt);
      const selectedModel = modelPreference || analysis.model;
      const systemPrompt = this.generateSystemPrompt(framework, prompt);

      console.log(`🤖 Using model: ${selectedModel} for ${analysis.primaryTask} task (complexity: ${analysis.complexity})`);

      let response;

      // Use external API if model is external, otherwise use Cloudflare
      if (this.externalModels[selectedModel] && this.hasApiKey(this.externalModels[selectedModel].provider)) {
        response = await this.callExternalAPI(selectedModel, systemPrompt, prompt, analysis);
      } else if (this.cloudflareModels[selectedModel]) {
        response = await this.callCloudflareAI(selectedModel, systemPrompt, prompt, analysis);
      } else {
        // Fallback to default Cloudflare model
        response = await this.callCloudflareAI('balanced', systemPrompt, prompt, analysis);
      }

      return this.processAIResponse(response, prompt, framework, analysis);

    } catch (error) {
      console.error('AI Generation error:', error);
      return this.generateFallbackResponse(prompt, framework);
    }
  }

  /**
   * Call Cloudflare AI service
   */
  async callCloudflareAI(modelKey, systemPrompt, prompt, analysis) {
    const modelName = this.cloudflareModels[modelKey];
    const capabilities = this.modelCapabilities[modelKey];

    const temperature = analysis.detectedTasks.includes('design') ? 0.8 :
                       analysis.detectedTasks.includes('coding') ? 0.3 : 0.5;

    return await this.env.AI.run(modelName, {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      max_tokens: Math.min(capabilities.tokens, 4096),
      temperature,
      top_p: 0.9,
      frequency_penalty: 0.1,
      presence_penalty: 0.1
    });
  }

  /**
   * Call external AI APIs (Anthropic, OpenAI, Google)
   */
  async callExternalAPI(modelKey, systemPrompt, prompt, analysis) {
    const config = this.externalModels[modelKey];
    const capabilities = this.modelCapabilities[modelKey];

    switch (config.provider) {
      case 'anthropic':
        return await this.callAnthropicAPI(config.model, systemPrompt, prompt, capabilities);
      case 'openai':
        return await this.callOpenAIAPI(config.model, systemPrompt, prompt, capabilities);
      case 'google':
        return await this.callGoogleAPI(config.model, systemPrompt, prompt, capabilities);
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  }

  /**
   * Call Anthropic Claude API
   */
  async callAnthropicAPI(model, systemPrompt, prompt, capabilities) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: Math.min(capabilities.tokens, 4096),
        messages: [
          { role: 'user', content: `${systemPrompt}\n\n${prompt}` }
        ],
        temperature: 0.5
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const result = await response.json();
    return { response: result.content[0].text };
  }

  /**
   * Call OpenAI GPT API
   */
  async callOpenAIAPI(model, systemPrompt, prompt, capabilities) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model,
        max_tokens: Math.min(capabilities.tokens, 4096),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const result = await response.json();
    return { response: result.choices[0].message.content };
  }

  /**
   * Call Google Gemini API
   */
  async callGoogleAPI(model, systemPrompt, prompt, capabilities) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${this.env.GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `${systemPrompt}\n\n${prompt}` }]
        }],
        generationConfig: {
          maxOutputTokens: Math.min(capabilities.tokens, 4096),
          temperature: 0.5
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Google API error: ${response.status}`);
    }

    const result = await response.json();
    return { response: result.candidates[0].content.parts[0].text };
  }

  /**
   * Process and validate AI response
   */
  processAIResponse(response, prompt, framework, analysis) {
    let result = response.response || response;

    // Clean up the response
    if (typeof result === 'string') {
      // Try to extract JSON from the response
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = jsonMatch[0];
      }
    }

    try {
      const parsedResult = typeof result === 'string' ? JSON.parse(result) : result;

      // Validate the structure
      if (!parsedResult.files || !parsedResult.files['index.html']) {
        throw new Error('Invalid response structure');
      }

      // Enhance the response with metadata
      parsedResult.metadata = {
        model: analysis.model,
        complexity: analysis.isComplex ? 'high' : 'medium',
        generatedAt: new Date().toISOString(),
        framework: framework,
        originalPrompt: prompt
      };

      return parsedResult;

    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return this.generateFallbackResponse(prompt, framework);
    }
  }

  /**
   * Generate fallback response when AI fails
   */
  generateFallbackResponse(prompt, framework) {
    const features = this.extractFeatures(prompt);

    return {
      files: {
        "index.html": this.generateFallbackHTML(prompt, features),
        "style.css": this.generateFallbackCSS(),
        "script.js": this.generateFallbackJS(features)
      },
      description: `Fallback app for: ${prompt}`,
      framework: framework,
      features: features,
      metadata: {
        model: 'fallback',
        complexity: 'basic',
        generatedAt: new Date().toISOString(),
        framework: framework,
        originalPrompt: prompt,
        fallback: true
      }
    };
  }

  /**
   * Extract likely features from user prompt
   */
  extractFeatures(prompt) {
    const features = [];
    const promptLower = prompt.toLowerCase();

    const featureMap = {
      'button': 'Interactive buttons',
      'form': 'User input forms',
      'list': 'Dynamic lists',
      'search': 'Search functionality',
      'filter': 'Filtering options',
      'sort': 'Sorting features',
      'animation': 'Smooth animations',
      'responsive': 'Mobile responsive',
      'dark': 'Dark mode theme',
      'chart': 'Data visualization',
      'map': 'Interactive maps',
      'timer': 'Timer functionality',
      'calculator': 'Calculation features',
      'todo': 'Task management',
      'calendar': 'Calendar interface'
    };

    for (const [keyword, feature] of Object.entries(featureMap)) {
      if (promptLower.includes(keyword)) {
        features.push(feature);
      }
    }

    return features.length > 0 ? features : ['Modern UI', 'Interactive elements', 'Responsive design'];
  }

  /**
   * Generate fallback HTML
   */
  generateFallbackHTML(prompt, features) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ZKode Generated App</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="app-container">
    <header class="app-header">
      <h1>✨ ${prompt.slice(0, 50)}${prompt.length > 50 ? '...' : ''}</h1>
      <p class="subtitle">Generated by ZKode AI</p>
    </header>

    <main class="app-main">
      <div class="feature-grid">
        ${features.map((feature, index) => `
          <div class="feature-card" data-feature="${index}">
            <h3>${feature}</h3>
            <p>This feature is ready to enhance your application experience.</p>
            <button class="feature-btn" onclick="activateFeature(${index})">Try It</button>
          </div>
        `).join('')}
      </div>

      <div class="action-section">
        <button class="primary-btn" onclick="showDemo()">🚀 Launch Demo</button>
        <button class="secondary-btn" onclick="showInfo()">ℹ️ Learn More</button>
      </div>
    </main>

    <footer class="app-footer">
      <p>Built with ZKode - AI-Powered Vibe Coding</p>
    </footer>
  </div>

  <script src="script.js"></script>
</body>
</html>`;
  }

  /**
   * Generate fallback CSS
   */
  generateFallbackCSS() {
    return `/* ZKode Generated Styles */
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --accent-color: #ff6b6b;
  --text-color: #2d3748;
  --bg-color: #f7fafc;
  --card-bg: #ffffff;
  --border-color: #e2e8f0;
  --shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 25px rgba(0, 0, 0, 0.15);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: var(--text-color);
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  min-height: 100vh;
}

.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  text-align: center;
  color: white;
  margin-bottom: 40px;
  animation: fadeInDown 0.8s ease-out;
}

.app-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 10px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
}

.app-main {
  flex: 1;
  background: var(--card-bg);
  border-radius: 20px;
  padding: 40px;
  box-shadow: var(--shadow-lg);
  animation: fadeInUp 0.8s ease-out 0.2s both;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.feature-card {
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-lg);
}

.feature-card h3 {
  color: var(--primary-color);
  margin-bottom: 12px;
  font-size: 1.2rem;
}

.feature-btn {
  background: var(--accent-color);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.3s ease;
  margin-top: 12px;
}

.feature-btn:hover {
  background: #ff5252;
}

.action-section {
  text-align: center;
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
}

.primary-btn, .secondary-btn {
  padding: 15px 30px;
  border: none;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.primary-btn {
  background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
  color: white;
}

.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.secondary-btn {
  background: transparent;
  color: var(--primary-color);
  border: 2px solid var(--primary-color);
}

.secondary-btn:hover {
  background: var(--primary-color);
  color: white;
}

.app-footer {
  text-align: center;
  color: white;
  margin-top: 20px;
  opacity: 0.8;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .app-container {
    padding: 10px;
  }

  .app-main {
    padding: 20px;
  }

  .app-header h1 {
    font-size: 2rem;
  }

  .action-section {
    flex-direction: column;
  }
}`;
  }

  /**
   * Generate fallback JavaScript
   */
  generateFallbackJS(features) {
    return `// ZKode Generated JavaScript
console.log('🎉 ZKode app initialized!');

// Feature activation system
function activateFeature(featureIndex) {
  const features = ${JSON.stringify(features)};
  const feature = features[featureIndex];

  // Add visual feedback
  const card = document.querySelector(\`[data-feature="\${featureIndex}"]\`);
  card.style.background = 'linear-gradient(45deg, #667eea, #764ba2)';
  card.style.color = 'white';

  setTimeout(() => {
    card.style.background = '';
    card.style.color = '';
  }, 2000);

  // Show feature-specific message
  showNotification(\`✨ \${feature} activated!\`);
}

// Demo functionality
function showDemo() {
  showNotification('🚀 Demo mode activated! This is your AI-generated application in action.');

  // Add some interactive demo behavior
  document.querySelectorAll('.feature-card').forEach((card, index) => {
    setTimeout(() => {
      card.style.transform = 'scale(1.05)';
      setTimeout(() => {
        card.style.transform = '';
      }, 500);
    }, index * 200);
  });
}

// Information display
function showInfo() {
  const info = \`
🤖 AI-Generated Application

This application was created by ZKode using advanced AI technology.

Features included:
\${${JSON.stringify(features)}.map(f => \`• \${f}\`).join('\\n')}

ZKode transforms your ideas into functional web applications instantly!
  \`;

  alert(info);
}

// Notification system
function showNotification(message) {
  const notification = document.createElement('div');
  notification.style.cssText = \`
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(45deg, #667eea, #764ba2);
    color: white;
    padding: 15px 25px;
    border-radius: 25px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    z-index: 1000;
    animation: slideIn 0.3s ease-out;
  \`;

  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// Add slide animations for notifications
const style = document.createElement('style');
style.textContent = \`
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }

  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
\`;
document.head.appendChild(style);

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
  console.log('App loaded successfully!');

  // Add subtle animations to feature cards
  const cards = document.querySelectorAll('.feature-card');
  cards.forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';

    setTimeout(() => {
      card.style.transition = 'all 0.6s ease';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, index * 100);
  });
});`;
  }
}