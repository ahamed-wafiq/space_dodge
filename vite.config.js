import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom', 'three']
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'three', 'three/addons/loaders/GLTFLoader.js', 'lucide-react'],
    force: true
  },
  server: {
    port: 5001,
    open: false,
    host: true
  }
});
