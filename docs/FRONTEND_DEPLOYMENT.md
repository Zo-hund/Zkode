# ZKode Frontend Deployment Guide - Cloudflare Pages

This guide covers deploying the ZKode React frontend to Cloudflare Pages to complete the full-stack platform.

## Prerequisites ✅ Already Complete

- ✅ Backend APIs deployed and operational
- ✅ Frontend builds tested and working
- ✅ Environment-specific configurations ready
- ✅ Cloudflare account authenticated

## Deployment Options

### Option A: Git Integration (Recommended) ⭐

#### Step 1: Create Cloudflare Pages Project

1. **Access Cloudflare Dashboard**:
   ```bash
   # Navigate to: https://dash.cloudflare.com/
   # Go to: Pages → Create a project
   ```

2. **Connect Git Repository**:
   - Select "Connect to Git"
   - Choose your ZKode repository
   - Grant necessary permissions

#### Step 2: Configure Build Settings

**Production Environment**:
```yaml
Project name: zkode-frontend
Branch: main
Framework preset: React
Build command: npm run build:frontend:production
Build output directory: frontend/dist
Root directory: /
```

**Environment Variables**:
```bash
VITE_API_BASE_URL=https://zkode-prod.marioduerson34.workers.dev
VITE_ENVIRONMENT=production
```

#### Step 3: Set Up Staging Environment

**Staging Environment**:
```yaml
Project name: zkode-frontend-staging
Branch: develop (or staging)
Framework preset: React
Build command: npm run build:frontend:staging
Build output directory: frontend/dist
Root directory: /
```

**Environment Variables**:
```bash
VITE_API_BASE_URL=https://zkode-staging.marioduerson34.workers.dev
VITE_ENVIRONMENT=staging
```

### Option B: Manual Upload

If you prefer manual deployment:

1. **Build for Production**:
   ```bash
   npm run build:frontend:production
   ```

2. **Upload to Pages**:
   ```bash
   npx wrangler pages publish frontend/dist --project-name zkode-frontend
   ```

## Custom Domain Configuration

### Step 1: Add Custom Domains

1. **Production Domain Setup**:
   - Go to Pages project → Custom domains
   - Add domain: `zkode.app`
   - Add www subdomain: `www.zkode.app` → redirect to `zkode.app`

2. **Staging Domain Setup**:
   - Add domain: `staging.zkode.app`

### Step 2: DNS Configuration

Update your domain's DNS settings:

```dns
# For zkode.app
Type: CNAME
Name: zkode.app (or @)
Value: zkode-frontend.pages.dev

# For staging
Type: CNAME
Name: staging
Value: zkode-frontend-staging.pages.dev
```

### Step 3: SSL Configuration

✅ **Automatic**: Cloudflare handles SSL certificates automatically

## API Endpoint Mapping

Ensure your frontend environment variables match your deployed APIs:

| Environment | Frontend URL | API URL |
|-------------|--------------|---------|
| Production | `https://zkode.app` | `https://zkode-prod.marioduerson34.workers.dev` |
| Staging | `https://staging.zkode.app` | `https://zkode-staging.marioduerson34.workers.dev` |

## Build Verification

Test your builds locally before deploying:

### Production Build Test
```bash
# Build for production
npm run build:frontend:production

# Preview locally
cd frontend && npm run preview
# Visit: http://localhost:4173
```

### Staging Build Test
```bash
# Build for staging
npm run build:frontend:staging

# Preview locally
cd frontend && npm run preview
# Visit: http://localhost:4173
```

## CORS Configuration

Ensure your Worker APIs allow requests from your frontend domains:

```javascript
// In your worker.js CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Or specify your domains
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
```

## Deployment Checklist

### Pre-Deployment ✅
- [x] Backend APIs tested and operational
- [x] Frontend builds working locally
- [x] Environment variables configured
- [x] API endpoints accessible

### Deployment Steps 🚀
- [ ] Create Cloudflare Pages project
- [ ] Configure build settings
- [ ] Set environment variables
- [ ] Deploy to staging
- [ ] Test staging deployment
- [ ] Deploy to production
- [ ] Configure custom domains
- [ ] Update DNS settings
- [ ] Verify SSL certificates

### Post-Deployment ✅
- [ ] Test full user registration flow
- [ ] Verify AI code generation
- [ ] Test Monaco editor functionality
- [ ] Validate cross-browser compatibility
- [ ] Confirm mobile responsiveness
- [ ] Performance testing

## Troubleshooting

### Common Issues

1. **Build Failures**:
   ```bash
   # Check build locally first
   npm run build:frontend:production

   # Check for TypeScript errors
   cd frontend && npm run build
   ```

2. **API Connection Issues**:
   - Verify environment variables in Pages dashboard
   - Check CORS settings in Worker
   - Validate API endpoints are accessible

3. **Custom Domain Issues**:
   - Verify DNS propagation (can take up to 24 hours)
   - Check SSL certificate status
   - Ensure CNAME points to correct Pages URL

### Performance Optimization

1. **Enable Cloudflare Features**:
   - Auto Minify (CSS, HTML, JS)
   - Brotli compression
   - HTTP/2 and HTTP/3
   - Image optimization

2. **Monitor Performance**:
   - Use Cloudflare Analytics
   - Monitor Core Web Vitals
   - Track user interactions

## Success Validation

Your deployment is successful when:

✅ **Frontend loads** at your custom domain
✅ **User registration works** end-to-end
✅ **AI code generation functions** through the UI
✅ **Monaco editor renders** and accepts input
✅ **Projects save and load** correctly
✅ **Authentication persists** across sessions
✅ **Mobile responsive** design works
✅ **Performance** meets targets (<3s load time)

## Next Steps After Deployment

1. **Monitor and Optimize**:
   - Set up monitoring dashboards
   - Track user analytics
   - Monitor error rates

2. **Security Enhancements**:
   - Implement rate limiting
   - Add security headers
   - Set up DDoS protection

3. **Feature Enhancements**:
   - Add more AI models
   - Implement project sharing
   - Add collaboration features

---

**Ready to launch ZKode to the world!** 🚀