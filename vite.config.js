import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-ai': ['marked', 'highlight.js'],
          'vendor-net': ['paho-mqtt']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['paho-mqtt']
  }
});
