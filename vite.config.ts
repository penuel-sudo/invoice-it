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
    minify: 'esbuild', // Fastest minifier - keep this one
    sourcemap: false,
    
    // Aggressive optimizations
    emptyOutDir: true,
    write: true,
    
    // Better chunking to reduce main bundle size
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Split the HEAVIEST libraries first
          if (id.includes('@react-pdf') || id.includes('react-pdf')) {
            return 'react-pdf' // Separate chunk for PDF library
          }
          if (id.includes('DefaultPreview')) {
            return 'default-preview'
          }
          if (id.includes('DefaultCreate')) {
            return 'default-create'
          }
          if (id.includes('DashboardPage')) {
            return 'dashboard-page'
          }
          if (id.includes('TransactionPage')) {
            return 'transaction-page'
          }
          if (id.includes('SettingsPage')) {
            return 'settings-page'
          }
          if (id.includes('lucide-react')) {
            return 'lucide-icons'
          }
          if (id.includes('@supabase')) {
            return 'supabase'
          }
          if (id.includes('framer-motion')) {
            return 'framer-motion'
          }
          if (id.includes('date-fns')) {
            return 'date-utils'
          }
          // Keep everything else in main bundle
          return undefined
        },
        // Optimized file naming
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    
    // Reduce processing overhead
    chunkSizeWarningLimit: 500, // More aggressive limit
    cssCodeSplit: true, // Enable CSS splitting for better caching
    reportCompressedSize: true,
    
    // Console removal handled by esbuild config below
    
    // Additional size optimizations
    // We'll handle externals later if needed
    
    // Additional optimizations
    // Console removal handled by esbuild config below
  },
  
  // Development optimizations
  server: {
    hmr: true,
    watch: {
      usePolling: false,
      ignored: ['**/node_modules/**', '**/dist/**']
    }
  },
  
  // Fast dependency optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'react-hot-toast'
    ],
    exclude: [
      '@radix-ui/react-use-layout-effect',
      'lucide-react', // Exclude - too heavy for main bundle
      '@supabase/supabase-js', // Exclude - will be in separate chunk
      'framer-motion', // Exclude - will be in separate chunk
      'date-fns' // Exclude - will be in separate chunk
    ]
  },
  
  // Tree shaking optimizations
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  
  // Tree shaking is handled by rollupOptions above
  
  // Skip type checking during build
  esbuild: {
    logLevel: 'error',
    drop: ['console', 'debugger'] // Remove console.log in production
  },
  
  // Cache optimization
  cacheDir: 'node_modules/.vite'
})
