import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Optimize build performance
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    
    // Faster builds
    emptyOutDir: true,
    
    // Code splitting and chunk optimization
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // More granular chunking for better caching
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor'
            }
            if (id.includes('@supabase')) {
              return 'supabase-vendor'
            }
            if (id.includes('@radix-ui')) {
              return 'ui-vendor'
            }
            if (id.includes('framer-motion')) {
              return 'animation-vendor'
            }
            if (id.includes('react-hook-form') || id.includes('zod')) {
              return 'form-vendor'
            }
            if (id.includes('lucide-react')) {
              return 'icons-vendor'
            }
            return 'vendor'
          }
        },
        // Optimize chunk names
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    
    // Optimize CSS
    cssCodeSplit: true,
    
    // Reduce bundle size
    reportCompressedSize: false
  },
  
  // Development optimizations
  server: {
    hmr: true,
    watch: {
      usePolling: false
    }
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'framer-motion',
      'lucide-react'
    ]
  }
})
