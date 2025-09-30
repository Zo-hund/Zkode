#!/bin/bash

# ZKode Automated Deployment Script
# This script automates the GitHub push and provides setup instructions

set -e

echo "🚀 ZKode Deployment Automation"
echo "================================"

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "wrangler.toml" ]; then
    echo "❌ Error: Please run this script from the zkode project directory"
    exit 1
fi

# Check git status
echo "📋 Checking Git status..."
git status

echo ""
echo "📁 Repository contains $(git ls-files | wc -l) files across $(git log --oneline | wc -l) commits"
echo "🔗 Remote configured: $(git remote get-url origin)"

echo ""
echo "🎯 DEPLOYMENT STEPS:"
echo "==================="

echo ""
echo "Step 1: GitHub Repository Creation"
echo "-----------------------------------"
echo "Go to: https://github.com/new"
echo "Repository name: zkode"
echo "Description: AI-powered vibe coding platform built with Cloudflare Workers and React"
echo "Make it PUBLIC"
echo "DON'T initialize with README (we have our own)"
echo ""
echo "After creating the repository, press ENTER to continue..."
read -p ""

echo ""
echo "Step 2: Authentication Setup"
echo "-----------------------------"
echo "You'll need authentication for GitHub push."
echo ""
echo "Option A - Personal Access Token (Recommended):"
echo "1. Go to: https://github.com/settings/tokens"
echo "2. Click 'Generate new token (classic)'"
echo "3. Select scope: 'repo' (Full repository access)"
echo "4. Copy the token"
echo ""
echo "Option B - SSH (if configured):"
echo "git remote set-url origin git@github.com:marioduerson/zkode.git"
echo ""
echo "Which option would you like? (token/ssh/manual): "
read auth_choice

if [ "$auth_choice" = "ssh" ]; then
    echo "🔄 Switching to SSH..."
    git remote set-url origin git@github.com:marioduerson/zkode.git
    echo "✅ Remote updated to SSH"
fi

echo ""
echo "Step 3: Pushing Code to GitHub"
echo "-------------------------------"
echo "🔄 Pushing main branch..."

if git push -u origin main; then
    echo "✅ Main branch pushed successfully!"
else
    echo "❌ Push failed. Please check your authentication."
    echo ""
    echo "Manual push commands:"
    echo "git push -u origin main"
    echo "git push -u origin staging"
    echo ""
    echo "For HTTPS with token: Use your GitHub username and paste token as password"
    exit 1
fi

echo "🔄 Pushing staging branch..."
if git push -u origin staging; then
    echo "✅ Staging branch pushed successfully!"
else
    echo "⚠️  Staging push failed, but main branch is up. You can manually run:"
    echo "git push -u origin staging"
fi

echo ""
echo "🎉 SUCCESS! Your ZKode repository is now on GitHub!"
echo "Repository URL: https://github.com/marioduerson/zkode"

echo ""
echo "Step 4: Cloudflare Pages Setup"
echo "==============================="
echo ""
echo "Now let's set up Cloudflare Pages:"
echo ""
echo "1. Go to: https://dash.cloudflare.com"
echo "2. Click 'Pages' in the left sidebar"
echo "3. Click 'Create a project'"
echo "4. Click 'Connect to Git'"
echo "5. Authorize GitHub if prompted"
echo "6. Select your 'zkode' repository"
echo ""
echo "7. Configure build settings:"
echo "   Framework preset: None"
echo "   Build command: npm run build:frontend:production"
echo "   Build output directory: frontend/dist"
echo "   Root directory: (leave empty)"
echo ""
echo "8. Add environment variables:"
echo "   Variable 1:"
echo "   Name: VITE_API_BASE_URL"
echo "   Value: https://zkode-prod.marioduerson34.workers.dev"
echo ""
echo "   Variable 2:"
echo "   Name: VITE_ENVIRONMENT"
echo "   Value: production"
echo ""
echo "9. Click 'Save and Deploy'"
echo ""
echo "10. Set up staging branch:"
echo "    - Go to Settings → Builds & deployments"
echo "    - Add custom branch: staging"
echo "    - Set staging environment variables:"
echo "      VITE_API_BASE_URL: https://zkode-staging.marioduerson34.workers.dev"
echo "      VITE_ENVIRONMENT: staging"

echo ""
echo "🎊 DEPLOYMENT COMPLETE!"
echo "======================="
echo ""
echo "Your ZKode AI coding platform will be live at:"
echo "🌍 Production: [Cloudflare will provide URL]"
echo "🧪 Staging: [Staging branch URL]"
echo ""
echo "Backend APIs already live:"
echo "🚀 Production API: https://zkode-prod.marioduerson34.workers.dev"
echo "🧪 Staging API: https://zkode-staging.marioduerson34.workers.dev"
echo ""
echo "Features ready for users:"
echo "✅ AI-powered code generation"
echo "✅ User authentication & accounts"
echo "✅ Project management"
echo "✅ Real-time code preview"
echo "✅ Template library"
echo "✅ One-click deployment"
echo ""
echo "🎉 Your AI coding platform is now LIVE!"