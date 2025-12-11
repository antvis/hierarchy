import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'Hierarchy',
      formats: ['es', 'umd'],
      fileName: (format) => `hierarchy.${format}.js`,
    },
    outDir: 'dist',
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
  },
});
