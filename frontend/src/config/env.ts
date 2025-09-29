// Environment configuration
declare const __API_BASE_URL__: string;
declare const __ENVIRONMENT__: string;

export const config = {
  apiBaseUrl: typeof __API_BASE_URL__ !== 'undefined' ? __API_BASE_URL__ : 'http://localhost:8787',
  environment: typeof __ENVIRONMENT__ !== 'undefined' ? __ENVIRONMENT__ : 'development',
  isDevelopment: (typeof __ENVIRONMENT__ !== 'undefined' ? __ENVIRONMENT__ : 'development') === 'development',
  isStaging: (typeof __ENVIRONMENT__ !== 'undefined' ? __ENVIRONMENT__ : 'development') === 'staging',
  isProduction: (typeof __ENVIRONMENT__ !== 'undefined' ? __ENVIRONMENT__ : 'development') === 'production'
};

// API endpoints
export const apiEndpoints = {
  auth: {
    login: `${config.apiBaseUrl}/api/auth/login`,
    register: `${config.apiBaseUrl}/api/auth/register`,
    profile: `${config.apiBaseUrl}/api/auth/profile`,
    preferences: `${config.apiBaseUrl}/api/auth/preferences`
  },
  ai: {
    generate: `${config.apiBaseUrl}/api/generate`
  },
  projects: {
    list: `${config.apiBaseUrl}/api/projects`,
    create: `${config.apiBaseUrl}/api/projects`,
    get: (id: string) => `${config.apiBaseUrl}/api/projects/${id}`,
    update: (id: string) => `${config.apiBaseUrl}/api/projects/${id}`,
    delete: (id: string) => `${config.apiBaseUrl}/api/projects/${id}`
  },
  templates: {
    list: `${config.apiBaseUrl}/api/templates`
  },
  deploy: `${config.apiBaseUrl}/api/deploy`
};

export default config;