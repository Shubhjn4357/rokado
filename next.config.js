/** @type {import('next').NextConfig} */
const nextConfig = process.env.BUILD === 'tauri' ? {
    output: 'export',      // Required for Tauri to bundle static files
    images: {
        unoptimized: true,   // Standard Next.js Image optimization won't work in SSG
    },
} : {};

export default nextConfig;
