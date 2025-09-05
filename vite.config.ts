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
    
    // Code splitting and chunk optimization
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-label', '@radix-ui/react-select', '@radix-ui/react-slot'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'animation-vendor': ['framer-motion'],
          'utils-vendor': ['clsx', 'tailwind-merge', 'class-variance-authority', 'lucide-react']
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
