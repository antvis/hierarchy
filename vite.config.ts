import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'demo',
  build: {
    target: 'es2020',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'Hierarchy',
      formats: ['es', 'umd'],
      fileName: (format) => `hierarchy.${format}.js`,
    },
    outDir: '../dist',
    sourcemap: true,
    minify: 'terser',
    rollupOptions: {
      output: {
        exports: 'named',
      },
    },
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    open: true,
    port: 3000,
  },
});
