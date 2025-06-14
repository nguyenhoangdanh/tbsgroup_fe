/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: process.env.NODE_ENV === 'production',
    swcMinify: true,
    poweredByHeader: false,
    compress: true,
    output: 'standalone',
    productionBrowserSourceMaps: false,

    env: {
        CUSTOM_BUILD_TIME: new Date().toISOString(),
        CUSTOM_BUILD_VERSION: process.env.npm_package_version || '1.0.0',
    },

    async headers() {
        const isProduction = process.env.NODE_ENV === 'production';
        const apiDomain = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
        
        const securityHeaders = [
            { key: 'X-DNS-Prefetch-Control', value: 'off' },
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
            { key: 'X-XSS-Protection', value: '1; mode=block' },
        ];

        // Add CORS headers for production
        if (isProduction) {
            securityHeaders.push(
                { key: 'Access-Control-Allow-Credentials', value: 'true' },
                { key: 'Access-Control-Allow-Origin', value: apiDomain },
                { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, PATCH, OPTIONS' },
                { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, Cookie' }
            );
        }

        if (isProduction) {
            securityHeaders.push(
                { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
                {
                    key: 'Content-Security-Policy',
                    value: [
                        "default-src 'self'",
                        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://cdnjs.cloudflare.com",
                        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                        "font-src 'self' https://fonts.gstatic.com",
                        "img-src 'self' data: https:",
                        `connect-src 'self' ${apiDomain} https://tbsgroup-be.vercel.app wss:`,
                        "frame-ancestors 'none'",
                        "base-uri 'self'",
                        "form-action 'self'",
                        "report-uri /api/csp-report"
                    ].join('; ')
                }
            );
        } else {
            // More permissive CSP for development
            securityHeaders.push({
                key: 'Content-Security-Policy',
                value: [
                    "default-src 'self'",
                    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
                    "style-src 'self' 'unsafe-inline'",
                    "font-src 'self' data:",
                    "img-src 'self' data: https:",
                    "connect-src 'self' http://localhost:* https://tbsgroup-be.vercel.app wss:",
                    "frame-ancestors 'none'"
                ].join('; ')
            });
        }

        return [{ source: '/(.*)', headers: securityHeaders }];
    },

    async rewrites() {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';
        return [
            { source: '/api/auth/:path*', destination: `${apiBaseUrl}/auth/:path*` },
            { source: '/api/users/:path*', destination: `${apiBaseUrl}/users/:path*` },
            { source: '/api/roles/:path*', destination: `${apiBaseUrl}/roles/:path*` },
        ];
    },

    async redirects() {
        return [
            { source: '/admin', destination: '/admin/dashboard', permanent: true },
            { source: '/dashboard', destination: '/admin/dashboard', permanent: true },
        ];
    },

    images: {
        domains: ['localhost'],
        formats: ['image/webp', 'image/avif'],
        minimumCacheTTL: 60,
        dangerouslyAllowSVG: true,
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    },

    webpack: (config, { dev }) => {
        if (!dev) {
            config.optimization.usedExports = true;
        }
        config.resolve.alias = {
            ...config.resolve.alias,
            '@': require('path').resolve(__dirname),
        };
        return config;
    },

    typescript: { ignoreBuildErrors: false },
    eslint: { ignoreDuringBuilds: false },
};

module.exports = nextConfig;