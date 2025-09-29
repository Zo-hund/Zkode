#!/bin/bash

# ZKode Production Setup Script
# Sets up Cloudflare resources and environment variables for production deployment

set -e

echo "🚀 Setting up ZKode production environment..."

# Check if required tools are installed
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed." >&2; exit 1; }
command -v npx >/dev/null 2>&1 || { echo "❌ npx is required but not available." >&2; exit 1; }

# Check if user is logged in to Cloudflare
if ! npx wrangler whoami >/dev/null 2>&1; then
    echo "🔑 Please log in to Cloudflare..."
    npx wrangler login
fi

# Get account ID
ACCOUNT_ID=$(npx wrangler whoami 2>/dev/null | grep -E '^│.*│.*│$' | grep -v 'Account Name' | awk -F'│' '{print $3}' | tr -d ' ' || echo "")
if [ -z "$ACCOUNT_ID" ]; then
    echo "⚠️  Could not parse account ID automatically, checking wrangler.toml..."
    ACCOUNT_ID=$(grep "account_id" wrangler.toml | head -1 | sed 's/.*"\(.*\)".*/\1/')
    if [ -z "$ACCOUNT_ID" ] || [ "$ACCOUNT_ID" = "your-account-id-here" ]; then
        echo "❌ Could not determine Cloudflare account ID"
        echo "Please manually update wrangler.toml with your account ID from: npx wrangler whoami"
        exit 1
    fi
    echo "✅ Using account ID from wrangler.toml: $ACCOUNT_ID"
fi

echo "✅ Using Cloudflare account: $ACCOUNT_ID"

# Update wrangler.toml with account ID
sed -i.bak "s/account_id = \"your-account-id-here\"/account_id = \"$ACCOUNT_ID\"/g" wrangler.toml
echo "✅ Updated wrangler.toml with account ID"

echo ""
echo "📊 Creating Cloudflare D1 databases..."

# Create development database (skip if already exists)
echo "Checking development database..."
if npx wrangler d1 list | grep -q "zkode-db-dev"; then
    echo "✅ Development database already exists"
else
    echo "Creating development database..."
    DEV_DB_OUTPUT=$(npx wrangler d1 create zkode-db-dev 2>/dev/null || echo "exists")
    if [[ "$DEV_DB_OUTPUT" == *"database_id"* ]]; then
        DEV_DB_ID=$(echo "$DEV_DB_OUTPUT" | grep "database_id" | awk -F'"' '{print $4}')
        sed -i.bak "s/database_id = \"your-dev-db-id-here\"/database_id = \"$DEV_DB_ID\"/g" wrangler.toml
        echo "✅ Development database created: $DEV_DB_ID"
    fi
fi

# Create staging database (skip if already exists)
echo "Checking staging database..."
if npx wrangler d1 list | grep -q "zkode-db-staging"; then
    echo "✅ Staging database already exists"
else
    echo "Creating staging database..."
    STAGING_DB_OUTPUT=$(npx wrangler d1 create zkode-db-staging 2>/dev/null || echo "exists")
    if [[ "$STAGING_DB_OUTPUT" == *"database_id"* ]]; then
        STAGING_DB_ID=$(echo "$STAGING_DB_OUTPUT" | grep "database_id" | awk -F'"' '{print $4}')
        sed -i.bak "s/database_id = \"your-staging-db-id-here\"/database_id = \"$STAGING_DB_ID\"/g" wrangler.toml
        echo "✅ Staging database created: $STAGING_DB_ID"
    fi
fi

# Create production database (skip if already exists)
echo "Checking production database..."
if npx wrangler d1 list | grep -q "zkode-db-prod"; then
    echo "✅ Production database already exists"
else
    echo "Creating production database..."
    PROD_DB_OUTPUT=$(npx wrangler d1 create zkode-db-prod 2>/dev/null || echo "exists")
    if [[ "$PROD_DB_OUTPUT" == *"database_id"* ]]; then
        PROD_DB_ID=$(echo "$PROD_DB_OUTPUT" | grep "database_id" | awk -F'"' '{print $4}')
        sed -i.bak "s/database_id = \"your-prod-db-id-here\"/database_id = \"$PROD_DB_ID\"/g" wrangler.toml
        echo "✅ Production database created: $PROD_DB_ID"
    fi
fi

echo ""
echo "🪣 Creating R2 buckets..."

# Create R2 buckets
BUCKETS=("zkode-templates-dev" "zkode-templates-staging" "zkode-templates-prod" "zkode-projects-dev" "zkode-projects-staging" "zkode-projects-prod")

for bucket in "${BUCKETS[@]}"; do
    echo "Checking bucket: $bucket"
    if npx wrangler r2 bucket list | grep -q "$bucket"; then
        echo "✅ Bucket $bucket already exists"
    else
        echo "Creating bucket: $bucket"
        npx wrangler r2 bucket create "$bucket" 2>/dev/null || echo "⚠️  Failed to create bucket $bucket"
    fi
done

echo "✅ R2 buckets created"

echo ""
echo "🔐 Setting up secrets..."

# Generate JWT secret if not exists
if [ ! -f ".env.production" ]; then
    JWT_SECRET=$(openssl rand -base64 32 | tr -d '\n')
    API_SECRET=$(openssl rand -base64 32 | tr -d '\n')

    echo "Creating .env.production file..."
    cp .env.example .env.production
    # Use different delimiter to avoid issues with special characters
    sed -i.bak "s|your-jwt-secret-key-here|$JWT_SECRET|g" .env.production
    sed -i.bak "s|your-api-secret-key-here|$API_SECRET|g" .env.production
    sed -i.bak "s|your-account-id-here|$ACCOUNT_ID|g" .env.production

    echo "✅ Created .env.production with generated secrets"
else
    echo "⚠️  .env.production already exists, skipping generation"
fi

# Set secrets in Cloudflare
if [ -f ".env.production" ]; then
    source .env.production

    echo "Setting JWT_SECRET..."
    echo "$JWT_SECRET" | npx wrangler secret put JWT_SECRET --env production

    echo "Setting API_SECRET..."
    echo "$API_SECRET" | npx wrangler secret put API_SECRET --env production

    echo "✅ Secrets set in Cloudflare"
fi

echo ""
echo "🗃️ Running database migrations..."

# Run migrations for all environments
echo "Running development migrations..."
npm run db:migrate 2>/dev/null || echo "⚠️  Development migration failed - run manually later"

echo "Running staging migrations..."
npm run db:migrate:staging 2>/dev/null || echo "⚠️  Staging migration failed - run manually later"

echo "Running production migrations..."
npm run db:migrate:prod 2>/dev/null || echo "⚠️  Production migration failed - run manually later"

echo ""
echo "🌱 Seeding databases..."

# Seed databases
echo "Seeding development database..."
npm run db:seed 2>/dev/null || echo "⚠️  Development seeding failed - run manually later"

echo "Seeding staging database..."
npm run db:seed:staging 2>/dev/null || echo "⚠️  Staging seeding failed - run manually later"

echo ""
echo "🎉 Production setup complete!"
echo ""
echo "Next steps:"
echo "1. Update your DNS settings to point to Cloudflare"
echo "2. Configure custom domains in Cloudflare Dashboard"
echo "3. Review and update .env.production with your specific values"
echo "4. Test your deployment: npm run deploy:staging"
echo "5. Deploy to production: npm run deploy:prod"
echo ""
echo "📝 Important files updated:"
echo "   - wrangler.toml (with your account ID and database IDs)"
echo "   - .env.production (with generated secrets)"
echo ""
echo "🔍 Manual tasks to complete:"
echo "   - Set up custom domains in Cloudflare Dashboard"
echo "   - Configure DNS records"
echo "   - Set up monitoring and alerting"
echo "   - Configure CI/CD pipeline"
echo ""