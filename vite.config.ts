import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    cssInjectedByJsPlugin(),
    svgr({
      include: "**/*.svg?react"
    }),
    dts({
      include: ['src/components'],
      exclude: ['src/demo'],
      insertTypesEntry: true
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/components/index.ts'),
      name: 'ReactMacOSUI',
      formats: ['es', 'umd', 'cjs'],
      fileName: (format) => {
        switch (format) {
          case 'es':
            return 'es/index.js';
          case 'umd':
            return 'umd/index.js';
          case 'cjs':
            return 'cjs/index.js';
        }
      }
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    },
    sourcemap: false,
  }
}); 