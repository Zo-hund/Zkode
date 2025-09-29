export default {
  async fetch(request, env, ctx) {
    const startTime = Date.now();
    const url = new URL(request.url);

    // CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Initialize analytics service
    const { AnalyticsService } = await import('./analytics-service.js');
    const analytics = new AnalyticsService(env);

    try {
      let response;
      let userId = null;

      // Extract user ID from auth token if present
      try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        if (token) {
          const { AuthService } = await import('./auth-service.js');
          const authService = new AuthService(env);
          await authService.initialize();
          const payload = await authService.verifySessionToken(token);
          userId = payload.userId;
        }
      } catch (authError) {
        // Continue without user ID if token is invalid
      }

      // Route handling with enhanced analytics
      if (url.pathname === '/api/generate') {
        response = await handleGenerate(request, env, analytics, userId);
      } else if (url.pathname === '/api/deploy') {
        response = await handleDeploy(request, env, analytics, userId);
      } else if (url.pathname.startsWith('/api/templates')) {
        response = await handleTemplates(request, env, analytics, userId);
      } else if (url.pathname.startsWith('/api/projects')) {
        response = await handleProjects(request, env, analytics, userId);
      } else if (url.pathname === '/api/auth/register') {
        response = await handleRegister(request, env, analytics);
      } else if (url.pathname === '/api/auth/login') {
        response = await handleLogin(request, env, analytics);
      } else if (url.pathname === '/api/auth/profile') {
        response = await handleProfile(request, env, analytics);
      } else if (url.pathname === '/api/auth/preferences') {
        response = await handlePreferences(request, env, analytics);
      } else if (url.pathname === '/api/analytics') {
        response = await handleAnalytics(request, env, analytics, userId);
      } else if (url.pathname === '/api/health') {
        response = await handleHealth(request, env, analytics, userId);
      } else if (url.pathname === '/api/models') {
        response = await handleModels(request, env, analytics, userId);
      } else if (url.pathname.startsWith('/api/templates')) {
        response = await handleTemplates(request, env, analytics, userId);
      } else if (url.pathname.startsWith('/api/agents')) {
        response = await handleAgents(request, env, analytics, userId);
      } else {
        // Serve frontend
        response = await serveFrontend(request, env);
      }

      // Track API request performance
      const duration = Date.now() - startTime;
      await analytics.trackApiRequest(
        url.pathname,
        request.method,
        duration,
        response.status,
        request,
        userId
      );

      return response;

    } catch (error) {
      // Track error and return error response
      await analytics.trackError(error, `Worker route: ${url.pathname}`, request, userId);

      const duration = Date.now() - startTime;
      await analytics.trackApiRequest(
        url.pathname,
        request.method,
        duration,
        500,
        request,
        userId
      );

      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

async function handleGenerate(request, env, analytics, userId) {
  const startTime = Date.now();
  const { prompt, framework = 'html', model = null } = await request.json();

  try {
    // Import and use our enhanced AI service
    const { AIService } = await import('./ai-service.js');
    const aiService = new AIService(env);

    // Generate the application using the AI service
    const result = await aiService.generateApplication(prompt, framework, model);

    // Track successful AI generation
    const duration = Date.now() - startTime;
    await analytics.trackAIGeneration(
      framework,
      model || 'default',
      prompt.length,
      true,
      duration,
      userId,
      request
    );

    return new Response(JSON.stringify({ response: JSON.stringify(result) }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('AI Generation error:', error);

    // Track failed AI generation
    const duration = Date.now() - startTime;
    await analytics.trackAIGeneration(
      framework,
      model || 'default',
      prompt.length,
      false,
      duration,
      userId,
      request,
      error.message
    );

    // Enhanced fallback response
    const fallback = {
      files: {
        "index.html": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ZKode - Service Unavailable</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      margin: 0;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 40px;
      text-align: center;
      max-width: 500px;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    h1 { margin-bottom: 20px; font-size: 2rem; }
    .status { font-size: 4rem; margin-bottom: 20px; }
    .retry-btn {
      background: #ff6b6b;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 25px;
      cursor: pointer;
      font-size: 1rem;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="status">🤖</div>
    <h1>AI Service Temporarily Unavailable</h1>
    <p>Our AI is taking a short break. Please try again in a moment.</p>
    <p><strong>Your request:</strong> ${prompt}</p>
    <button class="retry-btn" onclick="window.location.reload()">Retry</button>
  </div>
</body>
</html>`,
        "style.css": "/* Fallback styles */",
        "script.js": "console.log('ZKode fallback mode');"
      },
      description: `Service unavailable for: ${prompt}`,
      framework: framework,
      error: true,
      metadata: {
        model: 'fallback',
        generatedAt: new Date().toISOString(),
        error: error.message
      }
    };

    return new Response(JSON.stringify({ response: JSON.stringify(fallback) }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Retry-After': '30'
      }
    });
  }
}

async function handleDeploy(request, env, analytics, userId) {
  const { files, name } = await request.json();

  // For now, return a mock deployment URL
  // In production, this would use Workers for Platforms
  const deploymentId = Math.random().toString(36).substr(2, 9);
  const deploymentUrl = `https://${name}-${deploymentId}.zkode.app`;

  return new Response(JSON.stringify({
    success: true,
    url: deploymentUrl,
    deploymentId
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

async function handleTemplates(request, env, analytics, userId) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const action = pathParts[3] || 'list'; // /api/templates/{action}
    const templateId = pathParts[4]; // /api/templates/{action}/{id}

    // Import template service
    const { TemplateService } = await import('./template-service.js');
    const templateService = new TemplateService(env);

    // Track template access
    await analytics.track('templates_accessed', { action }, request, userId);

    switch (action) {
      case 'list':
        // Get templates with filtering
        const category = url.searchParams.get('category');
        const framework = url.searchParams.get('framework');
        const featured = url.searchParams.get('featured');
        const limit = parseInt(url.searchParams.get('limit')) || 20;
        const offset = parseInt(url.searchParams.get('offset')) || 0;

        const templates = await templateService.getTemplates({
          category,
          framework,
          featured: featured ? featured === 'true' : null,
          limit,
          offset
        });

        return new Response(JSON.stringify(templates), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });

      case 'categories':
        // Get template categories
        const categories = await templateService.getCategories();
        return new Response(JSON.stringify({ categories }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });

      case 'featured':
        // Get featured templates
        const featuredTemplates = await templateService.getFeaturedTemplates();
        return new Response(JSON.stringify(featuredTemplates), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });

      case 'popular':
        // Get popular templates
        const popularTemplates = await templateService.getPopularTemplates();
        return new Response(JSON.stringify(popularTemplates), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });

      case 'recent':
        // Get recent templates
        const recentTemplates = await templateService.getRecentTemplates();
        return new Response(JSON.stringify(recentTemplates), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });

      case 'search':
        // Search templates
        const query = url.searchParams.get('q') || '';
        const searchResults = await templateService.searchTemplates(query, {
          category: url.searchParams.get('category'),
          framework: url.searchParams.get('framework'),
          limit: parseInt(url.searchParams.get('limit')) || 20
        });

        return new Response(JSON.stringify(searchResults), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });

      case 'get':
        // Get specific template by ID
        if (!templateId) {
          return new Response(JSON.stringify({ error: 'Template ID required' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }

        const template = await templateService.getTemplate(templateId);
        if (!template) {
          return new Response(JSON.stringify({ error: 'Template not found' }), {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }

        // Track template usage
        await analytics.trackTemplateUsage(templateId, template.name, userId, request);
        await templateService.incrementDownloadCount(templateId);

        return new Response(JSON.stringify({ template }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });

      case 'create':
        // Create new template (authenticated users only)
        if (!userId) {
          return new Response(JSON.stringify({ error: 'Authentication required' }), {
            status: 401,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }

        if (request.method !== 'POST') {
          return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }

        const templateData = await request.json();
        const result = await templateService.createTemplate(templateData, userId);

        await analytics.track('template_created', { templateId: result.id }, request, userId);

        return new Response(JSON.stringify(result), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });

      case 'initialize':
        // Initialize default templates (admin only)
        await templateService.initializeDefaultTemplates();
        return new Response(JSON.stringify({ success: true, message: 'Templates initialized' }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
    }
  } catch (error) {
    await analytics.trackError(error, 'Templates endpoint', request, userId);

    return new Response(JSON.stringify({
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

async function handleProjects(request, env, analytics, userId) {
  // Track project access
  await analytics.track('projects_accessed', {}, request, userId);
  // Mock project data
  const projects = [
    {
      id: '1',
      name: 'My Todo App',
      description: 'A simple todo application',
      createdAt: new Date().toISOString(),
      framework: 'react'
    }
  ];

  return new Response(JSON.stringify(projects), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

// Authentication handlers
async function handleRegister(request, env, analytics) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { email, password, name } = await request.json();
    const { AuthService } = await import('./auth-service.js');
    const authService = new AuthService(env);

    await authService.initialize();
    const result = await authService.register(email, password, name);

    // Track successful registration
    await analytics.trackUserRegistration(email, 'direct', request);

    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    // Track registration error
    await analytics.track('registration_error', {
      error: error.message
    }, request);

    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

async function handleLogin(request, env, analytics) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { email, password } = await request.json();
    const { AuthService } = await import('./auth-service.js');
    const authService = new AuthService(env);

    await authService.initialize();
    const result = await authService.login(email, password);

    // Track successful login
    await analytics.trackUserLogin(result.user.id, 'direct', request);

    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    // Track login error
    await analytics.track('login_error', {
      error: error.message
    }, request);

    return new Response(JSON.stringify({ error: error.message }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

async function handleProfile(request, env, analytics) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      throw new Error('No token provided');
    }

    const { AuthService } = await import('./auth-service.js');
    const authService = new AuthService(env);

    await authService.initialize();
    const payload = await authService.verifySessionToken(token);
    const profile = await authService.getProfile(payload.userId);

    return new Response(JSON.stringify(profile), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

async function handlePreferences(request, env, analytics) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      throw new Error('No token provided');
    }

    const { AuthService } = await import('./auth-service.js');
    const authService = new AuthService(env);

    await authService.initialize();
    const payload = await authService.verifySessionToken(token);

    if (request.method === 'GET') {
      const profile = await authService.getProfile(payload.userId);
      return new Response(JSON.stringify(profile.preferences), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } else if (request.method === 'PUT') {
      const preferences = await request.json();
      const updated = await authService.updatePreferences(payload.userId, preferences);

      return new Response(JSON.stringify(updated), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

async function serveFrontend(request, env) {
  // In production, this would serve the built React app
  // For now, return a simple HTML page
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>ZKode - AI Vibe Coding Platform</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; background: #0f0f23; color: #fff; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 40px; }
        .logo { font-size: 3rem; font-weight: bold; background: linear-gradient(45deg, #00d4ff, #5b73ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .tagline { font-size: 1.2rem; color: #888; margin-top: 10px; }
        .loading { text-align: center; padding: 40px; color: #888; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">ZKode</div>
          <div class="tagline">AI-Powered Vibe Coding Platform</div>
        </div>
        <div class="loading">
          Loading React application...
          <br><br>
          <small>Frontend build in progress</small>
        </div>
      </div>
    </body>
    </html>
  `;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

// Analytics endpoint for frontend tracking and dashboard data
async function handleAnalytics(request, env, analytics, userId) {
  try {
    const url = new URL(request.url);

    if (request.method === 'POST') {
      // Handle frontend analytics tracking
      const { event, data } = await request.json();
      await analytics.track(event, data, request, userId);

      return new Response(JSON.stringify({ success: true }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } else if (request.method === 'GET') {
      // Handle analytics dashboard queries
      const action = url.searchParams.get('action');

      switch (action) {
        case 'summary':
          const days = parseInt(url.searchParams.get('days')) || 7;
          const summary = await analytics.getAnalyticsSummary(days);
          return new Response(JSON.stringify(summary), {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });

        case 'errors':
          const hours = parseInt(url.searchParams.get('hours')) || 24;
          const errors = await analytics.getErrorAnalytics(hours);
          return new Response(JSON.stringify(errors), {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });

        case 'performance':
          const perfHours = parseInt(url.searchParams.get('hours')) || 24;
          const performance = await analytics.getPerformanceMetrics(perfHours);
          return new Response(JSON.stringify(performance), {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });

        default:
          return new Response(JSON.stringify({ error: 'Invalid action' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
      }
    }
  } catch (error) {
    await analytics.trackError(error, 'Analytics endpoint', request, userId);

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// Health check endpoint for monitoring and alerting
async function handleHealth(request, env, analytics, userId) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'status';

    // Import alert service
    const { AlertService } = await import('./alert-service.js');
    const alertService = new AlertService(env);

    switch (action) {
      case 'status':
        // Get system status summary
        const status = await alertService.getSystemStatus();
        return new Response(JSON.stringify(status), {
          status: status.healthy ? 200 : 503,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });

      case 'check':
        // Run health check and return results
        const healthCheck = await alertService.checkSystemHealth();
        return new Response(JSON.stringify(healthCheck), {
          status: healthCheck.healthy ? 200 : 503,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });

      case 'alerts':
        // Get recent alerts
        const hours = parseInt(url.searchParams.get('hours')) || 24;
        const alerts = await alertService.getRecentAlerts(hours);
        return new Response(JSON.stringify({ alerts, count: alerts.length }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
    }
  } catch (error) {
    await analytics.trackError(error, 'Health check endpoint', request, userId);

    return new Response(JSON.stringify({
      healthy: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// Models endpoint for getting available AI models
async function handleModels(request, env, analytics, userId) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'list';

    // Import AI service
    const { AIService } = await import('./ai-service.js');
    const aiService = new AIService(env);

    switch (action) {
      case 'list':
        // Get all available models
        const models = aiService.getAvailableModels();
        return new Response(JSON.stringify({ models }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });

      case 'categories':
        // Get model categories
        const categories = {
          coding: aiService.getRecommendedModels('coding'),
          design: aiService.getRecommendedModels('design'),
          performance: aiService.getRecommendedModels('performance'),
          advanced: aiService.getRecommendedModels('advanced'),
          general: aiService.getRecommendedModels('general')
        };
        return new Response(JSON.stringify({ categories }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });

      case 'analyze':
        // Analyze prompt and recommend models
        const { prompt } = await request.json();
        if (!prompt) {
          return new Response(JSON.stringify({ error: 'Prompt required' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }

        const analysis = aiService.analyzePrompt(prompt);
        return new Response(JSON.stringify({ analysis }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
    }
  } catch (error) {
    await analytics.trackError(error, 'Models endpoint', request, userId);

    return new Response(JSON.stringify({
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// Agents endpoint for AI agent management and execution
async function handleAgents(request, env, analytics, userId) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const action = pathParts[3] || 'list'; // /api/agents/{action}
    const agentId = pathParts[4]; // /api/agents/{action}/{id}

    // Import agent service
    const { AgentService } = await import('./agent-service.js');
    const agentService = new AgentService(env);

    // Track agent access
    await analytics.track('agents_accessed', { action }, request, userId);

    switch (action) {
      case 'list':
        // Get all available agents
        const agents = agentService.getAvailableAgents();
        return new Response(JSON.stringify({ agents }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });

      case 'get':
        // Get specific agent details
        if (!agentId) {
          return new Response(JSON.stringify({ error: 'Agent ID required' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }

        const agent = agentService.getAgent(agentId);
        if (!agent) {
          return new Response(JSON.stringify({ error: 'Agent not found' }), {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }

        return new Response(JSON.stringify({ agent }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });

      case 'execute':
        // Execute agent task
        if (request.method !== 'POST') {
          return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }

        if (!agentId) {
          return new Response(JSON.stringify({ error: 'Agent ID required' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }

        const { task, context } = await request.json();
        if (!task) {
          return new Response(JSON.stringify({ error: 'Task required' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }

        // Track agent execution
        await analytics.track('agent_executed', {
          agentId,
          task: task.substring(0, 100)
        }, request, userId);

        const result = await agentService.executeAgent(agentId, task, context || {});

        return new Response(JSON.stringify(result), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });

      case 'workflow':
        // Execute agent workflow
        if (request.method !== 'POST') {
          return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }

        const { workflow, context: workflowContext } = await request.json();
        if (!workflow || !workflow.steps) {
          return new Response(JSON.stringify({ error: 'Workflow with steps required' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }

        // Track workflow execution
        await analytics.track('workflow_executed', {
          workflowName: workflow.name || 'unnamed',
          stepCount: workflow.steps.length
        }, request, userId);

        const workflowResult = await agentService.executeWorkflow(workflow, workflowContext || {});

        return new Response(JSON.stringify(workflowResult), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
    }
  } catch (error) {
    await analytics.trackError(error, 'Agents endpoint', request, userId);

    return new Response(JSON.stringify({
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}