import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Production build configuration
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          monaco: ['@monaco-editor/react']
        }
      }
    }
  },

  // Environment variables
  define: {
    __API_BASE_URL__: JSON.stringify(process.env.VITE_API_BASE_URL || 'http://localhost:8787'),
    __ENVIRONMENT__: JSON.stringify(process.env.VITE_ENVIRONMENT || 'development')
  },

  // Development server
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    allowedHosts: 'all'
  },

  // Preview server (for production builds)
  preview: {
    port: 4173,
    strictPort: true,
    host: true
  }
})
