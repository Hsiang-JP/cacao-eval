import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  // Use '.' instead of process.cwd() to avoid TS error "Property 'cwd' does not exist on type 'Process'"
  const env = loadEnv(mode, '.', '');
  return {
    base: '/cacao-TDS/', // Explicit base path for GitHub Pages project site
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['logo-cacao.svg', 'favicon.png'],
        manifest: {
          name: 'CoEx Digital Grading',
          short_name: 'CoEx Grading',
          description: 'Cacao of Excellence Digital Evaluation Form - Professional Sensory Analysis Tool',
          theme_color: '#754c29',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          start_url: './',
          id: '/',
          icons: [
            {
              src: 'logo-cacao.svg',
              sizes: '192x192',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            },
            {
              src: 'logo-cacao.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            },
            {
              src: 'logo-cacao.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': '/src'
      }
    },
    server: {
      host: true
    }
  };
});