/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    eslint: {
        // Tắt kiểm tra ESLint trong quá trình build nếu gặp vấn đề với ESLint
        // ignoreDuringBuilds: true,

        // Chỉ định các thư mục cần kiểm tra
        dirs: [
            'app',
            'components',
            'common',
            'contexts',
            'hooks',
            'redux',
            'screens',
            'services',
            'apis',
            'schemas',
        ],
    },
    // Cấu hình môi trường
    env: {
        // Thêm các biến môi trường ở đây nếu cần
    },
    // Các cấu hình khác
    images: {
        domains: [
            // Thêm các domain cho next/image nếu cần
        ],
    },
    // Cấu hình chỉ định ESLint sử dụng flat config
    experimental: {
        // Bật tính năng này nếu bạn muốn sử dụng định dạng ESLint flat config
        // eslintExternalConfig: true,
    },
};

export default nextConfig;