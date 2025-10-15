import { defineConfig } from 'vite';
import { resolve } from 'path';

const minesRoot = resolve(__dirname, 'src/mines');

export default defineConfig({
  root: minesRoot,
  base: '/Frog-Web-Andrew/mines/',
  build: {
    outDir: resolve(__dirname, 'dist/mines'),
    emptyOutDir: true,
    assetsDir: 'assets',
    rollupOptions: {
      input: resolve(minesRoot, 'index.html'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  resolve: {
    alias: {
      '@': resolve(minesRoot, 'src'),
    },
  },
});

