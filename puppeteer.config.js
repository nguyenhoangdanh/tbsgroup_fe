// File: puppeteer.config.js
/**
 * Configuration for Puppeteer on Vercel serverless functions
 * This helps optimize Puppeteer for serverless environments
 */

module.exports = {
    // Use the Chromium bundled with Puppeteer
    executablePath: process.env.NODE_ENV === 'production'
        ? '/tmp/chromium'
        : undefined,
    // Chrome flags to optimize for serverless environment
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-extensions',
    ],
    // Disable default timeout
    timeout: 0,
};