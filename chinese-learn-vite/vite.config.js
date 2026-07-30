import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Heavy vendor libraries → separate chunk so they cache independently
          if (id.includes('hanzi-writer')) return 'vendor-hanzi';
          if (id.includes('supabase')) return 'vendor-supabase';
          if (id.includes('boxicons')) return 'vendor-icons';
          if (id.includes('node_modules/react')) return 'vendor-react';
          if (id.includes('node_modules/react-dom')) return 'vendor-react';
          if (id.includes('node_modules/react-router')) return 'vendor-react';
          // Vocabulary data is large (3000+ words) → separate so other pages don't pay for it
          if (id.includes('src/data/vocabulary')) return 'data-vocab';
          if (id.includes('src/data/conversations')) return 'data-conv';
        },
      },
    },
    // Ensure CSS is inlined where possible for faster FCP
    cssCodeSplit: false,
    // Minify aggressively
    minify: 'esbuild',
    // Target modern browsers so we can drop legacy polyfills
    target: 'es2020',
  },
})
