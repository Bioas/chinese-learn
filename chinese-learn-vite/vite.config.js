import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // KEY FIX for ERR_CACHE_READ_FAILURE:
        // Previously, all HSK 1-7 imports were bundled into a single ~9 MB
        // `data-vocab` chunk that was too large for some browsers' disk cache.
        // Splitting per HSK level keeps the initial chunk tiny and lets each
        // level chunk cache independently (~500 KB-1 MB each).
        manualChunks(id) {
          // Heavy vendor libraries → separate chunk so they cache independently
          if (id.includes('hanzi-writer')) return 'vendor-hanzi';
          if (id.includes('supabase')) return 'vendor-supabase';
          if (id.includes('node_modules/react')) return 'vendor-react';
          if (id.includes('node_modules/react-dom')) return 'vendor-react';
          if (id.includes('node_modules/react-router')) return 'vendor-react';
          // Per-HSK level chunks. Each is small enough for browser cache.
          if (id.includes('src/data/hsk3/hsk1-words')) return 'data-hsk1';
          if (id.includes('src/data/hsk3/hsk2-words')) return 'data-hsk2';
          if (id.includes('src/data/hsk3/hsk3-words')) return 'data-hsk3';
          if (id.includes('src/data/hsk3/hsk4-words')) return 'data-hsk4';
          if (id.includes('src/data/hsk3/hsk5-words')) return 'data-hsk5';
          if (id.includes('src/data/hsk3/hsk6-words')) return 'data-hsk6';
          if (id.includes('src/data/hsk3/hsk7-words')) return 'data-hsk7';
          // Character metadata used by VocabPopup/WordMap — ~100 KB
          if (id.includes('src/data/characters')) return 'data-chars';
          // Conversation dialogues — kept separate so flashcard/quiz pages skip it
          if (id.includes('src/data/conversations')) return 'data-conv';
          // Remaining vocabulary assembly code (non-HSK topical categories)
          if (id.includes('src/data/vocabulary')) return 'data-vocab';
          if (id.includes('src/data/categories')) return 'data-vocab';
        },
      },
    },
    // Bump warning limit slightly so we still get alerted on truly huge chunks
    // but don't get spammed for normal-sized HSK data chunks.
    chunkSizeWarningLimit: 1500,
    // Ensure CSS is inlined where possible for faster FCP
    cssCodeSplit: false,
    // Minify aggressively
    minify: 'esbuild',
    // Target modern browsers so we can drop legacy polyfills
    target: 'es2020',
  },
})

