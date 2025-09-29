// Database Service for ZKode
// Handles all database operations using Cloudflare D1

export class DatabaseService {
  constructor(env) {
    this.env = env;
    this.db = env.DB; // D1 database binding
  }

  /**
   * Initialize database with schema
   */
  async initializeDatabase() {
    if (!this.db) {
      throw new Error('Database not available - check D1 binding configuration');
    }

    try {
      // Check if tables exist by trying to query users table
      await this.db.prepare('SELECT COUNT(*) as count FROM users LIMIT 1').first();
      console.log('Database already initialized');
    } catch (error) {
      console.log('Initializing database schema...');
      await this.runMigrations();
    }
  }

  /**
   * Run database migrations
   */
  async runMigrations() {
    const migrations = [
      // Migration 001: Core tables
      `CREATE TABLE users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        is_active BOOLEAN DEFAULT TRUE,
        is_verified BOOLEAN DEFAULT FALSE,
        preferences JSON DEFAULT '{"defaultFramework": "html", "defaultModel": "balanced", "theme": "dark"}'
      )`,

      `CREATE TABLE user_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token_hash TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
        user_agent TEXT,
        ip_address TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,

      `CREATE TABLE projects (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        framework TEXT NOT NULL DEFAULT 'html',
        model_used TEXT,
        prompt TEXT,
        files JSON NOT NULL,
        is_public BOOLEAN DEFAULT FALSE,
        is_deployed BOOLEAN DEFAULT FALSE,
        deployment_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,

      `CREATE TABLE templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        framework TEXT NOT NULL,
        files JSON NOT NULL,
        features JSON,
        preview_image TEXT,
        is_featured BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        created_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        download_count INTEGER DEFAULT 0,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )`,

      // Indexes for performance
      `CREATE INDEX idx_users_email ON users(email)`,
      `CREATE INDEX idx_users_created_at ON users(created_at)`,
      `CREATE INDEX idx_sessions_user_id ON user_sessions(user_id)`,
      `CREATE INDEX idx_sessions_expires_at ON user_sessions(expires_at)`,
      `CREATE INDEX idx_projects_user_id ON projects(user_id)`,
      `CREATE INDEX idx_projects_created_at ON projects(created_at)`,
      `CREATE INDEX idx_projects_is_public ON projects(is_public)`,
      `CREATE INDEX idx_templates_category ON templates(category)`,
      `CREATE INDEX idx_templates_framework ON templates(framework)`,
      `CREATE INDEX idx_templates_is_featured ON templates(is_featured)`
    ];

    for (const migration of migrations) {
      try {
        await this.db.prepare(migration).run();
      } catch (error) {
        if (!error.message.includes('already exists')) {
          console.error('Migration failed:', migration, error);
          throw error;
        }
      }
    }

    console.log('Database migrations completed');
  }

  /**
   * User operations
   */
  async createUser(userData) {
    const { id, email, name, passwordHash } = userData;

    const stmt = this.db.prepare(`
      INSERT INTO users (id, email, name, password_hash, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    const result = await stmt.bind(id, email, name, passwordHash).run();

    if (!result.success) {
      throw new Error('Failed to create user');
    }

    return this.getUserById(id);
  }

  async getUserByEmail(email) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE email = ? AND is_active = TRUE');
    return await stmt.bind(email).first();
  }

  async getUserById(id) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ? AND is_active = TRUE');
    return await stmt.bind(id).first();
  }

  async updateUserLastLogin(userId) {
    const stmt = this.db.prepare(`
      UPDATE users
      SET last_login = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `);
    return await stmt.bind(userId).run();
  }

  async updateUserPreferences(userId, preferences) {
    const stmt = this.db.prepare(`
      UPDATE users
      SET preferences = ?, updated_at = datetime('now')
      WHERE id = ?
    `);
    return await stmt.bind(JSON.stringify(preferences), userId).run();
  }

  /**
   * Session operations
   */
  async createSession(sessionData) {
    const { id, userId, tokenHash, expiresAt, userAgent, ipAddress } = sessionData;

    const stmt = this.db.prepare(`
      INSERT INTO user_sessions (id, user_id, token_hash, expires_at, user_agent, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    return await stmt.bind(id, userId, tokenHash, expiresAt, userAgent, ipAddress).run();
  }

  async getValidSession(tokenHash) {
    const stmt = this.db.prepare(`
      SELECT * FROM user_sessions
      WHERE token_hash = ? AND expires_at > datetime('now')
    `);
    return await stmt.bind(tokenHash).first();
  }

  async invalidateSession(tokenHash) {
    const stmt = this.db.prepare('DELETE FROM user_sessions WHERE token_hash = ?');
    return await stmt.bind(tokenHash).run();
  }

  async cleanupExpiredSessions() {
    const stmt = this.db.prepare('DELETE FROM user_sessions WHERE expires_at <= datetime("now")');
    return await stmt.run();
  }

  /**
   * Project operations
   */
  async createProject(projectData) {
    const { id, userId, name, description, framework, modelUsed, prompt, files } = projectData;

    const stmt = this.db.prepare(`
      INSERT INTO projects (id, user_id, name, description, framework, model_used, prompt, files, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    const result = await stmt.bind(
      id, userId, name, description, framework, modelUsed, prompt, JSON.stringify(files)
    ).run();

    if (!result.success) {
      throw new Error('Failed to create project');
    }

    return this.getProjectById(id);
  }

  async getProjectById(id) {
    const stmt = this.db.prepare('SELECT * FROM projects WHERE id = ?');
    const project = await stmt.bind(id).first();

    if (project && project.files) {
      project.files = JSON.parse(project.files);
    }

    return project;
  }

  async getUserProjects(userId, limit = 20, offset = 0) {
    const stmt = this.db.prepare(`
      SELECT * FROM projects
      WHERE user_id = ?
      ORDER BY updated_at DESC
      LIMIT ? OFFSET ?
    `);

    const result = await stmt.bind(userId, limit, offset).all();

    return result.results.map(project => {
      if (project.files) {
        project.files = JSON.parse(project.files);
      }
      return project;
    });
  }

  async updateProject(id, updates) {
    const { name, description, files, isPublic, deploymentUrl } = updates;

    const stmt = this.db.prepare(`
      UPDATE projects
      SET name = ?, description = ?, files = ?, is_public = ?, deployment_url = ?, updated_at = datetime('now')
      WHERE id = ?
    `);

    return await stmt.bind(
      name, description, JSON.stringify(files), isPublic, deploymentUrl, id
    ).run();
  }

  async deleteProject(id, userId) {
    const stmt = this.db.prepare('DELETE FROM projects WHERE id = ? AND user_id = ?');
    return await stmt.bind(id, userId).run();
  }

  /**
   * Template operations
   */
  async getTemplates(category = null, framework = null, limit = 50) {
    let query = 'SELECT * FROM templates WHERE is_active = TRUE';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (framework) {
      query += ' AND framework = ?';
      params.push(framework);
    }

    query += ' ORDER BY is_featured DESC, download_count DESC, created_at DESC LIMIT ?';
    params.push(limit);

    const stmt = this.db.prepare(query);
    const result = await stmt.bind(...params).all();

    return result.results.map(template => {
      if (template.files) template.files = JSON.parse(template.files);
      if (template.features) template.features = JSON.parse(template.features);
      return template;
    });
  }

  async incrementTemplateDownload(templateId) {
    const stmt = this.db.prepare(`
      UPDATE templates
      SET download_count = download_count + 1, updated_at = datetime('now')
      WHERE id = ?
    `);
    return await stmt.bind(templateId).run();
  }

  /**
   * Analytics and monitoring
   */
  async logApiUsage(usageData) {
    const { id, userId, endpoint, method, modelUsed, tokensUsed, responseTimeMs, statusCode, ipAddress, userAgent } = usageData;

    const stmt = this.db.prepare(`
      INSERT INTO api_usage (id, user_id, endpoint, method, model_used, tokens_used, response_time_ms, status_code, ip_address, user_agent, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    return await stmt.bind(
      id, userId, endpoint, method, modelUsed, tokensUsed, responseTimeMs, statusCode, ipAddress, userAgent
    ).run();
  }

  async getUserStats(userId) {
    const projectsStmt = this.db.prepare('SELECT COUNT(*) as count FROM projects WHERE user_id = ?');
    const projectsResult = await projectsStmt.bind(userId).first();

    const usageStmt = this.db.prepare(`
      SELECT
        COUNT(*) as total_requests,
        SUM(tokens_used) as total_tokens,
        AVG(response_time_ms) as avg_response_time
      FROM api_usage
      WHERE user_id = ? AND created_at >= datetime('now', '-30 days')
    `);
    const usageResult = await usageStmt.bind(userId).first();

    return {
      projectCount: projectsResult.count,
      monthlyRequests: usageResult.total_requests || 0,
      monthlyTokens: usageResult.total_tokens || 0,
      avgResponseTime: usageResult.avg_response_time || 0
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const result = await this.db.prepare('SELECT 1 as healthy').first();
      return { healthy: true, database: !!result };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }
}