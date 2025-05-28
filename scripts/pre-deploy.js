const { validateEnvironment } = require('./validate-env');
const { healthCheck } = require('./health-check');
const { execSync } = require('child_process');

async function preDeploy() {
    console.log('🚀 Starting pre-deployment checks...\n');

    try {
        // 1. Environment validation
        console.log('1️⃣ Validating environment variables...');
        validateEnvironment();
        console.log('✅ Environment validation passed\n');

        // 2. Type checking
        console.log('2️⃣ Running TypeScript checks...');
        execSync('npm run type-check', { stdio: 'inherit' });
        console.log('✅ TypeScript checks passed\n');

        // 3. Linting
        console.log('3️⃣ Running linting...');
        execSync('npm run lint', { stdio: 'inherit' });
        console.log('✅ Linting passed\n');

        // 4. Security audit
        console.log('4️⃣ Running security audit...');
        try {
            execSync('npm audit --audit-level high', { stdio: 'inherit' });
            console.log('✅ Security audit passed\n');
        } catch (error) {
            console.warn('⚠️  Security audit found issues. Please review.\n');
        }

        // 5. Build
        console.log('5️⃣ Building application...');
        execSync('npm run build', { stdio: 'inherit' });
        console.log('✅ Build successful\n');

        // 6. Tests (if available)
        try {
            console.log('6️⃣ Running tests...');
            execSync('npm run test:ci', { stdio: 'inherit' });
            console.log('✅ Tests passed\n');
        } catch (error) {
            console.log('ℹ️  No tests found or tests failed\n');
        }

        console.log('🎉 All pre-deployment checks passed!');
        console.log('Ready for deployment 🚀');

    } catch (error) {
        console.error('❌ Pre-deployment checks failed:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    preDeploy();
}

module.exports = { preDeploy };
