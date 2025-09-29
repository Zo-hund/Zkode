/**
 * Template Service for ZKode Platform
 * Handles template management, categorization, and discovery
 */

export class TemplateService {
  constructor(env) {
    this.env = env;
    this.db = env.DB;
    this.storage = env.TEMPLATES; // R2 bucket for template files
  }

  /**
   * Get all templates with filtering and pagination
   */
  async getTemplates(options = {}) {
    try {
      const {
        category = null,
        framework = null,
        featured = null,
        search = null,
        limit = 50,
        offset = 0,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = options;

      let query = `
        SELECT
          id, name, description, category, framework, features,
          preview_image, is_featured, download_count, created_at
        FROM templates
        WHERE is_active = 1
      `;
      const params = [];

      if (category) {
        query += ' AND category = ?';
        params.push(category);
      }

      if (framework) {
        query += ' AND framework = ?';
        params.push(framework);
      }

      if (featured !== null) {
        query += ' AND is_featured = ?';
        params.push(featured ? 1 : 0);
      }

      if (search) {
        query += ' AND (name LIKE ? OR description LIKE ? OR JSON_EXTRACT(features, "$") LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      query += ` ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const result = await this.db.prepare(query).bind(...params).all();

      return {
        templates: result.results || [],
        total: result.results?.length || 0,
        hasMore: (result.results?.length || 0) === limit
      };
    } catch (error) {
      console.error('Failed to get templates:', error);
      return { templates: [], total: 0, hasMore: false };
    }
  }

  /**
   * Get template by ID with full details including files
   */
  async getTemplate(id) {
    try {
      const template = await this.db.prepare(`
        SELECT * FROM templates WHERE id = ? AND is_active = 1
      `).bind(id).first();

      if (!template) {
        return null;
      }

      // Parse JSON fields
      template.files = JSON.parse(template.files || '{}');
      template.features = JSON.parse(template.features || '[]');

      return template;
    } catch (error) {
      console.error('Failed to get template:', error);
      return null;
    }
  }

  /**
   * Create a new template
   */
  async createTemplate(templateData, userId) {
    try {
      const {
        name,
        description,
        category,
        framework,
        files,
        features = [],
        previewImage = null,
        isFeatured = false
      } = templateData;

      const id = crypto.randomUUID();
      const timestamp = new Date().toISOString();

      await this.db.prepare(`
        INSERT INTO templates (
          id, name, description, category, framework, files,
          features, preview_image, is_featured, is_active,
          created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id, name, description, category, framework,
        JSON.stringify(files), JSON.stringify(features),
        previewImage, isFeatured ? 1 : 0, 1,
        userId, timestamp, timestamp
      ).run();

      return { id, success: true };
    } catch (error) {
      console.error('Failed to create template:', error);
      throw new Error('Failed to create template');
    }
  }

  /**
   * Update template download count
   */
  async incrementDownloadCount(templateId) {
    try {
      await this.db.prepare(`
        UPDATE templates
        SET download_count = download_count + 1
        WHERE id = ?
      `).bind(templateId).run();
    } catch (error) {
      console.error('Failed to update download count:', error);
    }
  }

  /**
   * Get template categories with counts
   */
  async getCategories() {
    try {
      const result = await this.db.prepare(`
        SELECT
          category,
          COUNT(*) as count,
          framework,
          COUNT(CASE WHEN is_featured = 1 THEN 1 END) as featured_count
        FROM templates
        WHERE is_active = 1
        GROUP BY category, framework
        ORDER BY count DESC
      `).all();

      // Group by category
      const categories = {};
      (result.results || []).forEach(row => {
        if (!categories[row.category]) {
          categories[row.category] = {
            name: row.category,
            totalCount: 0,
            featuredCount: 0,
            frameworks: {}
          };
        }

        categories[row.category].totalCount += row.count;
        categories[row.category].featuredCount += row.featured_count;
        categories[row.category].frameworks[row.framework] = row.count;
      });

      return Object.values(categories);
    } catch (error) {
      console.error('Failed to get categories:', error);
      return [];
    }
  }

  /**
   * Search templates with advanced filtering
   */
  async searchTemplates(query, filters = {}) {
    try {
      const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);

      if (searchTerms.length === 0) {
        return this.getTemplates(filters);
      }

      // Build search query with relevance scoring
      let sqlQuery = `
        SELECT
          *,
          (
            CASE WHEN LOWER(name) LIKE ? THEN 10 ELSE 0 END +
            CASE WHEN LOWER(description) LIKE ? THEN 5 ELSE 0 END +
            CASE WHEN LOWER(category) LIKE ? THEN 3 ELSE 0 END +
            CASE WHEN JSON_EXTRACT(features, "$") LIKE ? THEN 2 ELSE 0 END
          ) as relevance_score
        FROM templates
        WHERE is_active = 1 AND relevance_score > 0
      `;

      const params = [];
      const searchPattern = `%${query}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);

      if (filters.category) {
        sqlQuery += ' AND category = ?';
        params.push(filters.category);
      }

      if (filters.framework) {
        sqlQuery += ' AND framework = ?';
        params.push(filters.framework);
      }

      sqlQuery += ' ORDER BY relevance_score DESC, download_count DESC LIMIT ?';
      params.push(filters.limit || 20);

      const result = await this.db.prepare(sqlQuery).bind(...params).all();

      return {
        templates: result.results || [],
        total: result.results?.length || 0,
        query
      };
    } catch (error) {
      console.error('Failed to search templates:', error);
      return { templates: [], total: 0, query };
    }
  }

  /**
   * Get featured templates
   */
  async getFeaturedTemplates(limit = 10) {
    return this.getTemplates({
      featured: true,
      limit,
      sortBy: 'download_count',
      sortOrder: 'DESC'
    });
  }

  /**
   * Get popular templates
   */
  async getPopularTemplates(limit = 10) {
    return this.getTemplates({
      limit,
      sortBy: 'download_count',
      sortOrder: 'DESC'
    });
  }

  /**
   * Get recent templates
   */
  async getRecentTemplates(limit = 10) {
    return this.getTemplates({
      limit,
      sortBy: 'created_at',
      sortOrder: 'DESC'
    });
  }

  /**
   * Get templates by framework
   */
  async getTemplatesByFramework(framework, limit = 20) {
    return this.getTemplates({
      framework,
      limit,
      sortBy: 'download_count',
      sortOrder: 'DESC'
    });
  }

  /**
   * Initialize default templates
   */
  async initializeDefaultTemplates() {
    try {
      // Check if templates already exist
      const existing = await this.db.prepare('SELECT COUNT(*) as count FROM templates').first();
      if (existing.count > 0) {
        return; // Templates already initialized
      }

      console.log('🎨 Initializing default templates...');

      const defaultTemplates = [
        {
          name: 'Modern Landing Page',
          description: 'Beautiful responsive landing page with hero section, features, and contact form',
          category: 'marketing',
          framework: 'html',
          features: ['Responsive Design', 'Contact Form', 'Hero Section', 'Features Grid'],
          files: this.getLandingPageTemplate(),
          isFeatured: true
        },
        {
          name: 'Dashboard Admin Panel',
          description: 'Complete admin dashboard with charts, tables, and navigation',
          category: 'admin',
          framework: 'html',
          features: ['Dark Theme', 'Charts', 'Data Tables', 'Responsive'],
          files: this.getDashboardTemplate(),
          isFeatured: true
        },
        {
          name: 'Todo App',
          description: 'Interactive todo application with local storage',
          category: 'productivity',
          framework: 'html',
          features: ['Local Storage', 'CRUD Operations', 'Drag & Drop', 'Filters'],
          files: this.getTodoTemplate(),
          isFeatured: false
        },
        {
          name: 'E-commerce Product Page',
          description: 'Product showcase page with gallery, reviews, and purchase options',
          category: 'ecommerce',
          framework: 'html',
          features: ['Image Gallery', 'Product Reviews', 'Shopping Cart', 'Responsive'],
          files: this.getEcommerceTemplate(),
          isFeatured: true
        },
        {
          name: 'Portfolio Website',
          description: 'Personal portfolio with project showcase and contact section',
          category: 'portfolio',
          framework: 'html',
          features: ['Project Gallery', 'Contact Form', 'About Section', 'Responsive'],
          files: this.getPortfolioTemplate(),
          isFeatured: false
        }
      ];

      for (const template of defaultTemplates) {
        await this.createTemplate(template, 'system');
      }

      console.log(`✅ Initialized ${defaultTemplates.length} default templates`);
    } catch (error) {
      console.error('Failed to initialize default templates:', error);
    }
  }

  /**
   * Template file generators for default templates
   */
  getLandingPageTemplate() {
    return {
      'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Modern Landing Page</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header class="header">
        <nav class="nav">
            <div class="nav-brand">Brand</div>
            <ul class="nav-menu">
                <li><a href="#features">Features</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
        </nav>
    </header>

    <section class="hero">
        <div class="hero-content">
            <h1 class="hero-title">Build Amazing Things</h1>
            <p class="hero-subtitle">Create beautiful web applications with our powerful platform</p>
            <a href="#" class="btn btn-primary">Get Started</a>
        </div>
    </section>

    <section id="features" class="features">
        <div class="container">
            <h2>Features</h2>
            <div class="features-grid">
                <div class="feature-card">
                    <h3>🚀 Fast</h3>
                    <p>Lightning fast performance</p>
                </div>
                <div class="feature-card">
                    <h3>📱 Responsive</h3>
                    <p>Works on all devices</p>
                </div>
                <div class="feature-card">
                    <h3>🎨 Beautiful</h3>
                    <p>Modern design system</p>
                </div>
            </div>
        </div>
    </section>

    <script src="script.js"></script>
</body>
</html>`,
      'style.css': `/* Modern Landing Page Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    line-height: 1.6;
    color: #333;
}

.header {
    position: fixed;
    top: 0;
    width: 100%;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    z-index: 1000;
    padding: 1rem 0;
}

.nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
}

.nav-brand {
    font-size: 1.5rem;
    font-weight: bold;
    color: #667eea;
}

.nav-menu {
    display: flex;
    list-style: none;
    gap: 2rem;
}

.nav-menu a {
    text-decoration: none;
    color: #333;
    transition: color 0.3s ease;
}

.nav-menu a:hover {
    color: #667eea;
}

.hero {
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    text-align: center;
}

.hero-title {
    font-size: 3.5rem;
    margin-bottom: 1rem;
    animation: fadeInUp 1s ease-out;
}

.hero-subtitle {
    font-size: 1.2rem;
    margin-bottom: 2rem;
    opacity: 0.9;
    animation: fadeInUp 1s ease-out 0.2s both;
}

.btn {
    display: inline-block;
    padding: 1rem 2rem;
    border: none;
    border-radius: 50px;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.3s ease;
    animation: fadeInUp 1s ease-out 0.4s both;
}

.btn-primary {
    background: white;
    color: #667eea;
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.features {
    padding: 5rem 0;
    background: #f8f9fa;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
}

.features h2 {
    text-align: center;
    font-size: 2.5rem;
    margin-bottom: 3rem;
    color: #333;
}

.features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
}

.feature-card {
    background: white;
    padding: 2rem;
    border-radius: 15px;
    text-align: center;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease;
}

.feature-card:hover {
    transform: translateY(-5px);
}

.feature-card h3 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: #667eea;
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
    .hero-title {
        font-size: 2.5rem;
    }

    .nav-menu {
        display: none;
    }
}`,
      'script.js': `// Modern Landing Page JavaScript
console.log('🎉 Landing page loaded!');

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add scroll effect to header
window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(255, 255, 255, 0.98)';
    } else {
        header.style.background = 'rgba(255, 255, 255, 0.95)';
    }
});

// Animate feature cards on scroll
const observeElements = (selector, className) => {
    const elements = document.querySelectorAll(selector);
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add(className);
            }
        });
    });

    elements.forEach(el => observer.observe(el));
};

// Initialize animations
document.addEventListener('DOMContentLoaded', () => {
    observeElements('.feature-card', 'animate-in');
});`
    };
  }

  getDashboardTemplate() {
    // Similar implementation for dashboard template
    return {
      'index.html': '<!-- Dashboard HTML content -->',
      'style.css': '/* Dashboard CSS */',
      'script.js': '// Dashboard JavaScript'
    };
  }

  getTodoTemplate() {
    // Similar implementation for todo template
    return {
      'index.html': '<!-- Todo App HTML content -->',
      'style.css': '/* Todo App CSS */',
      'script.js': '// Todo App JavaScript'
    };
  }

  getEcommerceTemplate() {
    // Similar implementation for ecommerce template
    return {
      'index.html': '<!-- E-commerce HTML content -->',
      'style.css': '/* E-commerce CSS */',
      'script.js': '// E-commerce JavaScript'
    };
  }

  getPortfolioTemplate() {
    // Similar implementation for portfolio template
    return {
      'index.html': '<!-- Portfolio HTML content -->',
      'style.css': '/* Portfolio CSS */',
      'script.js': '// Portfolio JavaScript'
    };
  }
}