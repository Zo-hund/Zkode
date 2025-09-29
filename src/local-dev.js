import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Mock Cloudflare AI for local development
const mockAI = {
  run: async (model, options) => {
    const { messages } = options;
    const userPrompt = messages.find(m => m.role === 'user')?.content || '';

    // Generate a simple mock response for local development
    const mockResponse = {
      files: {
        "index.html": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ZKode Generated App</title>
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
      max-width: 600px;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    h1 {
      font-size: 2.5rem;
      margin-bottom: 20px;
      background: linear-gradient(45deg, #ff6b6b, #feca57);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    p {
      font-size: 1.2rem;
      line-height: 1.6;
      margin-bottom: 30px;
      opacity: 0.9;
    }
    .button {
      background: linear-gradient(45deg, #ff6b6b, #feca57);
      border: none;
      color: white;
      padding: 15px 30px;
      font-size: 1.1rem;
      border-radius: 50px;
      cursor: pointer;
      transition: transform 0.3s, box-shadow 0.3s;
      font-weight: bold;
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(255, 107, 107, 0.3);
    }
    .feature {
      margin: 20px 0;
      padding: 20px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 10px;
      border-left: 4px solid #feca57;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>✨ ${userPrompt.slice(0, 50)}${userPrompt.length > 50 ? '...' : ''}</h1>
    <p>This is your AI-generated application! ZKode has created something amazing based on your description.</p>

    <div class="feature">
      <h3>🚀 Feature 1</h3>
      <p>Amazing functionality that makes your app shine</p>
    </div>

    <div class="feature">
      <h3>🎨 Feature 2</h3>
      <p>Beautiful design that captivates your users</p>
    </div>

    <div class="feature">
      <h3>⚡ Feature 3</h3>
      <p>Lightning-fast performance for the best experience</p>
    </div>

    <button class="button" onclick="showMessage()">Try It Out!</button>
  </div>

  <script>
    function showMessage() {
      alert('🎉 Welcome to your ZKode-generated app!\\n\\nThis demo shows how AI can create beautiful, functional web applications from your descriptions.');
    }

    // Add some interactive animations
    document.addEventListener('DOMContentLoaded', function() {
      const features = document.querySelectorAll('.feature');
      features.forEach((feature, index) => {
        setTimeout(() => {
          feature.style.opacity = '0';
          feature.style.transform = 'translateY(20px)';
          feature.style.transition = 'all 0.6s ease';

          setTimeout(() => {
            feature.style.opacity = '1';
            feature.style.transform = 'translateY(0)';
          }, 100);
        }, index * 200);
      });
    });
  </script>
</body>
</html>`,
        "style.css": `/* Additional styles for ${userPrompt} */
body {
  animation: fadeIn 1s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.container {
  animation: slideUp 0.8s ease-out;
}

@keyframes slideUp {
  from { transform: translateY(50px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}`,
        "script.js": `// Enhanced JavaScript for ${userPrompt}
console.log('🎉 ZKode app loaded successfully!');

// Add interactive elements
document.addEventListener('DOMContentLoaded', function() {
  console.log('App initialized for: ${userPrompt}');

  // Add hover effects
  const button = document.querySelector('.button');
  if (button) {
    button.addEventListener('mouseenter', function() {
      this.style.background = 'linear-gradient(45deg, #feca57, #ff6b6b)';
    });

    button.addEventListener('mouseleave', function() {
      this.style.background = 'linear-gradient(45deg, #ff6b6b, #feca57)';
    });
  }
});`
      },
      description: `AI-generated app: ${userPrompt}`,
      framework: "html"
    };

    return { response: JSON.stringify(mockResponse) };
  }
};

// Mock environment for local development
const mockEnv = {
  AI: mockAI,
  TEMPLATES: {},
  PROJECTS: {},
  ENVIRONMENT: 'local-development'
};

// Import our worker
const workerModule = await import('./worker.js');
const worker = workerModule.default;

// Simple HTTP server for local development
import { createServer } from 'http';

const server = createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  try {
    // Create a mock Request object
    const url = `http://localhost:8787${req.url}`;
    let body = '';

    if (req.method === 'POST' || req.method === 'PUT') {
      await new Promise((resolve) => {
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', resolve);
      });
    }

    const mockRequest = new Request(url, {
      method: req.method,
      headers: Object.fromEntries(Object.entries(req.headers)),
      body: body || undefined
    });

    // Call our worker
    const response = await worker.fetch(mockRequest, mockEnv, {});

    // Send response
    res.writeHead(response.status, {
      'Content-Type': response.headers.get('Content-Type') || 'text/plain',
      'Access-Control-Allow-Origin': '*'
    });

    const responseText = await response.text();
    res.end(responseText);

  } catch (error) {
    console.error('Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
  }
});

const PORT = 8787;
server.listen(PORT, () => {
  console.log(`🚀 ZKode local development server running at http://localhost:${PORT}`);
  console.log(`📱 Frontend: Start with 'npm run start:frontend'`);
  console.log(`🎨 Try the demo by visiting http://localhost:${PORT}`);
});

export default server;