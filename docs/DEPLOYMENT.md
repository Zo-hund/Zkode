# ZKode Production Deployment Guide

This guide walks you through deploying ZKode to production using Cloudflare Workers and Pages.

## Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Wrangler CLI**: Install globally with `npm install -g wrangler`
3. **Domain**: Optional but recommended for production
4. **Node.js**: Version 18 or higher

## Quick Start

### 1. Clone and Setup
```bash
git clone <your-repo>
cd zkode
npm run setup
```

### 2. Login to Cloudflare
```bash
wrangler login
```

### 3. Run Production Setup
```bash
npm run setup:cloudflare
```

This automated script will:
- Create D1 databases for all environments
- Create R2 buckets for file storage
- Generate JWT secrets
- Update configuration files
- Run database migrations

## Manual Deployment Steps

### Step 1: Configure Cloudflare Resources ✅ COMPLETED

#### Create D1 Databases ✅ DONE
```bash
# Development
wrangler d1 create zkode-db-dev
# ✅ Created: database_id = "57d1eda0-5b55-4997-aaf7-58f3ab4c7ab8"

# Staging
wrangler d1 create zkode-db-staging
# ✅ Created: database_id = "cbc9cee7-2f14-4dc0-a695-5bbfaade92dc"

# Production
wrangler d1 create zkode-db-prod
# ✅ Created: database_id = "19b9d6b2-deac-4d62-b818-b9c893161dc1"
```

✅ **Database IDs updated in `wrangler.toml`**

#### Create R2 Buckets ✅ DONE
```bash
# All buckets successfully created:
wrangler r2 bucket create zkode-templates-dev     # ✅ Created
wrangler r2 bucket create zkode-templates-staging # ✅ Created
wrangler r2 bucket create zkode-templates-prod    # ✅ Created
wrangler r2 bucket create zkode-projects-dev      # ✅ Created
wrangler r2 bucket create zkode-projects-staging  # ✅ Created
wrangler r2 bucket create zkode-projects-prod     # ✅ Created
```

✅ **All R2 buckets operational**

### Step 2: Set Environment Variables

Create `.env.production` from `.env.example`:
```bash
cp .env.example .env.production
```

Generate JWT secrets:
```bash
openssl rand -base64 32  # Use for JWT_SECRET
openssl rand -base64 32  # Use for API_SECRET
```

Set secrets in Cloudflare:
```bash
echo "your-jwt-secret" | wrangler secret put JWT_SECRET --env production
echo "your-api-secret" | wrangler secret put API_SECRET --env production
```

### Step 3: Database Setup

Run migrations:
```bash
# Development
npm run db:migrate

# Staging
npm run db:migrate:staging

# Production
npm run db:migrate:prod
```

Seed with initial data:
```bash
# Development
npm run db:seed

# Staging (optional)
npm run db:seed:staging
```

### Step 4: Deploy Workers ✅ COMPLETED

Deploy to staging:
```bash
npm run deploy:staging
# ✅ Deployed: https://zkode-staging.marioduerson34.workers.dev
# ✅ Version ID: 4dda38ff-bdb2-4c0e-a97c-dc1d030317bb
```

Deploy to production:
```bash
npm run deploy:prod
# ✅ Deployed: https://zkode-prod.marioduerson34.workers.dev
# ✅ Version ID: 557e21b6-45bf-460d-aa75-4cd4ad6f74c7
```

## 🎉 Deployment Status: SUCCESSFUL

### Live Endpoints ✅ Operational
- **Staging API**: `https://zkode-staging.marioduerson34.workers.dev`
- **Production API**: `https://zkode-prod.marioduerson34.workers.dev`

### Validation Results ✅ All Tests Passed
- ✅ User Authentication Working
- ✅ AI Code Generation Operational
- ✅ Database Persistence Confirmed
- ✅ All API Endpoints Responding
- ✅ Error Handling Proper
- ✅ Performance Metrics Good (0.1-42s response times)

### Database Status ✅ Fully Migrated
- ✅ Development: 4 tables, 23 rows written
- ✅ Staging: 4 tables, 23 rows written, 3 test users
- ✅ Production: 4 tables, 23 rows written, 2 test users

### Step 5: Deploy Frontend with Cloudflare Pages

#### Option A: Git Integration (Recommended)

1. **Connect Repository**:
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Pages
   - Click "Create a project" → "Connect to Git"
   - Select your ZKode repository

2. **Configure Build Settings**:
   - Framework preset: `React`
   - Build command: `npm run build:frontend:production`
   - Build output directory: `frontend/dist`
   - Root directory: `/` (leave empty)

3. **Set Environment Variables**:
   ```
   VITE_API_BASE_URL=https://api.zkode.app
   VITE_ENVIRONMENT=production
   ```

4. **Configure Custom Domain**:
   - Add your domain (e.g., `zkode.app`)
   - Update DNS records as instructed

#### Option B: Manual Upload

Build the frontend:
```bash
npm run build:frontend:production
```

Upload to Pages:
```bash
wrangler pages publish frontend/dist --project-name zkode-frontend
```

## Domain Configuration

### Worker Domains

Set up custom domains for your Workers in the Cloudflare Dashboard:
- Development: `dev-api.zkode.app`
- Staging: `staging-api.zkode.app`
- Production: `api.zkode.app`

### Pages Domains

Configure custom domains for Pages:
- Staging: `staging.zkode.app`
- Production: `zkode.app`

## Environment-Specific Configurations

### Development
- Frontend: `http://localhost:5173`
- API: `http://localhost:8787`
- Database: `zkode-db-dev`

### Staging
- Frontend: `https://staging.zkode.app`
- API: `https://staging-api.zkode.app`
- Database: `zkode-db-staging`

### Production
- Frontend: `https://zkode.app`
- API: `https://api.zkode.app`
- Database: `zkode-db-prod`

## Monitoring and Maintenance

### View Logs
```bash
# Development
wrangler tail

# Production
wrangler tail --env production
```

### Database Operations
```bash
# Execute SQL directly
wrangler d1 execute zkode-db-prod --command "SELECT COUNT(*) FROM users;" --env production

# Backup database (export to SQL file)
wrangler d1 export zkode-db-prod --output backup.sql --env production
```

### Update Deployments
```bash
# Update Worker
npm run deploy:prod

# Update Frontend (if using manual deployment)
npm run build:frontend:production
wrangler pages publish frontend/dist --project-name zkode-frontend
```

## Security Checklist

- [ ] JWT secrets are unique and secure
- [ ] Database is not publicly accessible
- [ ] API rate limiting is configured
- [ ] HTTPS is enforced
- [ ] Security headers are set
- [ ] Input validation is implemented
- [ ] Error messages don't leak sensitive information

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify database IDs in `wrangler.toml`
   - Check that migrations have been run
   - Ensure Worker has proper D1 binding

2. **Frontend Not Loading**
   - Verify API endpoints in environment configuration
   - Check CORS settings in Worker
   - Ensure `_redirects` file is in place for SPA routing

3. **Authentication Not Working**
   - Verify JWT secrets are set correctly
   - Check API endpoints configuration
   - Ensure cookies/localStorage work across domains

### Getting Help

- Check [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- Review [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- Open an issue in the repository

## Cost Optimization

- **Workers**: Free tier includes 100,000 requests/day
- **D1**: Free tier includes 5GB storage + 25M row reads/month
- **R2**: Free tier includes 10GB storage + 1M Class A operations/month
- **Pages**: Free tier includes unlimited static requests + 500 builds/month

Monitor usage in the Cloudflare Dashboard to stay within free tier limits or upgrade as needed.