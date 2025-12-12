import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  root: 'demo',
  plugins: [
    dts({
      include: ['src/**/*.ts'],
      outDir: '../lib',
      rollupTypes: true,
      copyDtsFiles: true,
    }),
  ],
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
