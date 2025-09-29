// Authentication Service for ZKode
// JWT-based authentication with persistent database storage

import { DatabaseService } from './database-service.js';

export class AuthService {
  constructor(env) {
    this.env = env;
    this.JWT_SECRET = env.JWT_SECRET || 'zkode-fallback-secret-key';
    this.db = new DatabaseService(env);
  }

  /**
   * Generate JWT token
   */
  async generateToken(user) {
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    };

    const encodedHeader = this.base64urlEncode(JSON.stringify(header));
    const encodedPayload = this.base64urlEncode(JSON.stringify(payload));
    const data = `${encodedHeader}.${encodedPayload}`;

    const signature = await this.sign(data, this.JWT_SECRET);
    return `${data}.${signature}`;
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token) {
    try {
      const [header, payload, signature] = token.split('.');
      const data = `${header}.${payload}`;

      // Verify signature
      const expectedSignature = await this.sign(data, this.JWT_SECRET);
      if (signature !== expectedSignature) {
        throw new Error('Invalid signature');
      }

      // Decode payload
      const decodedPayload = JSON.parse(this.base64urlDecode(payload));

      // Check expiration
      if (decodedPayload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('Token expired');
      }

      return decodedPayload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Register new user
   */
  async register(email, password, name) {
    // Check if user already exists
    const existingUser = await this.db.getUserByEmail(email.toLowerCase());
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Validate input
    if (!this.isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    if (!name || name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters');
    }

    // Create user
    const userId = this.generateUserId();
    const hashedPassword = await this.hashPassword(password);

    const userData = {
      id: userId,
      email: email.toLowerCase(),
      name: name.trim(),
      passwordHash: hashedPassword
    };

    // Store user in database
    const user = await this.db.createUser(userData);

    // Create session
    const token = await this.generateToken(user);
    const tokenHash = await this.hashPassword(token);

    await this.db.createSession({
      id: this.generateSessionId(),
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      userAgent: null,
      ipAddress: null
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.created_at,
        preferences: JSON.parse(user.preferences || '{}')
      },
      token
    };
  }

  /**
   * Login user
   */
  async login(email, password) {
    const user = await this.db.getUserByEmail(email.toLowerCase());
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await this.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await this.db.updateUserLastLogin(user.id);

    // Generate token
    const token = await this.generateToken(user);
    const tokenHash = await this.hashPassword(token);

    // Create session
    await this.db.createSession({
      id: this.generateSessionId(),
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      userAgent: null,
      ipAddress: null
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.created_at,
        preferences: JSON.parse(user.preferences || '{}')
      },
      token
    };
  }

  /**
   * Get user profile
   */
  async getProfile(userId) {
    const user = await this.db.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const stats = await this.db.getUserStats(userId);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.created_at,
      preferences: JSON.parse(user.preferences || '{}'),
      projectCount: stats.projectCount
    };
  }

  /**
   * Update user preferences
   */
  async updatePreferences(userId, preferences) {
    const user = await this.db.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const currentPreferences = JSON.parse(user.preferences || '{}');
    const updatedPreferences = { ...currentPreferences, ...preferences };

    await this.db.updateUserPreferences(userId, updatedPreferences);
    return updatedPreferences;
  }

  /**
   * Verify session token
   */
  async verifySessionToken(token) {
    try {
      const payload = await this.verifyToken(token);
      const tokenHash = await this.hashPassword(token);
      const session = await this.db.getValidSession(tokenHash);

      if (!session) {
        throw new Error('Invalid session');
      }

      return payload;
    } catch (error) {
      throw new Error('Invalid session');
    }
  }

  /**
   * Logout user (invalidate session)
   */
  async logout(token) {
    try {
      const tokenHash = await this.hashPassword(token);
      await this.db.invalidateSession(tokenHash);
    } catch (error) {
      // Ignore errors during logout
    }
  }

  /**
   * Helper methods
   */
  generateSessionId() {
    return 'sess_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  generateUserId() {
    return 'user_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async hashPassword(password) {
    // Simple hash for demo (in production, use bcrypt or similar)
    const encoder = new TextEncoder();
    const data = encoder.encode(password + this.JWT_SECRET);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  async verifyPassword(password, hashedPassword) {
    const hash = await this.hashPassword(password);
    return hash === hashedPassword;
  }

  async sign(data, secret) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
    return this.base64urlEncode(new Uint8Array(signature));
  }

  base64urlEncode(str) {
    if (typeof str === 'string') {
      str = new TextEncoder().encode(str);
    }
    return btoa(String.fromCharCode(...str))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  base64urlDecode(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
      str += '=';
    }
    return atob(str);
  }

  /**
   * Initialize database and demo users
   */
  async initialize() {
    await this.db.initializeDatabase();

    // Create demo user for testing
    try {
      await this.register('demo@zkode.app', 'password123', 'Demo User');
    } catch (error) {
      // User already exists, ignore
    }
  }
}