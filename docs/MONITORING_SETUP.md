# ZKode Monitoring & Analytics Setup Guide

This guide covers setting up comprehensive monitoring, analytics, and alerting for your live ZKode platform.

## 🎯 Monitoring Objectives

- **Performance Monitoring**: Track API response times, database performance
- **Error Tracking**: Catch and alert on application errors
- **Usage Analytics**: Understand user behavior and platform adoption
- **Uptime Monitoring**: Ensure 99.9%+ availability
- **Security Monitoring**: Track authentication patterns and threats

## 🏗️ Monitoring Stack Overview

### Layer 1: Cloudflare Built-in Analytics ✅ Free
- Workers Analytics (API performance)
- Pages Analytics (frontend performance)
- D1 Analytics (database performance)
- R2 Analytics (storage usage)

### Layer 2: Application-Level Monitoring
- Custom analytics in Workers
- User behavior tracking
- AI generation metrics
- Business KPIs

### Layer 3: External Monitoring (Optional)
- Uptime monitoring services
- Error tracking (Sentry)
- Performance monitoring (New Relic)

## 📊 Cloudflare Analytics Setup

### 1. Workers Analytics

Your Workers already have built-in analytics available at:
- **Dashboard**: https://dash.cloudflare.com → Workers & Pages → zkode-prod/zkode-staging
- **Metrics Available**:
  - Requests per second
  - Response time percentiles
  - Error rates by status code
  - Geographic distribution
  - CPU time usage

### 2. Pages Analytics

For your frontend at `https://3105a41c.zkode-frontend.pages.dev`:
- **Dashboard**: https://dash.cloudflare.com → Pages → zkode-frontend
- **Metrics Available**:
  - Page views and unique visitors
  - Geographic distribution
  - Device and browser analytics
  - Core Web Vitals
  - Bandwidth usage

### 3. D1 Database Analytics

Monitor your database performance:
- **Dashboard**: https://dash.cloudflare.com → D1 → zkode-db-prod
- **Metrics Available**:
  - Query volume and performance
  - Storage usage
  - Read/write operations
  - Error rates

## 📈 Custom Application Analytics

### Enhanced Worker Analytics

Add custom analytics to your Workers to track business metrics:

```javascript
// Add to src/worker.js
class Analytics {
  constructor(env) {
    this.env = env;
  }

  async track(event, data = {}) {
    // Track custom events
    const analyticsData = {
      timestamp: new Date().toISOString(),
      event,
      data,
      userAgent: request.headers.get('User-Agent'),
      ip: request.headers.get('CF-Connecting-IP'),
      country: request.cf?.country,
      colo: request.cf?.colo
    };

    // Store in D1 analytics table
    await this.env.DB.prepare(`
      INSERT INTO analytics_events (event_type, data, timestamp, ip_country, colo)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      event,
      JSON.stringify(analyticsData),
      analyticsData.timestamp,
      analyticsData.country,
      analyticsData.colo
    ).run();
  }
}

// Usage examples in your handlers:
async function handleRegister(request, env) {
  const analytics = new Analytics(env);

  try {
    // ... existing registration code ...

    // Track successful registration
    await analytics.track('user_registered', {
      email_domain: email.split('@')[1],
      registration_method: 'direct'
    });

  } catch (error) {
    // Track registration errors
    await analytics.track('registration_error', {
      error: error.message
    });
  }
}

async function handleGenerate(request, env) {
  const analytics = new Analytics(env);
  const startTime = Date.now();

  try {
    // ... existing generation code ...

    const duration = Date.now() - startTime;
    await analytics.track('ai_generation_success', {
      framework,
      model,
      prompt_length: prompt.length,
      generation_time_ms: duration,
      output_size: JSON.stringify(result).length
    });

  } catch (error) {
    await analytics.track('ai_generation_error', {
      framework,
      model,
      error: error.message,
      duration_ms: Date.now() - startTime
    });
  }
}
```

### Frontend Analytics

Add user behavior tracking to your React frontend:

```typescript
// frontend/src/utils/analytics.ts
class FrontendAnalytics {
  private apiBase: string;

  constructor(apiBase: string) {
    this.apiBase = apiBase;
  }

  async track(event: string, data: Record<string, any> = {}) {
    try {
      await fetch(`${this.apiBase}/api/analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event,
          data: {
            ...data,
            url: window.location.href,
            timestamp: new Date().toISOString(),
            screen_resolution: `${screen.width}x${screen.height}`,
            user_agent: navigator.userAgent
          }
        })
      });
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  }

  // Track page views
  trackPageView(page: string) {
    this.track('page_view', { page });
  }

  // Track user interactions
  trackButtonClick(button: string, context?: string) {
    this.track('button_click', { button, context });
  }

  // Track AI generation requests
  trackAIGeneration(prompt: string, framework: string, model: string) {
    this.track('ai_generation_request', {
      prompt_length: prompt.length,
      framework,
      model
    });
  }

  // Track errors
  trackError(error: string, context?: string) {
    this.track('frontend_error', { error, context });
  }
}

export const analytics = new FrontendAnalytics(
  import.meta.env.VITE_API_BASE_URL
);
```

## 🚨 Error Tracking & Alerting

### 1. Worker Error Handling

Enhance error handling in your Workers:

```javascript
// Enhanced error handling with tracking
async function handleWithErrorTracking(handler, request, env) {
  try {
    return await handler(request, env);
  } catch (error) {
    // Log error details
    console.error('Worker Error:', {
      error: error.message,
      stack: error.stack,
      url: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
      cf: request.cf
    });

    // Track error in analytics
    const analytics = new Analytics(env);
    await analytics.track('worker_error', {
      error: error.message,
      url: request.url,
      method: request.method
    });

    // Return user-friendly error
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
```

### 2. Frontend Error Boundary

Add React error boundary for frontend error tracking:

```tsx
// frontend/src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { analytics } from '../utils/analytics';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Track error
    analytics.trackError(error.message, JSON.stringify(errorInfo));

    console.error('React Error Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <p className="text-gray-400 mb-4">
              We've been notified and are working on a fix.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## 📊 Performance Monitoring Dashboard

### Key Metrics to Track

1. **API Performance**:
   - Average response time by endpoint
   - 95th/99th percentile response times
   - Error rates by status code
   - Requests per minute/hour

2. **AI Generation Metrics**:
   - Average generation time
   - Success/failure rates
   - Popular frameworks and models
   - Queue depth (if implemented)

3. **User Metrics**:
   - Daily/monthly active users
   - Registration conversion rates
   - Session duration
   - Feature usage patterns

4. **Infrastructure Metrics**:
   - Database query performance
   - Storage usage and growth
   - Geographic request distribution
   - CDN cache hit rates

### Analytics Dashboard Queries

```sql
-- Daily active users
SELECT
  DATE(timestamp) as date,
  COUNT(DISTINCT user_id) as daily_active_users
FROM analytics_events
WHERE event_type = 'page_view'
  AND timestamp >= datetime('now', '-30 days')
GROUP BY DATE(timestamp)
ORDER BY date;

-- AI generation success rates
SELECT
  DATE(timestamp) as date,
  COUNT(*) as total_generations,
  SUM(CASE WHEN event_type = 'ai_generation_success' THEN 1 ELSE 0 END) as successful,
  ROUND(
    (SUM(CASE WHEN event_type = 'ai_generation_success' THEN 1 ELSE 0 END) * 100.0) / COUNT(*),
    2
  ) as success_rate_percent
FROM analytics_events
WHERE event_type IN ('ai_generation_success', 'ai_generation_error')
  AND timestamp >= datetime('now', '-7 days')
GROUP BY DATE(timestamp)
ORDER BY date;

-- Popular frameworks
SELECT
  JSON_EXTRACT(data, '$.framework') as framework,
  COUNT(*) as usage_count
FROM analytics_events
WHERE event_type = 'ai_generation_success'
  AND timestamp >= datetime('now', '-30 days')
GROUP BY framework
ORDER BY usage_count DESC;

-- Average response times by endpoint
SELECT
  JSON_EXTRACT(data, '$.endpoint') as endpoint,
  AVG(JSON_EXTRACT(data, '$.duration_ms')) as avg_response_ms,
  COUNT(*) as request_count
FROM analytics_events
WHERE event_type = 'api_request'
  AND timestamp >= datetime('now', '-24 hours')
GROUP BY endpoint
ORDER BY avg_response_ms DESC;
```

## 🔔 Alerting Setup

### 1. Cloudflare Notifications

Set up alerts in Cloudflare Dashboard:
- Go to Notifications → Add
- Configure alerts for:
  - High error rates (>5% over 5 minutes)
  - High response times (>2s average over 5 minutes)
  - Low success rates (<95% over 10 minutes)

### 2. Custom Alerting Logic

```javascript
// Add to your Worker for custom alerts
class AlertManager {
  constructor(env) {
    this.env = env;
    this.webhookUrl = env.ALERT_WEBHOOK_URL; // Slack/Discord webhook
  }

  async checkAndAlert() {
    // Check error rates
    const errorRate = await this.getErrorRate();
    if (errorRate > 5) {
      await this.sendAlert(`🚨 High error rate: ${errorRate}%`);
    }

    // Check AI generation failures
    const aiFailureRate = await this.getAIFailureRate();
    if (aiFailureRate > 10) {
      await this.sendAlert(`🤖 AI generation failure rate: ${aiFailureRate}%`);
    }

    // Check database performance
    const dbSlowQueries = await this.getSlowQueryCount();
    if (dbSlowQueries > 10) {
      await this.sendAlert(`💾 Database performance degraded: ${dbSlowQueries} slow queries`);
    }
  }

  async sendAlert(message) {
    if (!this.webhookUrl) return;

    try {
      await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `ZKode Alert: ${message}`,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to send alert:', error);
    }
  }
}
```

## 🎯 Monitoring Checklist

### Immediate Setup (Today)
- [ ] Enable Cloudflare Analytics for all services
- [ ] Add custom analytics tracking to Workers
- [ ] Implement frontend error boundary
- [ ] Set up basic Cloudflare notifications

### Short Term (This Week)
- [ ] Create analytics dashboard queries
- [ ] Implement custom alerting logic
- [ ] Add frontend user behavior tracking
- [ ] Set up Slack/Discord webhook alerts

### Long Term (This Month)
- [ ] Integrate external monitoring service (optional)
- [ ] Create automated reports
- [ ] Implement A/B testing framework
- [ ] Add business intelligence dashboards

## 📋 Monitoring Best Practices

1. **Start Simple**: Use Cloudflare's built-in analytics first
2. **Track What Matters**: Focus on user experience and business metrics
3. **Set Reasonable Thresholds**: Avoid alert fatigue
4. **Regular Reviews**: Weekly monitoring data reviews
5. **User Privacy**: Respect user privacy in analytics collection
6. **Performance Impact**: Ensure monitoring doesn't slow down the app

---

This monitoring setup will give you comprehensive visibility into ZKode's performance, user behavior, and system health! 📊✨