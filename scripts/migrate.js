#!/usr/bin/env node

/**
 * Database Migration Script for ZKode
 * Runs migrations against Cloudflare D1 database
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Migration files in order
const migrations = [
  '001_initial_schema.sql',
  '002_api_tracking.sql'
];

async function runMigration(migrationFile, env = 'dev') {
  console.log(`Running migration: ${migrationFile}`);

  try {
    const migrationPath = join(__dirname, '..', 'database', 'migrations', migrationFile);
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    // Get the correct database name based on environment
    const dbName = env === 'production' ? 'zkode-db-prod' :
                   env === 'staging' ? 'zkode-db-staging' : 'zkode-db-dev';

    console.log(`Executing migration from file: ${migrationFile}`);

    // Use wrangler d1 execute with --file option
    const { spawn } = await import('child_process');

    await new Promise((resolve, reject) => {
      const args = [
        'wrangler', 'd1', 'execute', dbName,
        '--file', migrationPath
      ];

      // Add environment flag if not dev
      if (env !== 'dev') {
        args.push('--env', env);
      }

      const child = spawn('npx', args, {
        stdio: ['inherit', 'inherit', 'inherit']
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Migration failed with code ${code}`));
        }
      });

      child.on('error', (error) => {
        reject(new Error(`Failed to start migration: ${error.message}`));
      });
    });

    console.log(`✅ Migration ${migrationFile} completed successfully`);
  } catch (error) {
    console.error(`❌ Migration ${migrationFile} failed:`, error.message);
    throw error;
  }
}

async function runAllMigrations(env = 'dev') {
  console.log(`🚀 Starting database migrations for environment: ${env}`);

  for (const migration of migrations) {
    await runMigration(migration, env);
  }

  console.log('🎉 All migrations completed successfully!');
}

// CLI interface
const args = process.argv.slice(2);
const env = args.find(arg => arg.startsWith('--env='))?.split('=')[1] || 'dev';
const migrationFile = args.find(arg => !arg.startsWith('--'));

if (migrationFile) {
  // Run specific migration
  runMigration(migrationFile, env).catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
} else {
  // Run all migrations
  runAllMigrations(env).catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}