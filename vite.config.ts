import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Bundle analyzer (only in analyze mode)
    process.env.ANALYZE === 'true' && visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Bundle optimization
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    
    // Chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-slot', 'class-variance-authority', 'clsx'],
          'animation-vendor': ['framer-motion'],
          'state-vendor': ['zustand'],
          'db-vendor': ['@supabase/supabase-js'],
        },
        // Optimize chunk naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    
    // Reduce bundle size
    chunkSizeWarningLimit: 1000,
  },
  
  // Development optimizations
  server: {
    hmr: true,
  },
  
  // Pre-bundling optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'framer-motion',
      'zustand',
      '@supabase/supabase-js'
    ],
  },
})
