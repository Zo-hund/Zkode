#!/bin/bash

# ZKode Frontend Deployment Script
# Deploys frontend to Cloudflare Pages

set -e

echo "🚀 ZKode Frontend Deployment Script"
echo "===================================="

# Check environment parameter
ENVIRONMENT=${1:-staging}

if [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "production" ]; then
    echo "❌ Invalid environment. Use 'staging' or 'production'"
    exit 1
fi

echo "📦 Environment: $ENVIRONMENT"

# Build frontend for the specified environment
echo "🔨 Building frontend for $ENVIRONMENT..."
cd frontend
npm run build:$ENVIRONMENT

echo "✅ Build completed successfully!"

# Deploy to Cloudflare Pages
if [ "$ENVIRONMENT" = "production" ]; then
    PROJECT_NAME="zkode-frontend"
    echo "🚀 Deploying to production Pages project: $PROJECT_NAME"
else
    PROJECT_NAME="zkode-frontend-staging"
    echo "🚀 Deploying to staging Pages project: $PROJECT_NAME"
fi

# Deploy using wrangler pages
echo "📤 Uploading to Cloudflare Pages..."
npx wrangler pages publish dist --project-name $PROJECT_NAME

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Check deployment status in Cloudflare Dashboard"
echo "   2. Configure custom domain if needed"
echo "   3. Test the deployed application"
echo ""

if [ "$ENVIRONMENT" = "production" ]; then
    echo "🌍 Your app will be available at:"
    echo "   - Pages URL: https://$PROJECT_NAME.pages.dev"
    echo "   - Custom domain: https://zkode.app (if configured)"
else
    echo "🧪 Your staging app will be available at:"
    echo "   - Pages URL: https://$PROJECT_NAME.pages.dev"
    echo "   - Custom domain: https://staging.zkode.app (if configured)"
fi

echo ""
echo "✨ ZKode frontend deployment complete! ✨"