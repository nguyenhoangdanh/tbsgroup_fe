const fs = require('fs');
const path = require('path');

const requiredEnvVars = {
    development: [
        'NEXT_PUBLIC_API_BASE_URL',
    ],
    production: [
        'NEXT_PUBLIC_API_BASE_URL',
        'NEXT_PUBLIC_AUTH_COOKIE_DOMAIN',
    ],
    optional: [
        'NEXT_PUBLIC_GA_ID',
        'NEXT_PUBLIC_SENTRY_DSN',
        'NEXT_PUBLIC_HOTJAR_ID',
        'NEXT_PUBLIC_ENABLE_PWA',
        'NEXT_PUBLIC_ENABLE_ANALYTICS',
        'NEXT_PUBLIC_ENVIRONMENT',
    ]
};

function validateEnvironment() {
    const environment = process.env.NODE_ENV || 'development';
    const isProduction = environment === 'production';

    console.log(`🔍 Validating environment variables for: ${environment}`);

    // Check if .env files exist
    const envFiles = ['.env.local', '.env'];
    const existingEnvFiles = envFiles.filter(file =>
        fs.existsSync(path.join(process.cwd(), file))
    );

    if (existingEnvFiles.length === 0) {
        console.warn('⚠️  No .env files found. Creating .env.local from example...');

        const examplePath = path.join(process.cwd(), '.env.example');
        const localPath = path.join(process.cwd(), '.env.local');

        if (fs.existsSync(examplePath)) {
            fs.copyFileSync(examplePath, localPath);
            console.log('✅ Created .env.local from .env.example');
        } else {
            console.warn('⚠️  No .env.example found. Please create environment variables manually.');
        }
    }

    // Load environment variables
    require('dotenv').config({ path: '.env.local' });
    require('dotenv').config({ path: '.env' });

    const requiredVars = isProduction
        ? requiredEnvVars.production
        : requiredEnvVars.development;

    const missingVars = [];
    const presentVars = [];

    requiredVars.forEach(varName => {
        if (!process.env[varName]) {
            missingVars.push(varName);
        } else {
            presentVars.push(varName);
        }
    });

    // Check optional variables
    const optionalPresent = [];
    requiredEnvVars.optional.forEach(varName => {
        if (process.env[varName]) {
            optionalPresent.push(varName);
        }
    });

    // Report results
    console.log(`\n📋 Environment Variables Status:`);
    console.log(`Environment: ${environment}`);
    console.log(`Required variables (${presentVars.length}/${requiredVars.length}):`);

    presentVars.forEach(varName => {
        const value = process.env[varName];
        const displayValue = varName.toLowerCase().includes('secret') || varName.toLowerCase().includes('key')
            ? '***hidden***'
            : value.length > 50 ? `${value.substring(0, 47)}...` : value;
        console.log(`  ✅ ${varName}=${displayValue}`);
    });

    if (missingVars.length > 0) {
        console.log(`\n❌ Missing required variables:`);
        missingVars.forEach(varName => {
            console.log(`  ❌ ${varName}`);
        });
    }

    if (optionalPresent.length > 0) {
        console.log(`\n🔧 Optional variables present:`);
        optionalPresent.forEach(varName => {
            console.log(`  ✅ ${varName}`);
        });
    }

    // Validate specific values
    const validationErrors = [];

    if (process.env.NEXT_PUBLIC_API_BASE_URL) {
        try {
            new URL(process.env.NEXT_PUBLIC_API_BASE_URL);
        } catch {
            validationErrors.push('NEXT_PUBLIC_API_BASE_URL must be a valid URL');
        }
    }

    if (validationErrors.length > 0) {
        console.log(`\n❌ Validation errors:`);
        validationErrors.forEach(error => {
            console.log(`  ❌ ${error}`);
        });
    }

    // Exit with error if missing required variables
    if (missingVars.length > 0 || validationErrors.length > 0) {
        console.log(`\n💡 To fix missing variables:`);
        console.log(`1. Copy .env.example to .env.local: cp .env.example .env.local`);
        console.log(`2. Edit .env.local with your actual values`);
        console.log(`3. Run this script again: npm run env:validate`);

        if (process.env.CI !== 'true' && process.env.NODE_ENV !== 'development') {
            process.exit(1);
        }
    } else {
        console.log(`\n✅ All environment variables are valid!`);
    }
}

// Run if called directly
if (require.main === module) {
    validateEnvironment();
}

module.exports = { validateEnvironment };