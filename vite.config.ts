import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  // Use '.' instead of process.cwd() to avoid TS error "Property 'cwd' does not exist on type 'Process'"
  const env = loadEnv(mode, '.', '');
  return {
    base: './', // Use relative paths for GitHub Pages compatibility
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['logo-cacao.svg', 'favicon.png'],
        manifest: {
          name: 'CoEx Digital Grading',
          short_name: 'CoEx Grading',
          description: 'Cacao of Excellence Digital Evaluation Form',
          theme_color: '#754c29',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          icons: [
            {
              src: 'logo-cacao.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            },
            {
              src: 'favicon.png',
              sizes: '192x192', // Assuming it's at least standard size, or 'any' if unsure
              type: 'image/png'
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