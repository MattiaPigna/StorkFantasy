
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Inietta variabili d'ambiente in modo sicuro
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
    'process.env': JSON.stringify({})
  },
  base: '/', 
  server: {
    port: 3000
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext'
  }
});
