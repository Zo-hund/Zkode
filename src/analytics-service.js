/**
 * Analytics Service for ZKode Platform
 * Handles custom event tracking and monitoring
 */

export class AnalyticsService {
  constructor(env) {
    this.env = env;
    this.db = env.DB;
  }

  /**
   * Track a custom analytics event
   * @param {string} eventType - Type of event (e.g., 'user_registered', 'ai_generation_success')
   * @param {Object} data - Additional event data
   * @param {Request} request - Request object for extracting metadata
   * @param {string} userId - Optional user ID
   */
  async track(eventType, data = {}, request = null, userId = null) {
    try {
      const eventId = crypto.randomUUID();
      const timestamp = new Date().toISOString();

      // Extract request metadata if available
      let metadata = {};
      if (request) {
        metadata = {
          userAgent: request.headers.get('User-Agent'),
          ip: request.headers.get('CF-Connecting-IP'),
          country: request.cf?.country,
          colo: request.cf?.colo,
          url: request.url,
          method: request.method
        };
      }

      // Combine provided data with metadata
      const analyticsData = {
        ...data,
        ...metadata,
        timestamp
      };

      // Store in analytics_events table
      await this.db.prepare(`
        INSERT INTO analytics_events (
          id, event_type, data, timestamp, user_id,
          ip_country, colo, user_agent, url, method
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        eventId,
        eventType,
        JSON.stringify(analyticsData),
        timestamp,
        userId,
        metadata.country || null,
        metadata.colo || null,
        metadata.userAgent || null,
        metadata.url || null,
        metadata.method || null
      ).run();

      console.log(`📊 Analytics tracked: ${eventType}`, { eventId, userId });
    } catch (error) {
      console.error('📊 Analytics tracking failed:', error);
      // Don't throw - analytics failures shouldn't break the app
    }
  }

  /**
   * Track API request performance
   */
  async trackApiRequest(endpoint, method, duration, statusCode, request, userId = null) {
    await this.track('api_request', {
      endpoint,
      method,
      duration_ms: duration,
      status_code: statusCode
    }, request, userId);
  }

  /**
   * Track user registration
   */
  async trackUserRegistration(email, registrationMethod = 'direct', request = null) {
    await this.track('user_registered', {
      email_domain: email.split('@')[1],
      registration_method: registrationMethod
    }, request);
  }

  /**
   * Track user login
   */
  async trackUserLogin(userId, loginMethod = 'direct', request = null) {
    await this.track('user_login', {
      login_method: loginMethod
    }, request, userId);
  }

  /**
   * Track AI generation attempts
   */
  async trackAIGeneration(framework, model, promptLength, success, duration, userId, request = null, error = null) {
    const eventType = success ? 'ai_generation_success' : 'ai_generation_error';
    const data = {
      framework,
      model,
      prompt_length: promptLength,
      duration_ms: duration
    };

    if (success) {
      data.generation_successful = true;
    } else {
      data.error = error || 'Unknown error';
    }

    await this.track(eventType, data, request, userId);
  }

  /**
   * Track project operations
   */
  async trackProjectOperation(operation, projectId, userId, request = null) {
    await this.track('project_operation', {
      operation, // 'create', 'update', 'delete', 'view'
      project_id: projectId
    }, request, userId);
  }

  /**
   * Track error events
   */
  async trackError(error, context, request = null, userId = null) {
    await this.track('application_error', {
      error: error.message || error,
      context,
      stack: error.stack || null
    }, request, userId);
  }

  /**
   * Track template usage
   */
  async trackTemplateUsage(templateId, templateName, userId, request = null) {
    await this.track('template_used', {
      template_id: templateId,
      template_name: templateName
    }, request, userId);
  }

  /**
   * Get analytics summary for dashboard
   */
  async getAnalyticsSummary(days = 7) {
    try {
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - days);
      const since = sinceDate.toISOString();

      // Get event counts by type
      const eventCounts = await this.db.prepare(`
        SELECT
          event_type,
          COUNT(*) as count
        FROM analytics_events
        WHERE timestamp >= ?
        GROUP BY event_type
        ORDER BY count DESC
      `).bind(since).all();

      // Get daily active users
      const dailyActiveUsers = await this.db.prepare(`
        SELECT
          DATE(timestamp) as date,
          COUNT(DISTINCT user_id) as active_users
        FROM analytics_events
        WHERE timestamp >= ? AND user_id IS NOT NULL
        GROUP BY DATE(timestamp)
        ORDER BY date
      `).bind(since).all();

      // Get AI generation success rate
      const aiStats = await this.db.prepare(`
        SELECT
          COUNT(CASE WHEN event_type = 'ai_generation_success' THEN 1 END) as successful,
          COUNT(CASE WHEN event_type = 'ai_generation_error' THEN 1 END) as failed,
          COUNT(*) as total
        FROM analytics_events
        WHERE event_type IN ('ai_generation_success', 'ai_generation_error')
          AND timestamp >= ?
      `).bind(since).first();

      // Get popular frameworks
      const frameworks = await this.db.prepare(`
        SELECT
          JSON_EXTRACT(data, '$.framework') as framework,
          COUNT(*) as usage_count
        FROM analytics_events
        WHERE event_type = 'ai_generation_success'
          AND timestamp >= ?
        GROUP BY framework
        ORDER BY usage_count DESC
        LIMIT 10
      `).bind(since).all();

      return {
        period_days: days,
        event_counts: eventCounts.results || [],
        daily_active_users: dailyActiveUsers.results || [],
        ai_generation_stats: aiStats || {},
        popular_frameworks: frameworks.results || []
      };
    } catch (error) {
      console.error('📊 Failed to get analytics summary:', error);
      return null;
    }
  }

  /**
   * Get error analytics for monitoring
   */
  async getErrorAnalytics(hours = 24) {
    try {
      const sinceDate = new Date();
      sinceDate.setHours(sinceDate.getHours() - hours);
      const since = sinceDate.toISOString();

      const errors = await this.db.prepare(`
        SELECT
          JSON_EXTRACT(data, '$.error') as error_message,
          JSON_EXTRACT(data, '$.context') as context,
          COUNT(*) as count,
          MAX(timestamp) as last_occurrence
        FROM analytics_events
        WHERE event_type = 'application_error'
          AND timestamp >= ?
        GROUP BY error_message, context
        ORDER BY count DESC, last_occurrence DESC
        LIMIT 50
      `).bind(since).all();

      return errors.results || [];
    } catch (error) {
      console.error('📊 Failed to get error analytics:', error);
      return [];
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(hours = 24) {
    try {
      const sinceDate = new Date();
      sinceDate.setHours(sinceDate.getHours() - hours);
      const since = sinceDate.toISOString();

      const performance = await this.db.prepare(`
        SELECT
          JSON_EXTRACT(data, '$.endpoint') as endpoint,
          AVG(CAST(JSON_EXTRACT(data, '$.duration_ms') AS REAL)) as avg_duration_ms,
          MAX(CAST(JSON_EXTRACT(data, '$.duration_ms') AS REAL)) as max_duration_ms,
          COUNT(*) as request_count,
          COUNT(CASE WHEN CAST(JSON_EXTRACT(data, '$.status_code') AS INTEGER) >= 400 THEN 1 END) as error_count
        FROM analytics_events
        WHERE event_type = 'api_request'
          AND timestamp >= ?
        GROUP BY endpoint
        ORDER BY avg_duration_ms DESC
      `).bind(since).all();

      return performance.results || [];
    } catch (error) {
      console.error('📊 Failed to get performance metrics:', error);
      return [];
    }
  }
}