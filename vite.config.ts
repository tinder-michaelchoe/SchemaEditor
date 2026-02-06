import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-styled-components', { displayName: true, fileName: false }]],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@clads-preview': path.resolve(__dirname, 'src/lib/clads-preview'),
    },
  },
  server: {
    // Force dependency pre-bundling to refresh when files change
    force: true,
    proxy: {
      '/api/litellm': {
        target: 'https://litellmtokengateway.ue1.d1.tstaging.tools',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/litellm/, ''),
        secure: true,
      }
    }
  },
  optimizeDeps: {
    // Disable dependency caching to avoid stale module issues
    force: true,
  },
})
