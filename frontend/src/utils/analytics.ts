/**
 * Frontend Analytics Service for ZKode Platform
 * Tracks user behavior and interactions
 */

interface AnalyticsData {
  [key: string]: any;
}

class FrontendAnalytics {
  private apiBase: string;

  constructor(apiBase: string) {
    this.apiBase = apiBase;
  }

  async track(event: string, data: AnalyticsData = {}) {
    try {
      await fetch(`${this.apiBase}/api/analytics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthToken()
        },
        body: JSON.stringify({
          event,
          data: {
            ...data,
            url: window.location.href,
            timestamp: new Date().toISOString(),
            screen_resolution: `${screen.width}x${screen.height}`,
            user_agent: navigator.userAgent,
            page_title: document.title
          }
        })
      });
    } catch (error) {
      console.warn('📊 Analytics tracking failed:', error);
    }
  }

  private getAuthToken(): string {
    const token = localStorage.getItem('auth_token');
    return token ? `Bearer ${token}` : '';
  }

  // Track page views
  trackPageView(page: string) {
    this.track('page_view', {
      page,
      referrer: document.referrer
    });
  }

  // Track user interactions
  trackButtonClick(button: string, context?: string) {
    this.track('button_click', {
      button,
      context,
      element_type: 'button'
    });
  }

  // Track form interactions
  trackFormSubmit(form: string, success: boolean, error?: string) {
    this.track('form_submit', {
      form_name: form,
      success,
      error: error || null
    });
  }

  // Track AI generation requests
  trackAIGeneration(prompt: string, framework: string, model: string) {
    this.track('ai_generation_request', {
      prompt_length: prompt.length,
      framework,
      model,
      request_type: 'frontend'
    });
  }

  // Track AI generation results
  trackAIGenerationResult(success: boolean, duration: number, error?: string) {
    this.track('ai_generation_result', {
      success,
      duration_ms: duration,
      error: error || null,
      source: 'frontend'
    });
  }

  // Track editor interactions
  trackEditorAction(action: string, language?: string, fileType?: string) {
    this.track('editor_action', {
      action, // 'open', 'edit', 'save', 'format', 'download'
      language,
      file_type: fileType
    });
  }

  // Track project operations
  trackProjectAction(action: string, projectId?: string) {
    this.track('project_action', {
      action, // 'create', 'open', 'save', 'delete', 'share'
      project_id: projectId
    });
  }

  // Track template usage
  trackTemplateUsage(templateId: string, templateName: string, action: string) {
    this.track('template_action', {
      template_id: templateId,
      template_name: templateName,
      action // 'view', 'use', 'preview'
    });
  }

  // Track errors
  trackError(error: string, context?: string, stack?: string) {
    this.track('frontend_error', {
      error,
      context,
      stack: stack || null,
      user_agent: navigator.userAgent,
      url: window.location.href
    });
  }

  // Track performance metrics
  trackPerformance(metric: string, value: number, context?: string) {
    this.track('performance_metric', {
      metric_name: metric,
      value,
      context,
      timestamp: performance.now()
    });
  }

  // Track user preferences changes
  trackPreferenceChange(preference: string, oldValue: any, newValue: any) {
    this.track('preference_change', {
      preference_name: preference,
      old_value: oldValue,
      new_value: newValue
    });
  }

  // Track search and filter actions
  trackSearch(query: string, results: number, context: string) {
    this.track('search_action', {
      query_length: query.length,
      results_count: results,
      context // 'templates', 'projects', 'help'
    });
  }

  // Track feature usage
  trackFeatureUsage(feature: string, context?: string) {
    this.track('feature_usage', {
      feature_name: feature,
      context
    });
  }

  // Track user session events
  trackSessionEvent(event: string, duration?: number) {
    this.track('session_event', {
      event_type: event, // 'start', 'end', 'idle', 'active'
      duration_ms: duration || null
    });
  }
}

// Create and export analytics instance
const analytics = new FrontendAnalytics(
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787'
);

export { analytics };
export type { AnalyticsData };