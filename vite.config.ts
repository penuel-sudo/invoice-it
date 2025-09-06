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
    // Ultra-fast build settings
    target: 'esnext',
    minify: 'esbuild', // Fastest minifier
    sourcemap: false,
    
    // Aggressive optimizations
    emptyOutDir: true,
    write: true,
    
    // Simplified chunking for speed
    rollupOptions: {
      output: {
        manualChunks: {
          // Group all vendor code into fewer chunks for faster builds
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-avatar', 
            '@radix-ui/react-collapsible',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-navigation-menu'
          ],
          'supabase-vendor': ['@supabase/supabase-js'],
          'utils-vendor': ['framer-motion', 'lucide-react', 'react-hot-toast', 'zustand']
        },
        // Simplified file naming
        chunkFileNames: 'assets/[name].js',
        entryFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    },
    
    // Reduce processing overhead
    chunkSizeWarningLimit: 2000,
    cssCodeSplit: false, // Faster builds
    reportCompressedSize: false
  },
  
  // Development optimizations
  server: {
    hmr: true,
    watch: {
      usePolling: false,
      ignored: ['**/node_modules/**', '**/dist/**']
    }
  },
  
  // Aggressive dependency optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'framer-motion',
      'lucide-react',
      'react-hot-toast',
      'zustand'
    ],
    exclude: ['@radix-ui/react-use-layout-effect'], // Exclude problematic deps
    force: true // Force re-optimization
  },
  
  // Skip type checking during build
  esbuild: {
    logLevel: 'error'
  },
  
  // Cache optimization
  cacheDir: 'node_modules/.vite'
})
