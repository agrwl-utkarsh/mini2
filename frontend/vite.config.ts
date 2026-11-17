import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor'
            }
            if (id.includes('@tanstack/react-query')) {
              return 'query'
            }
            if (id.includes('lucide-react') || id.includes('framer-motion')) {
              return 'ui'
            }
            if (id.includes('shiki')) {
              return 'shiki'
            }
            return 'vendor'
          }
        },
      },
    },
  },
  server: {
    port: 5173,
    open: true,
  },
})