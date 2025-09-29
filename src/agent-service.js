/**
 * AI Agent Service for ZKode Platform
 * Manages specialized AI agents for different development tasks
 */

export class AgentService {
  constructor(env) {
    this.env = env;
    this.db = env.DB;

    // Define available agents
    this.agents = {
      'code-reviewer': {
        name: 'Code Reviewer',
        description: 'Analyzes code quality, security, and best practices',
        icon: '🔍',
        specialty: 'code-analysis',
        systemPrompt: this.getCodeReviewerPrompt(),
        capabilities: ['security-scan', 'performance-analysis', 'best-practices', 'bug-detection']
      },
      'performance-optimizer': {
        name: 'Performance Optimizer',
        description: 'Optimizes code for speed, efficiency, and resource usage',
        icon: '⚡',
        specialty: 'optimization',
        systemPrompt: this.getPerformanceOptimizerPrompt(),
        capabilities: ['speed-optimization', 'memory-optimization', 'bundle-size', 'caching']
      },
      'security-auditor': {
        name: 'Security Auditor',
        description: 'Identifies security vulnerabilities and provides fixes',
        icon: '🛡️',
        specialty: 'security',
        systemPrompt: this.getSecurityAuditorPrompt(),
        capabilities: ['vulnerability-scan', 'xss-protection', 'csrf-protection', 'input-validation']
      },
      'design-critic': {
        name: 'Design Critic',
        description: 'Provides UI/UX feedback and design improvements',
        icon: '🎨',
        specialty: 'design',
        systemPrompt: this.getDesignCriticPrompt(),
        capabilities: ['ui-analysis', 'accessibility', 'color-theory', 'layout-optimization']
      },
      'testing-agent': {
        name: 'Testing Agent',
        description: 'Generates comprehensive tests and testing strategies',
        icon: '🧪',
        specialty: 'testing',
        systemPrompt: this.getTestingAgentPrompt(),
        capabilities: ['unit-tests', 'integration-tests', 'e2e-tests', 'test-coverage']
      },
      'accessibility-expert': {
        name: 'Accessibility Expert',
        description: 'Ensures applications are accessible to all users',
        icon: '♿',
        specialty: 'accessibility',
        systemPrompt: this.getAccessibilityExpertPrompt(),
        capabilities: ['aria-labels', 'keyboard-navigation', 'screen-readers', 'wcag-compliance']
      }
    };
  }

  /**
   * Get all available agents
   */
  getAvailableAgents() {
    return Object.entries(this.agents).map(([key, agent]) => ({
      id: key,
      ...agent
    }));
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId) {
    const agent = this.agents[agentId];
    return agent ? { id: agentId, ...agent } : null;
  }

  /**
   * Execute agent task
   */
  async executeAgent(agentId, task, context = {}) {
    const agent = this.agents[agentId];
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const { AIService } = await import('./ai-service.js');
    const aiService = new AIService(this.env);

    // Build context-aware prompt
    const fullPrompt = this.buildAgentPrompt(agent, task, context);

    // Use specialized model based on agent type
    const modelPreference = this.getPreferredModel(agent.specialty);

    console.log(`🤖 Agent ${agent.name} executing task with model: ${modelPreference}`);

    try {
      const result = await aiService.generateApplication(fullPrompt, 'html', modelPreference);

      // Post-process result based on agent type
      const processedResult = await this.processAgentResult(agentId, result, context);

      return {
        agent: agentId,
        agentName: agent.name,
        task,
        result: processedResult,
        timestamp: new Date().toISOString(),
        success: true
      };
    } catch (error) {
      console.error(`Agent ${agentId} execution failed:`, error);
      return {
        agent: agentId,
        agentName: agent.name,
        task,
        error: error.message,
        timestamp: new Date().toISOString(),
        success: false
      };
    }
  }

  /**
   * Execute multiple agents in sequence (workflow)
   */
  async executeWorkflow(workflow, initialContext = {}) {
    const results = [];
    let context = { ...initialContext };

    for (const step of workflow.steps) {
      const { agentId, task, dependsOn } = step;

      // Check dependencies
      if (dependsOn && dependsOn.length > 0) {
        const dependencies = results.filter(r => dependsOn.includes(r.agent));
        if (dependencies.length !== dependsOn.length) {
          throw new Error(`Missing dependencies for step ${agentId}`);
        }

        // Add dependency results to context
        context.dependencies = dependencies;
      }

      const result = await this.executeAgent(agentId, task, context);
      results.push(result);

      // Update context with result
      if (result.success) {
        context[agentId] = result.result;
      }
    }

    return {
      workflow: workflow.name,
      steps: workflow.steps.length,
      results,
      success: results.every(r => r.success),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get preferred model for agent specialty
   */
  getPreferredModel(specialty) {
    const modelMap = {
      'code-analysis': 'code-advanced',
      'optimization': 'code-advanced',
      'security': 'code-advanced',
      'design': 'creative',
      'testing': 'code',
      'accessibility': 'balanced'
    };

    return modelMap[specialty] || 'balanced';
  }

  /**
   * Build context-aware prompt for agent
   */
  buildAgentPrompt(agent, task, context) {
    let prompt = `${agent.systemPrompt}\n\n`;
    prompt += `TASK: ${task}\n\n`;

    // Add context information
    if (context.files) {
      prompt += `EXISTING CODE:\n`;
      Object.entries(context.files).forEach(([filename, content]) => {
        prompt += `\n=== ${filename} ===\n${content}\n`;
      });
    }

    if (context.framework) {
      prompt += `\nFRAMEWORK: ${context.framework}\n`;
    }

    if (context.requirements) {
      prompt += `\nREQUIREMENTS: ${context.requirements.join(', ')}\n`;
    }

    if (context.dependencies) {
      prompt += `\nPREVIOUS AGENT RESULTS:\n`;
      context.dependencies.forEach(dep => {
        prompt += `- ${dep.agentName}: ${dep.result.summary || 'Completed'}\n`;
      });
    }

    return prompt;
  }

  /**
   * Process agent result based on agent type
   */
  async processAgentResult(agentId, result, context) {
    switch (agentId) {
      case 'code-reviewer':
        return this.processCodeReviewResult(result);
      case 'performance-optimizer':
        return this.processOptimizationResult(result);
      case 'security-auditor':
        return this.processSecurityResult(result);
      case 'design-critic':
        return this.processDesignResult(result);
      case 'testing-agent':
        return this.processTestingResult(result);
      case 'accessibility-expert':
        return this.processAccessibilityResult(result);
      default:
        return result;
    }
  }

  /**
   * Process code review results
   */
  processCodeReviewResult(result) {
    // Extract issues, suggestions, and ratings from the AI response
    const content = result.files ? Object.values(result.files).join('\n') : result.description;

    return {
      type: 'code-review',
      summary: result.description || 'Code review completed',
      issues: this.extractIssues(content),
      suggestions: this.extractSuggestions(content),
      rating: this.extractRating(content),
      files: result.files,
      recommendations: this.extractRecommendations(content)
    };
  }

  /**
   * Process optimization results
   */
  processOptimizationResult(result) {
    return {
      type: 'optimization',
      summary: result.description || 'Performance optimization completed',
      optimizations: this.extractOptimizations(result),
      beforeAfter: this.extractBeforeAfter(result),
      metrics: this.extractMetrics(result),
      files: result.files
    };
  }

  /**
   * Process security audit results
   */
  processSecurityResult(result) {
    const content = result.files ? Object.values(result.files).join('\n') : result.description;

    return {
      type: 'security-audit',
      summary: result.description || 'Security audit completed',
      vulnerabilities: this.extractVulnerabilities(content),
      fixes: this.extractFixes(content),
      securityScore: this.extractSecurityScore(content),
      files: result.files
    };
  }

  /**
   * Process design feedback results
   */
  processDesignResult(result) {
    return {
      type: 'design-feedback',
      summary: result.description || 'Design review completed',
      feedback: this.extractDesignFeedback(result),
      improvements: this.extractDesignImprovements(result),
      accessibilityScore: this.extractAccessibilityScore(result),
      files: result.files
    };
  }

  /**
   * Process testing results
   */
  processTestingResult(result) {
    return {
      type: 'testing',
      summary: result.description || 'Test generation completed',
      testFiles: result.files,
      coverage: this.extractCoverage(result),
      testTypes: this.extractTestTypes(result),
      recommendations: this.extractTestRecommendations(result)
    };
  }

  /**
   * Process accessibility results
   */
  processAccessibilityResult(result) {
    return {
      type: 'accessibility',
      summary: result.description || 'Accessibility audit completed',
      violations: this.extractA11yViolations(result),
      improvements: this.extractA11yImprovements(result),
      wcagLevel: this.extractWcagLevel(result),
      files: result.files
    };
  }

  // Helper methods for extracting specific information from AI responses
  extractIssues(content) {
    // Simple extraction - in production, this would use more sophisticated parsing
    const issues = [];
    const lines = content.split('\n');
    lines.forEach(line => {
      if (line.includes('issue:') || line.includes('problem:') || line.includes('bug:')) {
        issues.push(line.trim());
      }
    });
    return issues;
  }

  extractSuggestions(content) {
    const suggestions = [];
    const lines = content.split('\n');
    lines.forEach(line => {
      if (line.includes('suggest:') || line.includes('recommend:') || line.includes('improve:')) {
        suggestions.push(line.trim());
      }
    });
    return suggestions;
  }

  extractRating(content) {
    const match = content.match(/rating[:\s]+(\d+(?:\.\d+)?)/i);
    return match ? parseFloat(match[1]) : null;
  }

  extractRecommendations(content) {
    // Extract recommendations from content
    return [];
  }

  extractOptimizations(result) {
    // Extract optimization details
    return [];
  }

  extractBeforeAfter(result) {
    // Extract before/after comparison
    return null;
  }

  extractMetrics(result) {
    // Extract performance metrics
    return {};
  }

  extractVulnerabilities(content) {
    // Extract security vulnerabilities
    return [];
  }

  extractFixes(content) {
    // Extract security fixes
    return [];
  }

  extractSecurityScore(content) {
    // Extract security score
    return null;
  }

  extractDesignFeedback(result) {
    // Extract design feedback
    return [];
  }

  extractDesignImprovements(result) {
    // Extract design improvements
    return [];
  }

  extractAccessibilityScore(result) {
    // Extract accessibility score
    return null;
  }

  extractCoverage(result) {
    // Extract test coverage information
    return null;
  }

  extractTestTypes(result) {
    // Extract types of tests generated
    return [];
  }

  extractTestRecommendations(result) {
    // Extract testing recommendations
    return [];
  }

  extractA11yViolations(result) {
    // Extract accessibility violations
    return [];
  }

  extractA11yImprovements(result) {
    // Extract accessibility improvements
    return [];
  }

  extractWcagLevel(result) {
    // Extract WCAG compliance level
    return null;
  }

  /**
   * Agent system prompts
   */
  getCodeReviewerPrompt() {
    return `You are an expert Code Reviewer AI agent for ZKode. Your role is to analyze code quality, identify issues, and provide constructive feedback.

RESPONSIBILITIES:
1. Review code for bugs, security vulnerabilities, and performance issues
2. Check adherence to best practices and coding standards
3. Identify opportunities for refactoring and improvement
4. Provide specific, actionable feedback with examples
5. Rate code quality on a scale of 1-10

ANALYSIS AREAS:
- Code structure and organization
- Performance implications
- Security vulnerabilities
- Error handling
- Code readability and maintainability
- Best practices compliance
- Potential bugs or edge cases

OUTPUT FORMAT:
Provide a comprehensive review including:
- Overall rating (1-10)
- List of identified issues with severity levels
- Specific improvement suggestions
- Code examples for fixes
- Best practice recommendations

Be constructive, specific, and educational in your feedback.`;
  }

  getPerformanceOptimizerPrompt() {
    return `You are a Performance Optimizer AI agent for ZKode. Your expertise is in identifying and implementing performance improvements for web applications.

RESPONSIBILITIES:
1. Analyze code for performance bottlenecks
2. Optimize loading times and runtime performance
3. Reduce bundle size and memory usage
4. Implement caching strategies
5. Optimize database queries and API calls

OPTIMIZATION AREAS:
- JavaScript performance (loops, algorithms, DOM manipulation)
- CSS optimization (selectors, animations, layout)
- HTML structure and semantic improvements
- Resource loading optimization
- Caching strategies
- Bundle size reduction
- Memory leak prevention

OUTPUT FORMAT:
Provide optimized code with:
- Performance improvements implemented
- Before/after performance metrics
- Explanation of optimizations made
- Additional recommendations
- Performance monitoring suggestions

Focus on measurable improvements and modern web performance best practices.`;
  }

  getSecurityAuditorPrompt() {
    return `You are a Security Auditor AI agent for ZKode. Your mission is to identify and fix security vulnerabilities in web applications.

RESPONSIBILITIES:
1. Scan for common security vulnerabilities
2. Identify XSS, CSRF, and injection attack vectors
3. Review authentication and authorization logic
4. Check for sensitive data exposure
5. Ensure secure coding practices

SECURITY CHECKS:
- Input validation and sanitization
- XSS prevention
- CSRF protection
- SQL injection prevention
- Authentication security
- Authorization controls
- Data encryption and protection
- Secure communication (HTTPS)
- Content Security Policy
- OWASP Top 10 compliance

OUTPUT FORMAT:
Provide a security report with:
- Identified vulnerabilities with severity ratings
- Specific fixes for each vulnerability
- Secure code examples
- Security best practices implementation
- Compliance recommendations

Prioritize critical security issues and provide immediate actionable fixes.`;
  }

  getDesignCriticPrompt() {
    return `You are a Design Critic AI agent for ZKode. Your expertise is in UI/UX design, visual hierarchy, and user experience optimization.

RESPONSIBILITIES:
1. Evaluate user interface design and usability
2. Review visual hierarchy and layout
3. Assess color schemes and typography
4. Check responsive design implementation
5. Provide accessibility improvements

DESIGN EVALUATION AREAS:
- Visual hierarchy and layout
- Color theory and contrast
- Typography and readability
- Spacing and alignment
- Interactive element design
- Responsive design
- Accessibility compliance
- User experience flow
- Modern design trends
- Brand consistency

OUTPUT FORMAT:
Provide design feedback with:
- Overall design assessment
- Specific UI/UX improvements
- Enhanced CSS with design improvements
- Accessibility enhancements
- Mobile responsiveness optimizations
- Color and typography recommendations

Focus on creating intuitive, accessible, and visually appealing interfaces.`;
  }

  getTestingAgentPrompt() {
    return `You are a Testing Agent AI for ZKode. Your specialty is creating comprehensive test suites and testing strategies for web applications.

RESPONSIBILITIES:
1. Generate unit tests for functions and components
2. Create integration tests for features
3. Design end-to-end test scenarios
4. Implement test automation strategies
5. Ensure high test coverage

TESTING AREAS:
- Unit testing (functions, components, modules)
- Integration testing (API calls, data flow)
- End-to-end testing (user workflows)
- Performance testing
- Security testing
- Accessibility testing
- Cross-browser testing
- Mobile testing

OUTPUT FORMAT:
Provide comprehensive tests including:
- Unit test files with Jest/Mocha syntax
- Integration test scenarios
- E2E test scripts
- Test data and mocks
- Coverage reports and recommendations
- Testing best practices

Generate practical, maintainable tests that ensure code quality and reliability.`;
  }

  getAccessibilityExpertPrompt() {
    return `You are an Accessibility Expert AI agent for ZKode. Your mission is to ensure web applications are accessible to all users, including those with disabilities.

RESPONSIBILITIES:
1. Audit applications for accessibility compliance
2. Implement WCAG 2.1 guidelines
3. Ensure keyboard navigation support
4. Optimize for screen readers
5. Improve overall inclusive design

ACCESSIBILITY AREAS:
- ARIA labels and roles
- Keyboard navigation
- Screen reader compatibility
- Color contrast and visual accessibility
- Focus management
- Alternative text for images
- Form accessibility
- Semantic HTML structure
- Error handling and feedback
- WCAG 2.1 AA compliance

OUTPUT FORMAT:
Provide accessibility improvements with:
- WCAG compliance audit results
- Specific accessibility violations and fixes
- Enhanced HTML with proper ARIA attributes
- Keyboard navigation improvements
- Screen reader optimizations
- Color contrast enhancements
- Accessibility testing recommendations

Ensure the application is usable by everyone, regardless of ability.`;
  }
}