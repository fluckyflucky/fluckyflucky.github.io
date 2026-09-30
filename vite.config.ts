import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'
import { markdownIndexPlugin } from './vite-plugin-markdown-index'

export default defineConfig({
  plugins: [vue(), tailwindcss(), markdownIndexPlugin()],

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },

  server: {
    port: 3000,
    host: true,
    open: true,
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'esbuild',
    target: 'esnext',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules') && id.includes('matter-js')) {
            return 'game-physics'
          }
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        },
      },
    },
    reportCompressedSize: false,
  },
})
