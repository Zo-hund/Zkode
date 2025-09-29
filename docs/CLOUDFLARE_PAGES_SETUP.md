# Cloudflare Pages Setup Guide

This guide walks you through setting up Cloudflare Pages for the ZKode frontend deployment.

## Prerequisites

✅ **Already Completed:**
- Cloudflare account setup
- Workers deployed to staging and production
- Database migrations completed
- Frontend build system configured

## Manual Setup Steps

### 1. Connect Your Repository to Cloudflare Pages

1. **Go to Cloudflare Dashboard**
   - Navigate to [dash.cloudflare.com](https://dash.cloudflare.com)
   - Go to "Pages" in the sidebar

2. **Create a New Project**
   - Click "Create a project"
   - Choose "Connect to Git"
   - Connect your GitHub account if not already connected
   - Select your ZKode repository

3. **Configure Build Settings**
   ```
   Framework preset: None
   Build command: npm run build:frontend:production
   Build output directory: frontend/dist
   Root directory: (leave empty)
   ```

4. **Environment Variables**
   Set these environment variables in the Pages settings:
   ```
   VITE_API_BASE_URL=https://zkode-prod.marioduerson34.workers.dev
   VITE_ENVIRONMENT=production
   ```

### 2. Set Up Staging Environment

1. **Create Staging Branch Deployment**
   - In your Pages project settings
   - Go to "Settings" → "Builds & deployments"
   - Add a new branch: `staging` or `develop`

2. **Configure Staging Build**
   ```
   Build command: npm run build:frontend:staging
   Build output directory: frontend/dist
   ```

3. **Staging Environment Variables**
   ```
   VITE_API_BASE_URL=https://zkode-staging.marioduerson34.workers.dev
   VITE_ENVIRONMENT=staging
   ```

### 3. Custom Domain Setup (Optional)

1. **Add Custom Domain**
   - In Pages project → "Custom domains"
   - Add your domain: `zkode.app` (production)
   - Add subdomain: `staging.zkode.app` (staging)

2. **DNS Configuration**
   - For root domain (`zkode.app`):
     ```
     Type: CNAME
     Name: zkode.app
     Content: zkode-pages.pages.dev (or your Pages URL)
     ```

   - For staging subdomain (`staging.zkode.app`):
     ```
     Type: CNAME
     Name: staging
     Content: staging-branch.zkode-pages.pages.dev
     ```

### 4. Security Headers (Recommended)

Add these to your Pages project → "Settings" → "Functions" → "_headers":

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self' *.marioduerson34.workers.dev
```

## Automatic Deployment

Once configured, Cloudflare Pages will automatically:
- Deploy on every push to `main` (production)
- Deploy on every push to `staging` (staging environment)
- Generate preview deployments for pull requests

## Testing Deployments

After setup, test your deployments:

1. **Production**: https://zkode-pages.pages.dev (or your custom domain)
2. **Staging**: https://staging.zkode-pages.pages.dev (or staging.yourdomain.com)

## Verification Checklist

✅ Pages project created and connected to Git
✅ Build commands configured correctly
✅ Environment variables set for both environments
✅ Custom domains configured (if using)
✅ DNS records configured
✅ Security headers added
✅ Automatic deployments working
✅ Frontend can communicate with Workers APIs

## Troubleshooting

### Build Failures
- Check build logs in Pages dashboard
- Ensure Node.js version compatibility (18+)
- Verify build command paths are correct

### API Connection Issues
- Check environment variables are set correctly
- Verify CORS settings in Workers
- Test API endpoints directly

### Domain Issues
- Allow 24-48 hours for DNS propagation
- Use DNS checker tools to verify records
- Check SSL certificate status in dashboard

## Next Steps

After Pages setup is complete:
1. Test the complete user flow
2. Set up monitoring and alerting
3. Configure CI/CD if desired
4. Set up analytics and performance monitoring

---

**Current Status**:
- ✅ Workers deployed and tested
- ✅ Database migrations completed
- ✅ Frontend build system ready
- 🔄 Waiting for manual Pages setup

**APIs Available**:
- Production: https://zkode-prod.marioduerson34.workers.dev
- Staging: https://zkode-staging.marioduerson34.workers.dev