
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Inietta le variabili d'ambiente in modo che siano accessibili alle librerie
    'process.env': process.env
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
