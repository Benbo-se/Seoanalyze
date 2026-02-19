import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const staticConfig = {
  output: 'export',
  distDir: 'dist',
  trailingSlash: false,

  // Image optimization not supported with static export
  images: {
    unoptimized: true,
  },

  // Webpack alias
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './src'),
    };
    return config;
  },
};

export default staticConfig;
