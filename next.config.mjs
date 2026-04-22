/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack (default bundler in Next.js 16 for both `next dev` and
  // `next build`). raw-loader turns GLSL shader files into string modules
  // so they can be imported directly: `import src from './x.frag.glsl'`.
  turbopack: {
    rules: {
      '*.glsl': { loaders: ['raw-loader'], as: '*.js' },
      '*.vert': { loaders: ['raw-loader'], as: '*.js' },
      '*.frag': { loaders: ['raw-loader'], as: '*.js' },
    },
  },

  // Webpack fallback — used when `next build --webpack` is passed
  // explicitly. Mirrors the Turbopack rule above using webpack 5's
  // built-in `asset/source` type (no extra loader needed).
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(glsl|vert|frag)$/,
      type: 'asset/source',
    });
    return config;
  },
};

export default nextConfig;
