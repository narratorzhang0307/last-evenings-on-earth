import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('/three/')) {
            return 'three-runtime';
          }
          if (id.includes('/react-globe.gl/') || id.includes('/three-globe/')) {
            return 'globe-runtime';
          }
          if (id.includes('/d3-') || id.includes('/topojson-')) {
            return 'geo-runtime';
          }
          return undefined;
        },
      },
    },
  },
  server: {
    host: '127.0.0.1',
    port: 3000,
  },
});
