import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Suhtelised varateed toetavad nii localhosti kui ka GitHub Pagesi repo alamteed.
  base: './',
  server: { allowedHosts: ['terminal.local'] },
});
