/**
 * Alert Service for ZKode Platform
 * Handles monitoring and alerting based on analytics data
 */

export class AlertService {
  constructor(env) {
    this.env = env;
    this.db = env.DB;
    this.alertWebhook = env.ALERT_WEBHOOK_URL; // Optional webhook for alerts
  }

  /**
   * Check system health and send alerts if needed
   */
  async checkSystemHealth() {
    try {
      const alerts = [];

      // Check error rates (last hour)
      const errorRate = await this.getErrorRate(60);
      if (errorRate > 5) {
        alerts.push({
          type: 'high_error_rate',
          severity: 'high',
          message: `High error rate detected: ${errorRate}% (last hour)`,
          threshold: 5,
          actual: errorRate
        });
      }

      // Check AI generation failure rate (last hour)
      const aiFailureRate = await this.getAIFailureRate(60);
      if (aiFailureRate > 15) {
        alerts.push({
          type: 'ai_generation_failures',
          severity: 'medium',
          message: `AI generation failure rate is high: ${aiFailureRate}% (last hour)`,
          threshold: 15,
          actual: aiFailureRate
        });
      }

      // Check average response time (last hour)
      const avgResponseTime = await this.getAverageResponseTime(60);
      if (avgResponseTime > 3000) {
        alerts.push({
          type: 'slow_response_time',
          severity: 'medium',
          message: `Average response time is slow: ${avgResponseTime}ms (last hour)`,
          threshold: 3000,
          actual: avgResponseTime
        });
      }

      // Check for database errors
      const dbErrorCount = await this.getDatabaseErrorCount(60);
      if (dbErrorCount > 10) {
        alerts.push({
          type: 'database_errors',
          severity: 'high',
          message: `High number of database errors: ${dbErrorCount} (last hour)`,
          threshold: 10,
          actual: dbErrorCount
        });
      }

      // Send alerts if any found
      for (const alert of alerts) {
        await this.sendAlert(alert);
      }

      return {
        healthy: alerts.length === 0,
        alerts: alerts.length,
        details: alerts
      };
    } catch (error) {
      console.error('❌ Health check failed:', error);
      await this.sendAlert({
        type: 'health_check_failure',
        severity: 'critical',
        message: `Health check system failed: ${error.message}`,
        error: error.message
      });

      return {
        healthy: false,
        alerts: 1,
        error: error.message
      };
    }
  }

  /**
   * Get error rate percentage for the last N minutes
   */
  async getErrorRate(minutes = 60) {
    try {
      const since = new Date(Date.now() - minutes * 60 * 1000).toISOString();

      const result = await this.db.prepare(`
        SELECT
          COUNT(*) as total_requests,
          COUNT(CASE WHEN JSON_EXTRACT(data, '$.status_code') >= 400 THEN 1 END) as error_requests
        FROM analytics_events
        WHERE event_type = 'api_request'
          AND timestamp >= ?
      `).bind(since).first();

      if (!result || result.total_requests === 0) return 0;
      return Math.round((result.error_requests / result.total_requests) * 100);
    } catch (error) {
      console.error('Failed to get error rate:', error);
      return 0;
    }
  }

  /**
   * Get AI generation failure rate for the last N minutes
   */
  async getAIFailureRate(minutes = 60) {
    try {
      const since = new Date(Date.now() - minutes * 60 * 1000).toISOString();

      const result = await this.db.prepare(`
        SELECT
          COUNT(CASE WHEN event_type = 'ai_generation_success' THEN 1 END) as successful,
          COUNT(CASE WHEN event_type = 'ai_generation_error' THEN 1 END) as failed,
          COUNT(*) as total
        FROM analytics_events
        WHERE event_type IN ('ai_generation_success', 'ai_generation_error')
          AND timestamp >= ?
      `).bind(since).first();

      if (!result || result.total === 0) return 0;
      return Math.round((result.failed / result.total) * 100);
    } catch (error) {
      console.error('Failed to get AI failure rate:', error);
      return 0;
    }
  }

  /**
   * Get average response time for the last N minutes
   */
  async getAverageResponseTime(minutes = 60) {
    try {
      const since = new Date(Date.now() - minutes * 60 * 1000).toISOString();

      const result = await this.db.prepare(`
        SELECT AVG(CAST(JSON_EXTRACT(data, '$.duration_ms') AS REAL)) as avg_duration
        FROM analytics_events
        WHERE event_type = 'api_request'
          AND timestamp >= ?
          AND JSON_EXTRACT(data, '$.duration_ms') IS NOT NULL
      `).bind(since).first();

      return Math.round(result?.avg_duration || 0);
    } catch (error) {
      console.error('Failed to get average response time:', error);
      return 0;
    }
  }

  /**
   * Get database error count for the last N minutes
   */
  async getDatabaseErrorCount(minutes = 60) {
    try {
      const since = new Date(Date.now() - minutes * 60 * 1000).toISOString();

      const result = await this.db.prepare(`
        SELECT COUNT(*) as error_count
        FROM analytics_events
        WHERE event_type = 'application_error'
          AND timestamp >= ?
          AND JSON_EXTRACT(data, '$.context') LIKE '%database%'
      `).bind(since).first();

      return result?.error_count || 0;
    } catch (error) {
      console.error('Failed to get database error count:', error);
      return 0;
    }
  }

  /**
   * Send alert via webhook or console
   */
  async sendAlert(alert) {
    try {
      const alertMessage = {
        timestamp: new Date().toISOString(),
        platform: 'ZKode',
        environment: this.env.ENVIRONMENT || 'unknown',
        ...alert
      };

      // Console log for all alerts
      console.error(`🚨 ALERT [${alert.severity?.toUpperCase()}]: ${alert.message}`);

      // Send to webhook if configured
      if (this.alertWebhook) {
        await fetch(this.alertWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚨 ZKode Alert [${alert.severity?.toUpperCase()}]\n${alert.message}`,
            alert: alertMessage
          })
        });
      }

      // Store alert in database for tracking
      await this.db.prepare(`
        INSERT INTO analytics_events (id, event_type, data, timestamp)
        VALUES (?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(),
        'system_alert',
        JSON.stringify(alertMessage),
        alertMessage.timestamp
      ).run();

    } catch (error) {
      console.error('❌ Failed to send alert:', error);
    }
  }

  /**
   * Get recent alerts
   */
  async getRecentAlerts(hours = 24) {
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

      const alerts = await this.db.prepare(`
        SELECT
          JSON_EXTRACT(data, '$.type') as alert_type,
          JSON_EXTRACT(data, '$.severity') as severity,
          JSON_EXTRACT(data, '$.message') as message,
          timestamp
        FROM analytics_events
        WHERE event_type = 'system_alert'
          AND timestamp >= ?
        ORDER BY timestamp DESC
        LIMIT 50
      `).bind(since).all();

      return alerts.results || [];
    } catch (error) {
      console.error('Failed to get recent alerts:', error);
      return [];
    }
  }

  /**
   * Check if system is healthy based on recent metrics
   */
  async isSystemHealthy() {
    const health = await this.checkSystemHealth();
    return health.healthy;
  }

  /**
   * Get system status summary
   */
  async getSystemStatus() {
    try {
      const [
        errorRate,
        aiFailureRate,
        avgResponseTime,
        recentAlerts,
        isHealthy
      ] = await Promise.all([
        this.getErrorRate(60),
        this.getAIFailureRate(60),
        this.getAverageResponseTime(60),
        this.getRecentAlerts(24),
        this.isSystemHealthy()
      ]);

      return {
        healthy: isHealthy,
        timestamp: new Date().toISOString(),
        metrics: {
          error_rate_percent: errorRate,
          ai_failure_rate_percent: aiFailureRate,
          avg_response_time_ms: avgResponseTime
        },
        recent_alerts: recentAlerts.length,
        last_24h_alerts: recentAlerts
      };
    } catch (error) {
      console.error('Failed to get system status:', error);
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}