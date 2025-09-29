#!/bin/bash

# ZKode Cloudflare Setup Script
# This script helps set up R2 buckets and production environment

echo "🚀 Setting up ZKode Cloudflare Environment"
echo "=========================================="

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Login to Cloudflare (if not already logged in)
echo "🔐 Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "Please login to Cloudflare:"
    wrangler login
fi

# Create R2 buckets for different environments
echo "📦 Creating R2 buckets..."

# Development buckets
echo "Creating development buckets..."
wrangler r2 bucket create zkode-templates-dev 2>/dev/null || echo "⚠️  zkode-templates-dev bucket already exists"
wrangler r2 bucket create zkode-projects-dev 2>/dev/null || echo "⚠️  zkode-projects-dev bucket already exists"

# Staging buckets
echo "Creating staging buckets..."
wrangler r2 bucket create zkode-templates-staging 2>/dev/null || echo "⚠️  zkode-templates-staging bucket already exists"
wrangler r2 bucket create zkode-projects-staging 2>/dev/null || echo "⚠️  zkode-projects-staging bucket already exists"

# Production buckets
echo "Creating production buckets..."
wrangler r2 bucket create zkode-templates-prod 2>/dev/null || echo "⚠️  zkode-templates-prod bucket already exists"
wrangler r2 bucket create zkode-projects-prod 2>/dev/null || echo "⚠️  zkode-projects-prod bucket already exists"

# Upload initial templates to buckets
echo "📁 Uploading initial templates..."
for template in templates/*.json; do
    if [ -f "$template" ]; then
        filename=$(basename "$template")
        echo "Uploading $filename..."
        wrangler r2 object put zkode-templates-dev/templates/$filename --file="$template" 2>/dev/null || echo "⚠️  Failed to upload $filename to dev"
        wrangler r2 object put zkode-templates-staging/templates/$filename --file="$template" 2>/dev/null || echo "⚠️  Failed to upload $filename to staging"
        wrangler r2 object put zkode-templates-prod/templates/$filename --file="$template" 2>/dev/null || echo "⚠️  Failed to upload $filename to prod"
    fi
done

# Get account ID
echo "🔍 Getting Cloudflare account ID..."
ACCOUNT_ID=$(wrangler whoami | grep "Account ID" | awk '{print $3}' || echo "")

if [ -n "$ACCOUNT_ID" ]; then
    echo "✅ Account ID: $ACCOUNT_ID"
    echo "📝 Updating wrangler.toml with your account ID..."
    sed -i.bak "s/your-account-id-here/$ACCOUNT_ID/g" wrangler.toml
    rm wrangler.toml.bak 2>/dev/null || true
else
    echo "⚠️  Could not automatically detect account ID. Please update wrangler.toml manually."
fi

echo ""
echo "✅ Cloudflare setup complete!"
echo ""
echo "Next steps:"
echo "1. Review wrangler.toml configuration"
echo "2. Deploy to staging: npm run deploy:staging"
echo "3. Deploy to production: npm run deploy:prod"
echo ""
echo "🔗 Useful commands:"
echo "   wrangler r2 bucket list                 # List all buckets"
echo "   wrangler r2 object list zkode-templates-dev  # List bucket contents"
echo "   npm run deploy:staging                  # Deploy to staging"
echo "   npm run deploy:prod                     # Deploy to production"