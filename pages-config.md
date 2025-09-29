# Cloudflare Pages Configuration

## Production Environment

### Build Settings
```
Framework preset: None
Build command: npm run build:frontend:production
Build output directory: frontend/dist
Root directory: (leave empty)
Node.js version: 18
```

### Environment Variables
```
VITE_API_BASE_URL=https://zkode-prod.marioduerson34.workers.dev
VITE_ENVIRONMENT=production
```

## Staging Environment (Branch: staging)

### Build Settings
```
Framework preset: None
Build command: npm run build:frontend:staging
Build output directory: frontend/dist
Root directory: (leave empty)
Node.js version: 18
```

### Environment Variables
```
VITE_API_BASE_URL=https://zkode-staging.marioduerson34.workers.dev
VITE_ENVIRONMENT=staging
```

## Build Commands Available

- `npm run build:frontend:production` - Production build with prod API endpoints
- `npm run build:frontend:staging` - Staging build with staging API endpoints
- `npm run build:frontend` - Default build (development)

## Security Headers

Security headers are automatically configured via `frontend/public/_headers` file:
- CSP policy allowing communication with Workers APIs
- Standard security headers (XSS protection, frame options, etc.)
- Permissions policy restricting unnecessary browser features

## Deployment Flow

1. **Main branch** → Production deployment
2. **Staging branch** → Staging deployment
3. **Pull requests** → Preview deployments (automatic)

## Testing URLs

Once deployed:
- **Production**: `https://[random-id].pages.dev`
- **Staging**: `https://staging.[random-id].pages.dev`

You can also set up custom domains later if desired.